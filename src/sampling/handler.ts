/**
 * Sampling Handler - Manages autonomous LLM sampling for critique and exploration loops
 *
 * Implements the MCP `sampling/createMessage` primitive to request
 * external LLM analysis of reasoning steps without user intervention.
 *
 * Extended with `requestExploration` to support server-initiated tinkering:
 * when Thoughtbox detects an agent is about to implement against an untested
 * API, it uses sampling to ask the agent to explore in a notebook first.
 */

import type { ThoughtData } from "../persistence/types.js";

const EXPLORATION_SYSTEM_PROMPT = `You are a careful software engineer about to implement code that depends on external APIs or libraries.

Before writing production code, you MUST validate your assumptions by tinkering in a notebook. This means:

1. Create a Thoughtbox notebook using the api-exploration template
2. Write small, isolated cells testing each assumption about the API
3. Run cells, read output, iterate until the actual behavior matches your mental model
4. Record validated findings as a belief_snapshot thought
5. Export the notebook as evidence

Do NOT proceed to implementation until you have validated:
- Request/response shapes with real calls
- Error formats from actual error responses
- At least one edge case per primary operation

Use the thoughtbox_gateway tool with operation "notebook" to create and run cells.
Use thoughtbox_gateway with operation "thought" to record findings.

This exploration is not optional — it prevents the costly failure mode of coding blind against undocumented or misunderstood APIs.`;

const CRITIC_SYSTEM_PROMPT = `You are a critical thinking expert tasked with analyzing reasoning steps.

Your job is to identify:
- Logical fallacies or flawed reasoning
- Unstated assumptions that may not hold
- Alternative approaches that might be more effective
- Missed edge cases or scenarios
- Potential improvements to the reasoning

Be constructive, specific, and actionable in your critique. Focus on helping improve the reasoning quality.`;

/**
 * Model preferences for sampling requests
 */
interface ModelPreferences {
  hints?: Array<{ name: string }>;
  intelligencePriority?: number;
  costPriority?: number;
}

/**
 * Sampling request parameters following MCP specification
 */
interface SamplingParams {
  messages: Array<{
    role: "user" | "assistant";
    content: {
      type: "text";
      text: string;
    };
  }>;
  systemPrompt?: string;
  modelPreferences?: ModelPreferences;
  includeContext?: "thisServer" | "allServers" | "none";
  maxTokens?: number;
}

/**
 * Result from a sampling request
 */
interface SamplingResult {
  role: "assistant";
  content: {
    type: "text";
    text: string;
  };
  model?: string;
  stopReason?: string;
}

/**
 * Handles autonomous sampling requests for thought critique
 */
export class SamplingHandler {
  constructor(
    private protocol: { request: (req: any, schema: any) => Promise<any> }
  ) {}

  /**
   * Request a critique of a thought from the MCP client
   *
   * @param thought - The current thought to critique
   * @param context - Previous thoughts for context (last 5 recommended)
   * @returns The critique text from the sampled model
   * @throws Error if sampling fails or is not supported
   */
  async requestCritique(
    thought: string,
    context: ThoughtData[]
  ): Promise<string> {
    const messages = this.buildMessages(context, thought);

    try {
      const result = (await this.protocol.request(
        {
          method: "sampling/createMessage",
          params: {
            messages,
            systemPrompt: CRITIC_SYSTEM_PROMPT,
            modelPreferences: {
              hints: [{ name: "claude-sonnet-4-5-20250929" }],
              intelligencePriority: 0.9,
              costPriority: 0.3,
            },
            includeContext: "thisServer",
            maxTokens: 1000,
          } as SamplingParams,
        },
        null as any
      )) as SamplingResult;

      return result.content.text;
    } catch (error: any) {
      // Re-throw with consistent error code for graceful degradation
      if (error.code === -32601) {
        // METHOD_NOT_FOUND - client doesn't support sampling
        throw error;
      }

      // Other errors should be wrapped
      throw new Error(`Sampling request failed: ${error.message}`);
    }
  }

  /**
   * Build message array for sampling request with context
   *
   * @param context - Previous thoughts to include as context
   * @param currentThought - The current thought being critiqued
   * @returns Array of messages for the sampling request
   */
  private buildMessages(
    context: ThoughtData[],
    currentThought: string
  ): SamplingParams["messages"] {
    // Include last 5 thoughts for context (or fewer if not available)
    const recentThoughts = context.slice(-5);

    let contextText = "";
    if (recentThoughts.length > 0) {
      contextText = recentThoughts
        .map((t) => `Thought ${t.thoughtNumber}: ${t.thought}`)
        .join("\n\n");
      contextText += "\n\n";
    }

    const fullText = `${contextText}Current Thought: ${currentThought}\n\nProvide a critical analysis of this reasoning step.`;

    return [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: fullText,
        },
      },
    ];
  }

  /**
   * Request that the agent explore an API/library in a notebook before implementing.
   *
   * This is the server-initiated tinkering primitive. When Thoughtbox detects that
   * an agent is about to implement against an untested API (no notebook evidence
   * found), it uses this method to ask the agent's LLM to run an exploration first.
   *
   * @param target - The API or library that needs exploration (e.g., "Stripe charges API")
   * @param assumptions - List of assumptions the agent appears to be making
   * @param context - Recent thoughts for context
   * @returns The agent's exploration plan/acknowledgment
   * @throws Error if sampling fails or is not supported
   */
  async requestExploration(
    target: string,
    assumptions: string[],
    context: ThoughtData[]
  ): Promise<string> {
    const assumptionList = assumptions.length > 0
      ? `\n\nAssumptions detected (validate ALL of these):\n${assumptions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
      : "";

    const contextText = context.slice(-3)
      .map((t) => `Thought ${t.thoughtNumber}: ${t.thought}`)
      .join("\n\n");

    const message = `${contextText ? contextText + "\n\n" : ""}You are about to implement code that depends on: ${target}

No notebook evidence was found validating your assumptions about this dependency.${assumptionList}

Create a Thoughtbox notebook using the api-exploration template and validate your mental model before proceeding. Start with: thoughtbox_gateway { operation: "notebook", args: { operation: "create", title: "${target} Exploration", language: "typescript", template: "api-exploration" } }`;

    try {
      const result = (await this.protocol.request(
        {
          method: "sampling/createMessage",
          params: {
            messages: [{
              role: "user" as const,
              content: {
                type: "text" as const,
                text: message,
              },
            }],
            systemPrompt: EXPLORATION_SYSTEM_PROMPT,
            modelPreferences: {
              hints: [{ name: "claude-sonnet-4-5-20250929" }],
              intelligencePriority: 0.8,
              costPriority: 0.4,
            },
            includeContext: "thisServer",
            maxTokens: 2000,
          } as SamplingParams,
        },
        null as any
      )) as SamplingResult;

      return result.content.text;
    } catch (error: any) {
      if (error.code === -32601) {
        // Client doesn't support sampling — degrade gracefully
        throw error;
      }
      throw new Error(`Exploration sampling request failed: ${error.message}`);
    }
  }

  // NOTE: Sampling capability detection happens automatically during MCP initialization
  // handshake via client capabilities. No need for runtime probing.
}
