import { z } from "zod";
import type { ProtocolHandler } from "./handler.js";
import type { InMemoryProtocolHandler } from "./in-memory-handler.js";
import type { ThoughtHandler } from "../thought-handler.js";
import type { KnowledgeStorage } from "../knowledge/types.js";

export const ulyssesToolInputSchema = z.object({
  operation: z.enum(["init", "plan", "outcome", "reflect", "status", "complete"]),
  problem: z.string().optional().describe("Problem description for init"),
  constraints: z.array(z.string()).optional().describe("Known constraints for init"),
  primary: z.string().optional().describe("Primary action step for plan"),
  recovery: z.string().optional().describe("Pre-committed recovery step for plan"),
  irreversible: z.boolean().optional().describe("Whether primary step is irreversible for plan"),
  assessment: z.enum(["expected", "unexpected-favorable", "unexpected-unfavorable"]).optional()
    .describe("Outcome assessment"),
  severity: z.number().min(1).max(2).optional().describe("Surprise severity (1=minor, 2=major)"),
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
  description: `Ulysses Protocol: surprise-gated debugging for autonomous agents. Forces pre-committed recovery, rigorous surprise assessment, and falsifiable hypotheses.

Operations:
- init: Start a debugging session (args: { problem, constraints? })
- plan: Record primary action + pre-committed recovery step (args: { primary, recovery, irreversible? })
- outcome: Assess step result and update surprise state (args: { assessment, severity?, details? })
- reflect: Form falsifiable hypothesis when S=2 (args: { hypothesis, falsification })
- status: Show current session state (S register, active step, surprise register)
- complete: End session with terminal status (args: { terminalState: "resolved"|"insufficient_information"|"environment_compromised", summary? })`,
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
        result = await this.handler.ulyssesPlan(sid, {
          primary: input.primary!,
          recovery: input.recovery!,
          irreversible: input.irreversible ?? false,
        });
        await this.bridgeThought(
          `[Ulysses:plan] Primary: ${input.primary}. Recovery: ${input.recovery}${input.irreversible ? ' (IRREVERSIBLE)' : ''}`,
          'decision_frame',
        );
        break;
      }
      case "outcome": {
        const sid = this.requireSession();
        result = await this.handler.ulyssesOutcome(sid, {
          assessment: input.assessment!,
          severity: input.severity,
          details: input.details,
        });
        await this.bridgeThought(
          `[Ulysses:outcome] Assessment: ${input.assessment}${input.severity ? ` (severity ${input.severity})` : ''}${input.details ? `. ${input.details}` : ''}`,
          input.assessment === 'expected' ? 'action_report' : 'reasoning',
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
        if (result.session_id) {
          this.activeSessionId = result.session_id as string;
        }
        break;
      }
      case "complete": {
        const sid = this.requireSession();
        result = await this.handler.ulyssesComplete(
          sid,
          input.terminalState!,
          input.summary,
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
