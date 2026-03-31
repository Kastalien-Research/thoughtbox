import { z } from "zod";
import type { ProtocolHandler } from "./handler.js";
import type { InMemoryProtocolHandler } from "./in-memory-handler.js";
import type { ThoughtHandler } from "../thought-handler.js";
import type { KnowledgeStorage } from "../knowledge/types.js";

export const theseusToolInputSchema = z.object({
  operation: z.enum(["init", "visa", "checkpoint", "outcome", "status", "complete"]),
  scope: z.array(z.string()).optional().describe("File paths in scope for init"),
  description: z.string().optional().describe("Refactoring goal for init"),
  filePath: z.string().optional().describe("Out-of-scope file path for visa"),
  justification: z.string().optional().describe("Justification for visa"),
  antiPatternAcknowledged: z.boolean().optional().describe("Scope creep acknowledgment for visa"),
  diffHash: z.string().optional().describe("Git diff hash for checkpoint"),
  commitMessage: z.string().optional().describe("Commit message for checkpoint"),
  approved: z.boolean().optional().describe("Cassandra audit result for checkpoint"),
  feedback: z.string().optional().describe("Audit feedback for checkpoint"),
  testsPassed: z.boolean().optional().describe("Test result for outcome"),
  details: z.string().optional().describe("Details for outcome"),
  terminalState: z.enum(["complete", "audit_failure", "scope_exhaustion"]).optional()
    .describe("Terminal state for complete"),
  summary: z.string().optional().describe("Summary for complete"),
});

export type TheseusToolInput = z.infer<typeof theseusToolInputSchema>;

export const THESEUS_TOOL = {
  name: "thoughtbox_theseus",
  description: `Theseus Protocol: friction-gated refactoring for autonomous agents. Prevents scope drift via boundary locking, test-write locks, epistemic visas, and adversarial auditing (Cassandra).

Operations:
- init: Start a refactoring session with declared file scope (args: { scope: ["path1", "path2"], description? })
- visa: Request scope expansion for an out-of-scope file (args: { filePath, justification, antiPatternAcknowledged? })
- checkpoint: Submit diff for Cassandra audit (args: { diffHash, commitMessage, approved, feedback? })
- outcome: Record test pass/fail after modification (args: { testsPassed, details? })
- status: Show current session state (B counter, scope, visa count, audit count)
- complete: End session with terminal state (args: { terminalState: "complete"|"audit_failure"|"scope_exhaustion", summary? })`,
  inputSchema: theseusToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class TheseusTool {
  private activeSessionId: string | null = null;

  constructor(
    private handler: ProtocolHandler | InMemoryProtocolHandler,
    private thoughtHandler?: ThoughtHandler,
    private knowledgeStorage?: KnowledgeStorage,
  ) {}

  async handle(input: TheseusToolInput) {
    let result: Record<string, unknown>;

    switch (input.operation) {
      case "init": {
        result = await this.handler.theseusInit(
          input.scope!,
          input.description,
        );
        this.activeSessionId = result.session_id as string;
        await this.bridgeThought(
          `[Theseus:init] Refactoring session started. Scope: ${input.scope?.join(', ')}${input.description ? `. Goal: ${input.description}` : ''}`,
          'action_report',
        );
        break;
      }
      case "visa": {
        const sid = this.requireSession();
        result = await this.handler.theseusVisa(sid, {
          filePath: input.filePath!,
          justification: input.justification!,
          antiPatternAcknowledged: input.antiPatternAcknowledged ?? true,
        });
        await this.bridgeThought(
          `[Theseus:visa] Scope expansion: ${input.filePath}. Justification: ${input.justification}`,
          'decision_frame',
        );
        break;
      }
      case "checkpoint": {
        const sid = this.requireSession();
        result = await this.handler.theseusCheckpoint(sid, {
          diffHash: input.diffHash!,
          commitMessage: input.commitMessage!,
          approved: input.approved!,
          feedback: input.feedback,
        });
        await this.bridgeThought(
          `[Theseus:checkpoint] Cassandra audit: ${input.approved ? 'APPROVED' : 'REJECTED'}. ${input.commitMessage}${input.feedback ? `. Feedback: ${input.feedback}` : ''}`,
          'action_report',
        );
        if (!input.approved) {
          await this.bridgeAuditKnowledge(
            input.commitMessage!,
            input.feedback,
          );
        }
        break;
      }
      case "outcome": {
        const sid = this.requireSession();
        result = await this.handler.theseusOutcome(sid, {
          testsPassed: input.testsPassed!,
          details: input.details,
        });
        await this.bridgeThought(
          `[Theseus:outcome] Tests ${input.testsPassed ? 'PASSED' : 'FAILED'}${input.details ? `. ${input.details}` : ''}`,
          'action_report',
        );
        break;
      }
      case "status": {
        result = await this.handler.theseusStatus();
        if (result.session_id) {
          this.activeSessionId = result.session_id as string;
        }
        break;
      }
      case "complete": {
        const sid = this.requireSession();
        result = await this.handler.theseusComplete(
          sid,
          input.terminalState!,
          input.summary,
        );
        await this.bridgeThought(
          `[Theseus:complete] Session ended: ${input.terminalState}${input.summary ? `. ${input.summary}` : ''}`,
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
      throw new Error("No active Theseus session. Call init first.");
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
        name: `Theseus: ${summary.slice(0, 80)}`,
        type: 'Insight',
        label: `Refactoring ${terminalState}`,
        properties: {
          protocol: 'theseus',
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

  private async bridgeAuditKnowledge(
    commitMessage: string,
    feedback?: string,
  ): Promise<void> {
    if (!this.knowledgeStorage) return;
    try {
      const entity = await this.knowledgeStorage.createEntity({
        name: `Theseus audit: ${commitMessage.slice(0, 80)}`,
        type: 'Insight',
        label: 'Cassandra audit rejection',
        properties: {
          protocol: 'theseus',
          protocolSessionId: this.activeSessionId,
        },
      });
      await this.knowledgeStorage.addObservation({
        entity_id: entity.id,
        content: feedback
          ? `Checkpoint rejected: ${commitMessage}\nFeedback: ${feedback}`
          : `Checkpoint rejected: ${commitMessage}`,
        source_session: this.thoughtHandler?.getCurrentSessionId() ?? undefined,
      });
    } catch {
      // Bridge failure is non-fatal
    }
  }
}
