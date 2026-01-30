/**
 * Sampling Handler - Manages autonomous LLM sampling for critique loops
 *
 * Implements the MCP `sampling/createMessage` primitive to request
 * external LLM analysis of reasoning steps without user intervention.
 */

import type { ThoughtData } from "../persistence/types.js";

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
export interface ModelPreferences {
  hints?: Array<{ name: string }>;
  intelligencePriority?: number;
  costPriority?: number;
}

/**
 * Sampling request parameters following MCP specification
 */
export interface SamplingMessage {
  role: "user" | "assistant" | "system";
  content: {
    type: "text";
    text: string;
  };
}

export interface SamplingParams {
  messages: Array<SamplingMessage>;
  systemPrompt?: string;
  modelPreferences?: ModelPreferences;
  includeContext?: "thisServer" | "allServers" | "none";
  maxTokens?: number;
}

/**
 * Result from a sampling request
 */
export interface SamplingResult {
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
   * Generic sampling request wrapper
   */
  async requestMessage(params: SamplingParams): Promise<SamplingResult> {
    try {
      const result = (await this.protocol.request(
        {
          method: "sampling/createMessage",
          params,
        },
        null as any
      )) as SamplingResult;

      return result;
    } catch (error: any) {
      if (error.code === -32601) {
        // METHOD_NOT_FOUND - client doesn't support sampling
        throw error;
      }

      throw new Error(`Sampling request failed: ${error.message}`);
    }
  }

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

    const result = await this.requestMessage({
      messages,
      systemPrompt: CRITIC_SYSTEM_PROMPT,
      modelPreferences: {
        hints: [{ name: "claude-sonnet-4-5-20250929" }],
        intelligencePriority: 0.9,
        costPriority: 0.3,
      },
      includeContext: "thisServer",
      maxTokens: 1000,
    });

    return result.content.text;
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

  // NOTE: Sampling capability detection happens automatically during MCP initialization
  // handshake via client capabilities. No need for runtime probing.
}
