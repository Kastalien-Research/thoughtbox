import { z } from "zod";
import { ProtocolHandler } from "./handler.js";

export const theseusToolInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("init"),
    scope: z.array(z.string())
      .describe("File paths or directory prefixes in scope for this refactor"),
    description: z.string().optional()
      .describe("Brief description of the refactoring goal"),
  }),
  z.object({
    operation: z.literal("visa"),
    filePath: z.string()
      .describe("Path of the out-of-scope file requiring modification"),
    justification: z.string()
      .describe("Why this file must be modified (e.g., compiler dependency)"),
    antiPatternAcknowledged: z.boolean().default(true)
      .describe("Agent acknowledges this is scope creep and accepts the friction cost"),
  }),
  z.object({
    operation: z.literal("checkpoint"),
    diffHash: z.string()
      .describe("Hash of the git diff being submitted for audit"),
    commitMessage: z.string()
      .describe("Proposed atomic commit message (must not contain compound actions)"),
    approved: z.boolean()
      .describe("Whether the Cassandra audit approved this checkpoint"),
    feedback: z.string().optional()
      .describe("Cassandra audit feedback (rejection reason or approval notes)"),
  }),
  z.object({
    operation: z.literal("outcome"),
    testsPassed: z.boolean()
      .describe("Whether tests pass after the modification"),
    details: z.string().optional()
      .describe("Details about test results or compile status"),
  }),
  z.object({
    operation: z.literal("status"),
  }),
  z.object({
    operation: z.literal("complete"),
    terminalState: z.enum(["complete", "audit_failure", "scope_exhaustion"])
      .describe("How the protocol session ended"),
    summary: z.string().optional()
      .describe("Summary of the refactoring outcome"),
  }),
]);

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

  constructor(private handler: ProtocolHandler) {}

  async handle(input: TheseusToolInput) {
    let result: Record<string, unknown>;

    switch (input.operation) {
      case "init": {
        result = await this.handler.theseusInit(
          input.scope,
          input.description,
        );
        this.activeSessionId = result.session_id as string;
        break;
      }
      case "visa": {
        const sid = this.requireSession();
        result = await this.handler.theseusVisa(sid, {
          filePath: input.filePath,
          justification: input.justification,
          antiPatternAcknowledged: input.antiPatternAcknowledged,
        });
        break;
      }
      case "checkpoint": {
        const sid = this.requireSession();
        result = await this.handler.theseusCheckpoint(sid, {
          diffHash: input.diffHash,
          commitMessage: input.commitMessage,
          approved: input.approved,
          feedback: input.feedback,
        });
        break;
      }
      case "outcome": {
        const sid = this.requireSession();
        result = await this.handler.theseusOutcome(sid, {
          testsPassed: input.testsPassed,
          details: input.details,
        });
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
          input.terminalState,
          input.summary,
        );
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
      throw new Error(
        'No active Theseus session. Call init first.',
      );
    }
    return this.activeSessionId;
  }
}
