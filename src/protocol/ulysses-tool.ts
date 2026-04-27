import { z } from "zod";
import type { ProtocolHandler } from "./handler.js";
import type { InMemoryProtocolHandler } from "./in-memory-handler.js";
import type { ThoughtHandler } from "../thought-handler.js";
import type { KnowledgeStorage } from "../knowledge/types.js";

const validatorRefSchema = z.object({
  notebookId: z.string(),
  cellId: z.string(),
});

export const ulyssesToolInputSchema = z.object({
  operation: z.enum([
    "init",
    "plan",
    "outcome",
    "reflect",
    "status",
    "complete",
    "bind_final_validator",
  ]),
  problem: z.string().optional().describe("Problem description for init"),
  constraints: z.array(z.string()).optional().describe("Known constraints for init"),
  primary: z.string().optional().describe("Primary action step for plan"),
  recovery: z.string().optional().describe("Pre-committed recovery step for plan"),
  irreversible: z.boolean().optional().describe("Whether primary step is irreversible for plan"),
  primaryValidator: validatorRefSchema.optional()
    .describe("Notebook code cell that decides the primary step's outcome (required on plan)"),
  recoveryValidator: validatorRefSchema.optional()
    .describe("Notebook code cell that decides the recovery step's outcome (required on plan)"),
  observed: z.unknown().optional()
    .describe("JSON-serialisable observed value piped into the bound validator on outcome / complete(resolved)"),
  notebookId: z.string().optional()
    .describe("Notebook id for bind_final_validator"),
  cellId: z.string().optional()
    .describe("Cell id for bind_final_validator"),
  details: z.string().optional().describe("Details for outcome"),
  hypothesis: z.string().optional().describe("Falsifiable hypothesis for reflect"),
  falsification: z.string().optional().describe("Disproof criteria for reflect"),
  terminalState: z.enum(["resolved", "insufficient_information", "environment_compromised"]).optional()
    .describe("Terminal state for complete"),
  summary: z.string().optional().describe("Summary for complete"),
});

export type UlyssesToolInput = z.infer<typeof ulyssesToolInputSchema>;

