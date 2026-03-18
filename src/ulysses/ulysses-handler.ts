import { z } from "zod";
import type { UlyssesToolInput } from "./operations.js";
import { ULYSSES_OPERATIONS } from "./operations.js";

// ============================================================================
// Interfaces
// ============================================================================

export interface Step {
  id: string;
  description: string;
  expectedOutcome: string;
  reversibility: "reversible" | "irreversible";
  recoveryStep: string;
}

export interface Surprise {
  outcome: string;
  assessment: string;
  severity: "none" | "flagrant-1" | "flagrant-2";
  explanation: string;
  stepContext: Step | null;
}

export interface Hypothesis {
  description: string;
  falsificationCriteria: string;
}

export interface UlyssesState {
  sessionId: string;
  issueDescription: string;
  sCounter: number;
  surpriseRegister: Surprise[];
  currentStep: Step | null;
  hypotheses: Hypothesis[];
  terminalState: "RESOLVED" | "INSUFFICIENT_INFORMATION" | "ENVIRONMENT_COMPROMISED" | null;
  history: any[]; // Simplified log
}

// Global in-memory state mapping sessionId to UlyssesState
const sessionStates = new Map<string, UlyssesState>();

export class UlyssesHandler {
  constructor() {}

  async handle(input: UlyssesToolInput, sessionId: string): Promise<any> {
    const { operation, args } = input;

    // For init_session, we construct the state
    if (operation === "init_session") {
        const schema = ULYSSES_OPERATIONS.find(op => op.name === "init_session")!.inputSchema;
        const result = this.validateArgs(args, schema);

        const state: UlyssesState = {
          sessionId,
          issueDescription: result.issueDescription as string,
          sCounter: 0,
          surpriseRegister: [],
          currentStep: null,
          hypotheses: [],
          terminalState: null,
          history: [],
        };
        sessionStates.set(sessionId, state);

        return {
          content: [{
              type: "text",
              text: JSON.stringify({
                  status: "success",
                  message: "Initialized Ulysses session.",
                  state: this.serializeState(state),
              }, null, 2)
          }]
        };
    }

    if (operation === "read_protocol") {
        const { ULYSSES_PROTOCOL_CONTENT } = await import("../resources/ulysses-protocol-content.js");
        return {
          content: [
            {
              type: "resource",
              resource: {
                uri: "thoughtbox://ulysses",
                mimeType: "text/markdown",
                text: ULYSSES_PROTOCOL_CONTENT
              }
            }
          ]
        };
    }

    if (!sessionStates.has(sessionId)) {
      throw new Error("No active Ulysses session for this sessionId. Please call 'init_session' first.");
    }

    const state = sessionStates.get(sessionId)!;

    switch (operation) {
      case "plan_step": {
        if (state.sCounter !== 0) {
          throw new Error("Cannot plan_step. S is not 0. You must handle the surprise/reflection first.");
        }

        const schema = ULYSSES_OPERATIONS.find(op => op.name === "plan_step")!.inputSchema;
        const result = this.validateArgs(args, schema);

        const newStep: Step = {
          id: `step-${Date.now()}`,
          description: result.primaryStep,
          expectedOutcome: result.expectedOutcome,
          reversibility: result.reversibility,
          recoveryStep: result.recoveryStep,
        };

        state.currentStep = newStep;
        state.history.push({ type: "plan_step", step: newStep });

        return {
          content: [{
              type: "text",
              text: JSON.stringify({
                  status: "success",
                  message: "Step and recovery step planned.",
                  state: this.serializeState(state),
              }, null, 2)
          }]
        };
      }

      case "execute_step": {
        if (state.sCounter !== 0 || !state.currentStep) {
          throw new Error("Cannot execute_step. Must plan a step first and S must be 0.");
        }

        const schema = ULYSSES_OPERATIONS.find(op => op.name === "execute_step")!.inputSchema;
        const result = this.validateArgs(args, schema);

        const { outcome, assessment, surpriseSeverity, explanation } = result;

        state.history.push({ type: "execute_step", outcome, assessment, surpriseSeverity });

        if (assessment === "expected" || assessment === "unexpected-favorable") {
          state.sCounter = 0;
          state.currentStep = null;
          return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    status: "success",
                    message: "Outcome was expected or favorable. Checkpoint created. S remains 0.",
                    state: this.serializeState(state),
                }, null, 2)
            }]
          };
        } else {
          const surprise: Surprise = { outcome, assessment, severity: surpriseSeverity, explanation, stepContext: state.currentStep };

          this.addSurprise(state, surprise);

          if (surpriseSeverity === "flagrant-2") {
            state.sCounter = 2; // Immediately to REFLECT
            return {
              content: [{
                  type: "text",
                  text: JSON.stringify({
                      status: "warning",
                      message: "Flagrant-2 surprise! Protocol escalated immediately to REFLECT (S=2). Do not run recovery step.",
                      state: this.serializeState(state),
                  }, null, 2)
              }]
            };
          } else {
            state.sCounter = 1; // Move to RECOVERY
            return {
              content: [{
                  type: "text",
                  text: JSON.stringify({
                      status: "warning",
                      message: "Flagrant-1 surprise. Protocol escalated to RECOVERY (S=1). Execute pre-committed recovery step.",
                      state: this.serializeState(state),
                  }, null, 2)
              }]
            };
          }
        }
      }

      case "execute_recovery": {
        if (state.sCounter !== 1 || !state.currentStep) {
          throw new Error("Cannot execute_recovery unless S = 1 and there is a pre-committed recovery step.");
        }

        const schema = ULYSSES_OPERATIONS.find(op => op.name === "execute_recovery")!.inputSchema;
        const result = this.validateArgs(args, schema);

        const { outcome, assessment } = result;
        state.history.push({ type: "execute_recovery", outcome, assessment });

        if (assessment === "expected") {
          state.sCounter = 0;
          state.currentStep = null;
          return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    status: "success",
                    message: "Recovery succeeded. Returning to PLAN (S=0).",
                    state: this.serializeState(state),
                }, null, 2)
            }]
          };
        } else {
          const surprise: Surprise = {
            outcome,
            assessment,
            severity: "flagrant-1",
            explanation: "Recovery step also produced an unexpected outcome",
            stepContext: state.currentStep
          };
          this.addSurprise(state, surprise);

          state.sCounter = 2; // Move to REFLECT
          return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    status: "warning",
                    message: "Recovery step produced a surprise! Protocol escalated to REFLECT (S=2).",
                    state: this.serializeState(state),
                }, null, 2)
            }]
          };
        }
      }

      case "reflect": {
        if (state.sCounter !== 2) {
          throw new Error("Cannot reflect unless S = 2.");
        }

        const schema = ULYSSES_OPERATIONS.find(op => op.name === "reflect")!.inputSchema;
        const result = this.validateArgs(args, schema);

        const newHypothesis: Hypothesis = {
          description: result.hypothesis,
          falsificationCriteria: result.falsificationCriteria,
        };

        state.hypotheses.push(newHypothesis);
        state.history.push({ type: "reflect", hypothesis: newHypothesis });

        state.sCounter = 0;
        state.currentStep = null;

        return {
          content: [{
              type: "text",
              text: JSON.stringify({
                  status: "success",
                  message: "Reflection complete. Returned to PLAN (S=0). Formulate a structurally different step based on this hypothesis.",
                  state: this.serializeState(state),
              }, null, 2)
          }]
        };
      }



      case "terminate_session": {
        const schema = ULYSSES_OPERATIONS.find(op => op.name === "terminate_session")!.inputSchema;
        const result = this.validateArgs(args, schema);

        if (state.terminalState) {
          throw new Error(`Session already terminated with state: ${state.terminalState}`);
        }

        state.terminalState = result.terminalState;
        state.history.push({
          type: "terminate_session",
          terminalState: result.terminalState,
          summary: result.summary
        });

        return {
          content: [{
              type: "text",
              text: JSON.stringify({
                  status: "success",
                  message: `Session terminated with state: ${result.terminalState}`,
                  state: this.serializeState(state),
              }, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private validateArgs(args: any, schema: any): any {
    if (!args) throw new Error("Missing arguments");
    for (const req of schema.required || []) {
      if (args[req] === undefined) {
        throw new Error(`Missing required argument: ${req}`);
      }
    }
    return args;
  }

  private addSurprise(state: UlyssesState, surprise: Surprise) {
    state.surpriseRegister.push(surprise);
    if (state.surpriseRegister.length > 3) {
      state.surpriseRegister.shift();
    }
  }

  private serializeState(state: UlyssesState): Record<string, any> {
    return {
      issueDescription: state.issueDescription,
      sCounter: state.sCounter,
      currentStep: state.currentStep,
      surpriseRegisterCount: state.surpriseRegister.length,
      hypothesesCount: state.hypotheses.length,
      terminalState: state.terminalState,
    };
  }
}
