#!/usr/bin/env npx tsx
/**
 * SIL-006 Improvement Reasoner Agent
 *
 * This agent analyzes discoveries and produces improvement plans using
 * Thoughtbox for structured reasoning. Unlike the previous implementation,
 * this agent ACTUALLY REASONS - assessments are extracted from AI analysis,
 * not hardcoded.
 *
 * Usage:
 *   npx tsx scripts/agents/sil-006-improvement-reasoner.ts --discovery '{"id":"...","type":"...","description":"..."}'
 *
 * Or import and use programmatically:
 *   import { analyzeDiscovery } from "./sil-006-improvement-reasoner.js";
 *   const plan = await analyzeDiscovery(discovery, config);
 */

import { query, type SDKMessage, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import {
  Discovery,
  ImprovementPlan,
  ApproachBranch,
  AgentConfig,
  DEFAULT_CONFIG,
  THOUGHTBOX_INSTRUCTIONS,
} from "./types.js";

// ============================================================================
// Streaming Input Mode Support
// ============================================================================

/**
 * User message type for streaming input.
 * The SDK's SDKUserMessage type is for messages FROM the SDK; for messages TO
 * the SDK we need this shape which matches what the API accepts.
 */
interface StreamingUserMessage {
  type: "user";
  message: {
    role: "user";
    content: string;
  };
  parent_tool_use_id: string | null;
  session_id?: string;
}

/**
 * Creates a message generator that can be fed follow-up messages reactively.
 * This enables multi-turn conversation with Thoughtbox which expects the agent
 * to send a follow-up message after initialization.
 */
function createMessageGenerator(initialPrompt: string) {
  let resolveNext: ((msg: StreamingUserMessage | null) => void) | null = null;
  const messageQueue: StreamingUserMessage[] = [];
  let finished = false;
  let capturedSessionId: string | undefined;

  async function* generateMessages(): AsyncIterable<StreamingUserMessage> {
    // Yield initial prompt
    yield {
      type: "user",
      message: {
        role: "user",
        content: initialPrompt,
      },
      parent_tool_use_id: null,
    } as StreamingUserMessage;

    // Then wait for more messages to be queued
    while (!finished) {
      const nextMsg = await new Promise<StreamingUserMessage | null>((resolve) => {
        if (messageQueue.length > 0) {
          resolve(messageQueue.shift()!);
        } else {
          resolveNext = resolve;
        }
      });

      if (nextMsg === null) break;
      yield nextMsg;
    }
  }

  function queueMessage(content: string) {
    const msg: StreamingUserMessage = {
      type: "user",
      message: { role: "user", content },
      parent_tool_use_id: null,
      session_id: capturedSessionId,
    };
    if (resolveNext) {
      const resolve = resolveNext;
      resolveNext = null;
      resolve(msg);
    } else {
      messageQueue.push(msg);
    }
  }

  function setSessionId(id: string) {
    capturedSessionId = id;
  }

  function finish() {
    finished = true;
    if (resolveNext) {
      resolveNext(null);
    }
  }

  return { generateMessages, queueMessage, finish, setSessionId };
}

// ============================================================================
// System Prompt for Improvement Reasoning
// ============================================================================

const IMPROVEMENT_REASONER_SYSTEM_PROMPT = `
You are an Improvement Reasoner agent. Your job is to analyze a discovery (bug, performance issue, security vulnerability, etc.) and produce a structured improvement plan.

${THOUGHTBOX_INSTRUCTIONS}

## Your Task

Given a discovery, you must:

1. **Understand the Problem**
   - What exactly is the issue?
   - What is its severity and impact?
   - What context is relevant?

2. **Explore Approaches**
   - Identify 2-3 distinct approaches to address this
   - Create a Thoughtbox branch for each approach
   - Reason about feasibility, risk, and cost for each

3. **Assess Each Approach**
   When reasoning about an approach, explicitly state:
   - FEASIBILITY (1-10): How likely is this to succeed? Consider technical complexity, dependencies, team knowledge.
   - RISK (1-10): What could go wrong? Consider breaking changes, security implications, testing gaps.
   - ESTIMATED_COST (in tokens): How much AI compute to implement? Simple fixes ~5000, moderate ~20000, complex ~50000+.

4. **Recommend and Justify**
   - Choose the best approach
   - Explain why in terms of the specific discovery

## Output Format

After reasoning through the problem, output a JSON block with your final plan:

\`\`\`json
{
  "discoveryId": "the discovery ID from input",
  "discoveryReference": "quote or paraphrase specific details from the discovery",
  "approaches": [
    {
      "name": "approach-name",
      "description": "what this approach does",
      "assessment": {
        "feasibility": 7,
        "risk": 4,
        "estimatedCost": 25000,
        "rationale": "why these specific numbers based on the discovery"
      }
    }
  ],
  "recommendedApproach": "approach-name",
  "reasoningTrace": ["summary of key reasoning steps"]
}
\`\`\`

## Critical Rules

1. **NO HARDCODED VALUES**: Every assessment must be derived from reasoning about THIS specific discovery.
2. **REFERENCE THE INPUT**: Your discoveryReference and rationales must mention specific details from the discovery.
3. **SHOW YOUR WORK**: Use Thoughtbox to record your reasoning. The trace should show how you arrived at numbers.
4. **VARIANCE REQUIRED**: Different discoveries MUST produce different assessments. If you give the same numbers for different inputs, you're doing it wrong.
5. **COMPLETE THE TASK**: After initializing Thoughtbox, immediately continue with your full analysis. Do NOT stop and wait for user input. Complete the entire analysis and output the final JSON plan in a single session.

**IMPORTANT**: When Thoughtbox responds with "Ready to begin" or similar messages, this is NOT a signal to stop. IGNORE such messages and continue your analysis. You must:
- Initialize Thoughtbox (start_new)
- Record your reasoning thoughts
- Explore multiple approaches with branches
- Output the final JSON plan
All in ONE continuous session without stopping.
`.trim();

// ============================================================================
// Main Analysis Function
// ============================================================================

export interface AnalysisResult {
  success: boolean;
  plan?: ImprovementPlan;
  error?: string;
  sessionId?: string;
  totalCostUsd: number;
  numTurns: number;
}

export async function analyzeDiscovery(
  discovery: Discovery,
  config: Partial<AgentConfig> = {}
): Promise<ImprovementPlan> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const prompt = `
Analyze this discovery and produce an improvement plan:

DISCOVERY:
${JSON.stringify(discovery, null, 2)}

Use Thoughtbox to structure your reasoning. Create branches for different approaches.
After thorough analysis, output your final plan as a JSON code block.
`.trim();

  // Create streaming message generator for multi-turn support
  const { generateMessages, queueMessage, finish, setSessionId } = createMessageGenerator(prompt);

  const assistantMessages: string[] = [];
  let sessionId: string | undefined;
  let totalCostUsd = 0;
  let numTurns = 0;
  let success = false;
  let errorMessage: string | undefined;
  let followUpSent = false;

  try {
    for await (const message of query({
      // Cast to any because SDK expects SDKUserMessage but our StreamingUserMessage is compatible
      prompt: generateMessages() as AsyncIterable<SDKUserMessage>,
      options: {
        systemPrompt: IMPROVEMENT_REASONER_SYSTEM_PROMPT,
        mcpServers: {
          thoughtbox: {
            type: "http",
            url: mergedConfig.thoughtboxUrl,
          },
        },
        allowedTools: [
          "mcp__thoughtbox__thoughtbox_gateway",
          "mcp__thoughtbox__observability_gateway",
        ],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        model: mergedConfig.model,
        maxTurns: mergedConfig.maxTurns,
        maxBudgetUsd: mergedConfig.maxBudgetUsd,
      },
    })) {
      switch (message.type) {
        case "system":
          if (message.subtype === "init") {
            sessionId = message.session_id;
            setSessionId(sessionId); // Capture for follow-up messages
            if (mergedConfig.verbose) {
              console.log("[System] Session started:", message.session_id);
              console.log("[System] Model:", message.model);
            }
          }
          break;

        case "assistant":
          const content = extractAssistantContent(message);
          if (content) {
            assistantMessages.push(content);
            if (mergedConfig.verbose) {
              console.log("[Assistant]", content.substring(0, 500));
            }

            // Detect Thoughtbox's "Ready to begin" message and send follow-up
            // This is the multi-turn handshake that Thoughtbox expects
            if (!followUpSent && (
              content.includes("Ready to begin") ||
              content.includes("please send any message to proceed") ||
              content.includes("send another message")
            )) {
              followUpSent = true;
              if (mergedConfig.verbose) {
                console.log("[Multi-turn] Sending follow-up to continue analysis...");
              }
              queueMessage(
                "Continue with the full analysis. Explore multiple approaches using Thoughtbox branches, " +
                "assess each approach with feasibility/risk/cost ratings, and output the final improvement " +
                "plan as a JSON code block."
              );
            }
          }
          break;

        case "result":
          numTurns = message.num_turns;
          totalCostUsd = message.total_cost_usd;
          finish(); // Signal that we're done with input

          if (message.subtype === "success") {
            success = true;
          } else {
            success = false;
            errorMessage = message.subtype;
          }

          if (mergedConfig.verbose) {
            console.log("[Result]", success ? "Success" : `Error: ${errorMessage}`);
            console.log("[Result] Cost:", `$${totalCostUsd.toFixed(4)}`);
            console.log("[Result] Turns:", numTurns);
          }
          break;
      }
    }
  } catch (err) {
    finish(); // Ensure we clean up
    throw new Error(`Agent execution failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!success) {
    throw new Error(`Agent failed: ${errorMessage}`);
  }

  // Extract the improvement plan from the agent's response
  const plan = extractPlanFromMessages(assistantMessages, discovery, sessionId);

  // Validate the plan meets behavioral contracts
  validatePlan(plan, discovery);

  return plan;
}

// ============================================================================
// Helper: Extract text content from assistant message
// ============================================================================

function extractAssistantContent(message: SDKMessage): string {
  if (message.type !== "assistant") return "";

  const apiMessage = message.message;
  if (!apiMessage?.content) return "";

  const textParts: string[] = [];

  for (const block of apiMessage.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    } else if (block.type === "tool_use") {
      textParts.push(`[Tool: ${block.name}]`);
    }
  }

  return textParts.join("\n");
}

// ============================================================================
// Plan Extraction
// ============================================================================

function extractPlanFromMessages(
  assistantMessages: string[],
  discovery: Discovery,
  sessionId?: string
): ImprovementPlan {
  // Search from end to beginning for JSON block
  for (let i = assistantMessages.length - 1; i >= 0; i--) {
    const content = assistantMessages[i];
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return normalizePlan(parsed, discovery, sessionId);
      } catch {
        // Continue searching
      }
    }
  }

  // If no JSON block found, try to find any JSON object with plan shape
  const allContent = assistantMessages.join("\n");
  const jsonObjectMatch = allContent.match(/\{[\s\S]*"approaches"[\s\S]*"recommendedApproach"[\s\S]*\}/);

  if (jsonObjectMatch) {
    try {
      // Find the complete JSON object by tracking braces
      const startIdx = allContent.indexOf(jsonObjectMatch[0]);
      let depth = 0;
      let endIdx = startIdx;
      for (let i = startIdx; i < allContent.length; i++) {
        if (allContent[i] === "{") depth++;
        if (allContent[i] === "}") depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
      const jsonStr = allContent.slice(startIdx, endIdx);
      const parsed = JSON.parse(jsonStr);
      return normalizePlan(parsed, discovery, sessionId);
    } catch {
      // Continue to error
    }
  }

  throw new Error("Could not extract improvement plan from agent response");
}

function normalizePlan(
  raw: unknown,
  discovery: Discovery,
  sessionId?: string
): ImprovementPlan {
  const obj = raw as Record<string, unknown>;

  // Ensure required fields
  if (!obj.approaches || !Array.isArray(obj.approaches)) {
    throw new Error("Plan missing approaches array");
  }

  if (!obj.recommendedApproach) {
    throw new Error("Plan missing recommendedApproach");
  }

  const approaches: ApproachBranch[] = obj.approaches.map((a: unknown) => {
    const approach = a as Record<string, unknown>;
    const assessment = approach.assessment as Record<string, unknown>;

    return {
      name: String(approach.name || "unnamed"),
      description: String(approach.description || ""),
      assessment: {
        feasibility: Number(assessment?.feasibility ?? 5),
        risk: Number(assessment?.risk ?? 5),
        estimatedCost: Number(assessment?.estimatedCost ?? 30000),
        rationale: String(assessment?.rationale || "No rationale provided"),
      },
      thoughtBranchId: approach.thoughtBranchId as string | undefined,
    };
  });

  return {
    discoveryId: String(obj.discoveryId || discovery.id),
    discoveryReference: String(obj.discoveryReference || ""),
    approaches,
    recommendedApproach: String(obj.recommendedApproach),
    reasoningTrace: Array.isArray(obj.reasoningTrace)
      ? obj.reasoningTrace.map(String)
      : [],
    sessionId: sessionId || String(obj.sessionId || "unknown"),
  };
}

// ============================================================================
// Plan Validation (Behavioral Contracts - Partial)
// ============================================================================

function validatePlan(plan: ImprovementPlan, discovery: Discovery): void {
  // CONTENT_COUPLED check: plan must reference discovery
  const planText = JSON.stringify(plan).toLowerCase();
  const discoveryText = discovery.description.toLowerCase();

  // Extract key terms from discovery
  const keyTerms = discoveryText
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 5);

  const referencesInput = keyTerms.some((term) => planText.includes(term));

  if (!referencesInput && !planText.includes(discovery.id.toLowerCase())) {
    console.warn(
      `WARNING: Plan may not reference discovery. Key terms not found: ${keyTerms.join(", ")}`
    );
  }

  // Basic sanity checks on assessments
  for (const approach of plan.approaches) {
    const { feasibility, risk, estimatedCost } = approach.assessment;

    if (feasibility < 1 || feasibility > 10) {
      throw new Error(`Invalid feasibility ${feasibility} for ${approach.name}`);
    }
    if (risk < 1 || risk > 10) {
      throw new Error(`Invalid risk ${risk} for ${approach.name}`);
    }
    if (estimatedCost < 0) {
      throw new Error(`Invalid estimatedCost ${estimatedCost} for ${approach.name}`);
    }
    if (!approach.assessment.rationale || approach.assessment.rationale.length < 20) {
      console.warn(`WARNING: Rationale for ${approach.name} seems thin`);
    }
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const discoveryIndex = args.indexOf("--discovery");

  if (discoveryIndex === -1 || !args[discoveryIndex + 1]) {
    console.error("Usage: npx tsx sil-006-improvement-reasoner.ts --discovery '<json>'");
    console.error("\nExample:");
    console.error(
      '  npx tsx sil-006-improvement-reasoner.ts --discovery \'{"id":"perf-001","type":"performance","description":"API endpoint /users takes 5 seconds"}\''
    );
    process.exit(1);
  }

  let discovery: Discovery;
  try {
    discovery = JSON.parse(args[discoveryIndex + 1]);
  } catch (e) {
    console.error("Failed to parse discovery JSON:", e);
    process.exit(1);
  }

  const verbose = args.includes("--verbose");

  console.log("Analyzing discovery:", discovery.id);
  console.log("Type:", discovery.type);
  console.log("Description:", discovery.description);
  console.log("\nStarting improvement reasoning...\n");

  try {
    const plan = await analyzeDiscovery(discovery, { verbose });

    console.log("\n=== IMPROVEMENT PLAN ===\n");
    console.log(JSON.stringify(plan, null, 2));

    console.log("\n=== SUMMARY ===");
    console.log(`Discovery: ${plan.discoveryId}`);
    console.log(`Approaches evaluated: ${plan.approaches.length}`);
    console.log(`Recommended: ${plan.recommendedApproach}`);

    const recommended = plan.approaches.find(
      (a) => a.name === plan.recommendedApproach
    );
    if (recommended) {
      console.log(`  Feasibility: ${recommended.assessment.feasibility}/10`);
      console.log(`  Risk: ${recommended.assessment.risk}/10`);
      console.log(`  Est. Cost: ${recommended.assessment.estimatedCost} tokens`);
    }
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