export const ULYSSES_TOOL = {
  name: "thoughtbox_ulysses",
  description: `Ulysses Protocol: state-step-gated debugging for autonomous agents. Tracks position in the plan→execute→evaluate cycle. Prevents debugging spirals by forcing reflection after two consecutive unexpected outcomes.

S (state step) tracks where you are in the cycle:
- S=0: At a checkpoint. Clean state. Form hypothesis: primary move + backup move.
- S=1: Plan submitted. Primary move executing.
- S=2: Primary produced unexpected outcome. Backup executing — OR both produced unexpected outcomes (active_step null), reflect required.

Full cycle:
1. At S=0, form hypothesis (primary move + backup move)
2. Create git branch, S→1, execute primary move
3. Git commit. Expected outcome? → S→0, log checkpoint. Unexpected? → S→2, execute backup
4. Git commit. Expected outcome? → S→0, log checkpoint. Unexpected? → S=2 → reset to last checkpoint, S→0, reflect, forbid those moves, start over

Operations:
- init: Start a debugging session (args: { problem, constraints? })
- plan: Record primary move + pre-committed backup move with validator cells (args: { primary, recovery, irreversible?, primaryValidator: { notebookId, cellId }, recoveryValidator: { notebookId, cellId } })
- outcome: Report observed data; the bound validator runs and its verdict drives the state machine (args: { observed: <any JSON>, details? })
- reflect: Form falsifiable hypothesis when S=2 — both moves failed (args: { hypothesis, falsification })
- bind_final_validator: Pin a final validator cell that gates complete(resolved) (args: { notebookId, cellId })
- status: Show current session state (S state step, active move, checkpoint history)
- complete: End session. terminalState='resolved' is hard-gated by the final validator if bound (args: { terminalState, summary?, observed? })

Validator cell contract: read process.env.TB_OBSERVED_PATH and write a verdict to process.env.TB_VERDICT_PATH. Use the auto-materialised helper:
  import { observed, pass, fail } from "./tb-validate.js";
  const d = observed<{ errors: number }>();
  d.errors === 0 ? pass("clean run") : fail(\`\${d.errors} errors\`, d);`,
  inputSchema: ulyssesToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class UlyssesTool {
  private activeSessionId: string | null = null;

  constructor(
    private handler: ProtocolHandler | InMemoryProtocolHandler,
    private thoughtHandler?: ThoughtHandler,
    private knowledgeStorage?: KnowledgeStorage,
  ) {}

  async handle(input: UlyssesToolInput) {
    let result: Record<string, unknown>;

    switch (input.operation) {
      case "init": {
        result = await this.handler.ulyssesInit(
          input.problem!,
          input.constraints,
        );
        this.activeSessionId = result.session_id as string;
        await this.bridgeThought(
          `[Ulysses:init] Debugging session started. Problem: ${input.problem}${input.constraints?.length ? `. Constraints: ${input.constraints.join(', ')}` : ''}`,
          'action_report',
        );
        break;
      }
      case "plan": {
        const sid = this.requireSession();
        if (!input.primaryValidator || !input.recoveryValidator) {
          throw new Error(
            'plan requires both primaryValidator and recoveryValidator { notebookId, cellId }.',
          );
        }
        result = await this.handler.ulyssesPlan(sid, {
          primary: input.primary!,
          recovery: input.recovery!,
          irreversible: input.irreversible ?? false,
          primaryValidator: input.primaryValidator,
          recoveryValidator: input.recoveryValidator,
        });
        await this.bridgeThought(
          `[Ulysses:plan] Primary: ${input.primary}. Recovery: ${input.recovery}${input.irreversible ? ' (IRREVERSIBLE)' : ''}. ` +
            `Validators: primary=${input.primaryValidator.cellId}, recovery=${input.recoveryValidator.cellId}.`,
          'decision_frame',
        );
        break;
      }
      case "outcome": {
        const sid = this.requireSession();
        if (!('observed' in input)) {
          throw new Error(
            'outcome requires observed (any JSON-serialisable value) — the bound validator decides the assessment.',
          );
        }
        result = await this.handler.ulyssesOutcome(sid, {
          observed: input.observed,
          details: input.details,
        });
        const derived = result.assessment as string | undefined;
        await this.bridgeThought(
          `[Ulysses:outcome] Validator verdict: ${derived ?? 'unknown'}${input.details ? `. ${input.details}` : ''}`,
          derived === 'expected' ? 'action_report' : 'reasoning',
        );
        break;
      }
      case "bind_final_validator": {
        const sid = this.requireSession();
        if (!input.notebookId || !input.cellId) {
          throw new Error(
            'bind_final_validator requires notebookId and cellId.',
          );
        }
        result = await this.handler.ulyssesBindFinalValidator(sid, {
          notebookId: input.notebookId,
          cellId: input.cellId,
        });
        await this.bridgeThought(
          `[Ulysses:bind_final_validator] Final validator pinned: notebook ${input.notebookId} cell ${input.cellId}.`,
          'decision_frame',
        );
        break;
      }
      case "reflect": {
        const sid = this.requireSession();
        result = await this.handler.ulyssesReflect(sid, {
          hypothesis: input.hypothesis!,
          falsification: input.falsification!,
        });
        await this.bridgeThought(
          `[Ulysses:reflect] Hypothesis: ${input.hypothesis}. Falsification: ${input.falsification}`,
          'reasoning',
        );
        await this.bridgeReflectionKnowledge(
          input.hypothesis!,
          input.falsification!,
        );
        break;
      }
      case "status": {
        result = await this.handler.ulyssesStatus();
        break;
      }
      case "complete": {
        const sid = this.requireSession();
        result = await this.handler.ulyssesComplete(
          sid,
          input.terminalState!,
          input.summary,
          input.observed,
        );
        await this.bridgeThought(
          `[Ulysses:complete] Session ended: ${input.terminalState}${input.summary ? `. ${input.summary}` : ''}`,
          'action_report',
        );
        await this.bridgeKnowledge(input.terminalState!, input.summary);
        this.activeSessionId = null;
        break;
      }
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  }

  private requireSession(): string {
    if (!this.activeSessionId) {
      throw new Error('No active Ulysses session. Call init first.');
    }
    return this.activeSessionId;
  }

  private async bridgeThought(
    content: string,
    thoughtType: 'reasoning' | 'decision_frame' | 'action_report',
  ): Promise<void> {
    if (!this.thoughtHandler) return;
    if (!this.thoughtHandler.getCurrentSessionId()) return;
    try {
      await this.thoughtHandler.processThought({
        thought: content,
        thoughtType,
        nextThoughtNeeded: true,
      });
    } catch {
      // Bridge failure is non-fatal — protocol operation already succeeded
    }
  }

  private async bridgeKnowledge(
    terminalState: string,
    summary?: string,
  ): Promise<void> {
    if (!this.knowledgeStorage) return;
    if (!summary) return;
    try {
      const entity = await this.knowledgeStorage.createEntity({
        name: `Ulysses: ${summary.slice(0, 80)}`,
        type: 'Insight',
        label: `Debugging ${terminalState}`,
        properties: {
          protocol: 'ulysses',
          terminalState,
          protocolSessionId: this.activeSessionId,
        },
      });
      await this.knowledgeStorage.addObservation({
        entity_id: entity.id,
        content: summary,
        source_session: this.thoughtHandler?.getCurrentSessionId() ?? undefined,
      });
    } catch {
      // Bridge failure is non-fatal
    }
  }

  private async bridgeReflectionKnowledge(
    hypothesis: string,
    falsification: string,
  ): Promise<void> {
    if (!this.knowledgeStorage) return;
    try {
      const entity = await this.knowledgeStorage.createEntity({
        name: `Ulysses hypothesis: ${hypothesis.slice(0, 80)}`,
        type: 'Insight',
        label: 'Ulysses reflection',
        properties: {
          protocol: 'ulysses',
          protocolSessionId: this.activeSessionId,
          falsification,
        },
      });
      await this.knowledgeStorage.addObservation({
        entity_id: entity.id,
        content: `Hypothesis: ${hypothesis}\nFalsification: ${falsification}`,
        source_session: this.thoughtHandler?.getCurrentSessionId() ?? undefined,
      });
    } catch {
      // Bridge failure is non-fatal
    }
  }
}
