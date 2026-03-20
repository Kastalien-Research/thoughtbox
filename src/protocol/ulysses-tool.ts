import { z } from "zod";
import { ProtocolHandler } from "./handler.js";

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

  constructor(private handler: ProtocolHandler) {}

  async handle(input: UlyssesToolInput) {
    let result: Record<string, unknown>;

    switch (input.operation) {
      case "init": {
        result = await this.handler.ulyssesInit(
          input.problem!,
          input.constraints,
        );
        this.activeSessionId = result.session_id as string;
        break;
      }
      case "plan": {
        const sid = this.requireSession();
        result = await this.handler.ulyssesPlan(sid, {
          primary: input.primary!,
          recovery: input.recovery!,
          irreversible: input.irreversible ?? false,
        });
        break;
      }
      case "outcome": {
        const sid = this.requireSession();
        result = await this.handler.ulyssesOutcome(sid, {
          assessment: input.assessment!,
          severity: input.severity,
          details: input.details,
        });
        break;
      }
      case "reflect": {
        const sid = this.requireSession();
        result = await this.handler.ulyssesReflect(sid, {
          hypothesis: input.hypothesis!,
          falsification: input.falsification!,
        });
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
}
