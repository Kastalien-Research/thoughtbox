#!/usr/bin/env npx tsx
/**
 * SIL-010 Main Loop Orchestrator Agent
 *
 * Orchestrates the full self-improvement loop:
 *   Discovery → Filter → Experiment → Evaluate → Integrate
 *
 * This agent coordinates sub-agents and manages loop state, budget,
 * and termination conditions.
 *
 * Usage:
 *   npx tsx scripts/agents/sil-010-main-loop-orchestrator.ts --budget 1.0 --max-iterations 3
 *
 * Or import and use programmatically:
 *   import { runImprovementLoop } from "./sil-010-main-loop-orchestrator.js";
 *   const result = await runImprovementLoop(config);
 */

import { query, type SDKMessage, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { analyzeDiscovery } from "./sil-006-improvement-reasoner.js";
import {
  Discovery,
  ImprovementPlan,
  LoopIteration,
  ExperimentResult,
  EvaluationResult,
  AgentConfig,
  DEFAULT_CONFIG,
  THOUGHTBOX_INSTRUCTIONS,
} from "./types.js";

// ============================================================================
// Streaming Input Mode Support (for multi-turn Thoughtbox interactions)
// ============================================================================

interface StreamingUserMessage {
  type: "user";
  message: { role: "user"; content: string };
  parent_tool_use_id: string | null;
  session_id?: string;
}

function createMessageGenerator(initialPrompt: string) {
  let resolveNext: ((msg: StreamingUserMessage | null) => void) | null = null;
  const messageQueue: StreamingUserMessage[] = [];
  let finished = false;
  let capturedSessionId: string | undefined;

  async function* generateMessages(): AsyncIterable<StreamingUserMessage> {
    yield {
      type: "user",
      message: { role: "user", content: initialPrompt },
      parent_tool_use_id: null,
    } as StreamingUserMessage;

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
// Loop Configuration
// ============================================================================

export interface LoopConfig extends AgentConfig {
  maxIterations: number;
  budgetUsd: number;
  earlyTerminationThreshold: number; // Stop if success rate drops below this
  targetDirectory: string;
}

const DEFAULT_LOOP_CONFIG: LoopConfig = {
  ...DEFAULT_CONFIG,
  maxIterations: 5,
  budgetUsd: 1.0,
  earlyTerminationThreshold: 0.2,
  targetDirectory: ".",
};

// ============================================================================
// System Prompts for Each Phase
// ============================================================================

const DISCOVERY_SYSTEM_PROMPT = `
You are a Discovery Agent. Your job is to find potential improvements in a codebase.

${THOUGHTBOX_INSTRUCTIONS}

## Your Task

Scan the codebase and identify improvement opportunities:
- Performance bottlenecks
- Security vulnerabilities
- Code quality issues
- Bug patterns
- Missing tests

## Output Format

Output a JSON array of discoveries:

\`\`\`json
[
  {
    "id": "unique-id",
    "type": "performance|security|refactor|bug|feature",
    "description": "detailed description of the issue",
    "severity": "low|medium|high|critical",
    "source": "file path or area where found"
  }
]
\`\`\`

Focus on HIGH-VALUE, ACTIONABLE discoveries. Quality over quantity.
`.trim();

const FILTER_SYSTEM_PROMPT = `
You are a Filter Agent. Your job is to prioritize discoveries by value and feasibility.

${THOUGHTBOX_INSTRUCTIONS}

## Your Task

Given a list of discoveries, rank them by:
1. Impact (how much does fixing this improve things?)
2. Feasibility (can this be fixed in a single PR?)
3. Risk (what could go wrong?)

## Output Format

Output a JSON array of discovery IDs in priority order (highest first):

\`\`\`json
{
  "prioritized": ["discovery-id-1", "discovery-id-2", "discovery-id-3"],
  "rejected": ["discovery-id-4"],
  "rejectionReasons": {
    "discovery-id-4": "Too complex for autonomous fix"
  }
}
\`\`\`

Be aggressive about filtering. Only keep discoveries that are worth pursuing.
`.trim();

const EXPERIMENT_SYSTEM_PROMPT = `
You are an Experiment Agent. Your job is to implement improvements.

You have access to file system tools: Read, Edit, Write, Glob, Grep.

## Your Task

Given an improvement plan, implement the recommended approach:
1. Read the relevant code
2. Make minimal, targeted changes
3. Ensure changes are syntactically correct
4. DO NOT break existing functionality

## Output Format

After making changes, output a summary:

\`\`\`json
{
  "planId": "the plan ID",
  "approach": "approach name used",
  "codeChanges": [
    {
      "file": "path/to/file.ts",
      "type": "modify|create|delete",
      "summary": "what changed"
    }
  ],
  "success": true,
  "notes": "any important observations"
}
\`\`\`

## Critical Rules

- Make MINIMAL changes
- Don't refactor unrelated code
- Don't add features beyond scope
- If unsure, err on the side of doing less
`.trim();

const EVALUATION_SYSTEM_PROMPT = `
You are an Evaluation Agent. Your job is to verify that experiments worked.

You have access to Bash for running tests.

## Your Task

Given experiment results, verify the changes:
1. Run relevant tests
2. Check for regressions
3. Verify the improvement actually helps

## Tiered Evaluation

- Tier 1: Syntax check (does it compile?)
- Tier 2: Unit tests (do tests pass?)
- Tier 3: Integration tests (does it work end-to-end?)

## Output Format

\`\`\`json
{
  "experimentId": "the experiment ID",
  "tier": 1|2|3,
  "passed": true|false,
  "metrics": {
    "testsRun": 10,
    "testsPassed": 10,
    "coverage": 85
  },
  "details": "summary of evaluation"
}
\`\`\`

Be strict. If there's any doubt, fail the evaluation.
`.trim();

// ============================================================================
// Helper: Run a phase agent and extract result
// ============================================================================

interface PhaseResult {
  messages: string[];
  costUsd: number;
  success: boolean;
  error?: string;
}

async function runPhaseAgent(
  prompt: string,
  systemPrompt: string,
  config: LoopConfig,
  additionalTools: string[] = []
): Promise<PhaseResult> {
  // Create streaming message generator for multi-turn Thoughtbox support
  const { generateMessages, queueMessage, finish, setSessionId } = createMessageGenerator(prompt);

  const messages: string[] = [];
  let costUsd = 0;
  let success = false;
  let error: string | undefined;
  let followUpSent = false;

  const baseTools = [
    "mcp__thoughtbox__thoughtbox_gateway",
    "mcp__thoughtbox__observability_gateway",
  ];

  try {
    for await (const message of query({
      prompt: generateMessages() as AsyncIterable<SDKUserMessage>,
      options: {
        systemPrompt,
        mcpServers: {
          thoughtbox: {
            type: "http",
            url: config.thoughtboxUrl,
          },
        },
        allowedTools: [...baseTools, ...additionalTools],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        model: config.model,
        maxTurns: config.maxTurns,
        maxBudgetUsd: config.maxBudgetUsd,
      },
    })) {
      switch (message.type) {
        case "system":
          if (message.subtype === "init") {
            setSessionId(message.session_id); // Capture for follow-up messages
          }
          break;

        case "assistant":
          const content = extractAssistantContent(message);
          if (content) {
            messages.push(content);
            if (config.verbose) {
              console.log("[Assistant]", content.substring(0, 300));
            }

            // Handle Thoughtbox's multi-turn handshake
            if (!followUpSent && (
              content.includes("Ready to begin") ||
              content.includes("please send any message to proceed") ||
              content.includes("send another message")
            )) {
              followUpSent = true;
              if (config.verbose) {
                console.log("[Multi-turn] Sending follow-up to continue...");
              }
              queueMessage("Continue with the task. Complete it fully and output the final JSON result.");
            }
          }
          break;

        case "result":
          costUsd = message.total_cost_usd;
          finish(); // Signal we're done with input

          if (message.subtype === "success") {
            success = true;
          } else {
            success = false;
            error = message.subtype;
          }
          break;
      }
    }
  } catch (err) {
    finish(); // Cleanup
    success = false;
    error = err instanceof Error ? err.message : String(err);
  }

  return { messages, costUsd, success, error };
}

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
// Loop Phases
// ============================================================================

async function runDiscoveryPhase(
  config: LoopConfig
): Promise<{ discoveries: Discovery[]; costUsd: number }> {
  console.log("\n=== DISCOVERY PHASE ===\n");

  const prompt = `
Scan the codebase at ${config.targetDirectory} and identify improvement opportunities.
Focus on:
- Performance issues
- Security concerns
- Code quality problems
- Missing error handling
- Test coverage gaps

Look at actual code, not just file names.
`.trim();

  const result = await runPhaseAgent(
    prompt,
    DISCOVERY_SYSTEM_PROMPT,
    config,
    ["Read", "Glob", "Grep"]
  );

  if (!result.success) {
    console.error("Discovery phase failed:", result.error);
    return { discoveries: [], costUsd: result.costUsd };
  }

  return {
    discoveries: extractDiscoveries(result.messages),
    costUsd: result.costUsd,
  };
}

async function runFilterPhase(
  discoveries: Discovery[],
  config: LoopConfig
): Promise<{ filtered: Discovery[]; costUsd: number }> {
  console.log("\n=== FILTER PHASE ===\n");

  if (discoveries.length === 0) {
    console.log("No discoveries to filter");
    return { filtered: [], costUsd: 0 };
  }

  const prompt = `
Prioritize these discoveries for an autonomous improvement loop:

${JSON.stringify(discoveries, null, 2)}

Consider:
- Can this be fixed automatically without human review?
- Is the fix low-risk?
- Is the impact worth the effort?

Return the prioritized list.
`.trim();

  const result = await runPhaseAgent(prompt, FILTER_SYSTEM_PROMPT, config);

  if (!result.success) {
    console.error("Filter phase failed:", result.error);
    return {
      filtered: discoveries.slice(0, 3), // Fallback: take first 3
      costUsd: result.costUsd,
    };
  }

  const filterResult = extractFilterResult(result.messages);
  return {
    filtered: discoveries.filter((d) => filterResult.prioritized.includes(d.id)),
    costUsd: result.costUsd,
  };
}

async function runExperimentPhase(
  plan: ImprovementPlan,
  config: LoopConfig
): Promise<{ experiment: ExperimentResult; costUsd: number }> {
  console.log("\n=== EXPERIMENT PHASE ===\n");
  console.log(`Implementing: ${plan.recommendedApproach}`);

  const prompt = `
Implement this improvement plan:

${JSON.stringify(plan, null, 2)}

Use the recommended approach: ${plan.recommendedApproach}

Make the necessary code changes.
`.trim();

  const result = await runPhaseAgent(
    prompt,
    EXPERIMENT_SYSTEM_PROMPT,
    config,
    ["Read", "Edit", "Write", "Glob", "Grep"]
  );

  if (!result.success) {
    return {
      experiment: {
        planId: plan.discoveryId,
        approach: plan.recommendedApproach,
        codeChanges: [],
        success: false,
        error: result.error,
      },
      costUsd: result.costUsd,
    };
  }

  return {
    experiment: extractExperimentResult(result.messages, plan),
    costUsd: result.costUsd,
  };
}

async function runEvaluationPhase(
  experiment: ExperimentResult,
  config: LoopConfig
): Promise<{ evaluation: EvaluationResult; costUsd: number }> {
  console.log("\n=== EVALUATION PHASE ===\n");

  if (!experiment.success) {
    return {
      evaluation: {
        experimentId: experiment.planId,
        tier: 1,
        passed: false,
        metrics: {},
        details: `Experiment failed: ${experiment.error}`,
      },
      costUsd: 0,
    };
  }

  const prompt = `
Evaluate this experiment:

${JSON.stringify(experiment, null, 2)}

Run tests to verify the changes work correctly.
Start with tier 1 (syntax), then tier 2 (unit tests) if that passes.
`.trim();

  const result = await runPhaseAgent(
    prompt,
    EVALUATION_SYSTEM_PROMPT,
    config,
    ["Bash", "Read", "Glob"]
  );

  if (!result.success) {
    return {
      evaluation: {
        experimentId: experiment.planId,
        tier: 1,
        passed: false,
        metrics: {},
        details: `Evaluation failed: ${result.error}`,
      },
      costUsd: result.costUsd,
    };
  }

  return {
    evaluation: extractEvaluationResult(result.messages, experiment),
    costUsd: result.costUsd,
  };
}

// ============================================================================
// Result Extraction Helpers
// ============================================================================

function extractDiscoveries(messages: string[]): Discovery[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const jsonMatch = msg.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed)) {
          return parsed as Discovery[];
        }
      } catch {
        // Continue searching
      }
    }
  }
  return [];
}

function extractFilterResult(messages: string[]): { prioritized: string[]; rejected: string[] } {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const jsonMatch = msg.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          prioritized: parsed.prioritized || [],
          rejected: parsed.rejected || [],
        };
      } catch {
        // Continue searching
      }
    }
  }
  return { prioritized: [], rejected: [] };
}

function extractExperimentResult(
  messages: string[],
  plan: ImprovementPlan
): ExperimentResult {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const jsonMatch = msg.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          planId: parsed.planId || plan.discoveryId,
          approach: parsed.approach || plan.recommendedApproach,
          codeChanges: parsed.codeChanges || [],
          success: parsed.success !== false,
          error: parsed.error,
        };
      } catch {
        // Continue searching
      }
    }
  }

  // Fallback: assume success if we got here
  return {
    planId: plan.discoveryId,
    approach: plan.recommendedApproach,
    codeChanges: [],
    success: true,
  };
}

function extractEvaluationResult(
  messages: string[],
  experiment: ExperimentResult
): EvaluationResult {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const jsonMatch = msg.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          experimentId: parsed.experimentId || experiment.planId,
          tier: parsed.tier || 1,
          passed: parsed.passed === true,
          metrics: parsed.metrics || {},
          details: parsed.details || "",
        };
      } catch {
        // Continue searching
      }
    }
  }

  return {
    experimentId: experiment.planId,
    tier: 1,
    passed: false,
    metrics: {},
    details: "Could not parse evaluation result",
  };
}

// ============================================================================
// Main Loop
// ============================================================================

export async function runImprovementLoop(
  config: Partial<LoopConfig> = {}
): Promise<LoopIteration[]> {
  const mergedConfig: LoopConfig = { ...DEFAULT_LOOP_CONFIG, ...config };
  const iterations: LoopIteration[] = [];
  let totalCost = 0;

  console.log("=== SELF-IMPROVEMENT LOOP ===");
  console.log(`Max iterations: ${mergedConfig.maxIterations}`);
  console.log(`Budget: $${mergedConfig.budgetUsd}`);
  console.log(`Target: ${mergedConfig.targetDirectory}`);

  for (let i = 0; i < mergedConfig.maxIterations; i++) {
    console.log(`\n>>> ITERATION ${i + 1} <<<\n`);

    const iteration: LoopIteration = {
      id: `iteration-${i + 1}-${Date.now()}`,
      startedAt: new Date(),
      phase: "discovery",
      discoveries: [],
      plans: [],
      experiments: [],
      evaluations: [],
      outcome: "in_progress",
      costSoFar: totalCost,
    };

    try {
      // Discovery
      iteration.phase = "discovery";
      const discoveryResult = await runDiscoveryPhase(mergedConfig);
      iteration.discoveries = discoveryResult.discoveries;
      totalCost += discoveryResult.costUsd;
      console.log(`Found ${iteration.discoveries.length} discoveries (cost: $${discoveryResult.costUsd.toFixed(4)})`);

      if (iteration.discoveries.length === 0) {
        console.log("No discoveries found. Stopping loop.");
        iteration.outcome = "terminated";
        iteration.costSoFar = totalCost;
        iterations.push(iteration);
        break;
      }

      // Budget check after discovery
      if (totalCost >= mergedConfig.budgetUsd) {
        console.log(`\nBudget exhausted after discovery ($${totalCost.toFixed(4)} >= $${mergedConfig.budgetUsd})`);
        iteration.outcome = "terminated";
        iteration.costSoFar = totalCost;
        iterations.push(iteration);
        break;
      }

      // Filter
      iteration.phase = "filter";
      const filterResult = await runFilterPhase(iteration.discoveries, mergedConfig);
      totalCost += filterResult.costUsd;
      console.log(`${filterResult.filtered.length} discoveries passed filter (cost: $${filterResult.costUsd.toFixed(4)})`);

      if (filterResult.filtered.length === 0) {
        console.log("All discoveries filtered out. Stopping loop.");
        iteration.outcome = "terminated";
        iteration.costSoFar = totalCost;
        iterations.push(iteration);
        break;
      }

      // Process top discovery
      const topDiscovery = filterResult.filtered[0];
      console.log(`\nProcessing: ${topDiscovery.id} - ${topDiscovery.type}`);

      // Analyze with SIL-006
      const plan = await analyzeDiscovery(topDiscovery, mergedConfig);
      iteration.plans.push(plan);

      // Experiment
      iteration.phase = "experiment";
      const experimentResult = await runExperimentPhase(plan, mergedConfig);
      iteration.experiments.push(experimentResult.experiment);
      totalCost += experimentResult.costUsd;
      console.log(`Experiment cost: $${experimentResult.costUsd.toFixed(4)}`);

      // Budget check after experiment
      if (totalCost >= mergedConfig.budgetUsd) {
        console.log(`\nBudget exhausted after experiment ($${totalCost.toFixed(4)} >= $${mergedConfig.budgetUsd})`);
        iteration.outcome = "terminated";
        iteration.costSoFar = totalCost;
        iterations.push(iteration);
        break;
      }

      // Evaluate
      iteration.phase = "evaluate";
      const evaluationResult = await runEvaluationPhase(experimentResult.experiment, mergedConfig);
      iteration.evaluations.push(evaluationResult.evaluation);
      totalCost += evaluationResult.costUsd;
      console.log(`Evaluation cost: $${evaluationResult.costUsd.toFixed(4)}`);

      // Determine outcome
      if (evaluationResult.evaluation.passed) {
        iteration.outcome = "success";
        console.log("\n SUCCESS: Improvement validated!");
      } else {
        iteration.outcome = "failure";
        console.log("\n FAILURE: Improvement did not validate");
      }
    } catch (error) {
      console.error("Iteration error:", error);
      iteration.outcome = "failure";
    }

    iteration.costSoFar = totalCost;
    iteration.completedAt = new Date();
    iterations.push(iteration);

    // Budget check at end of iteration
    if (totalCost >= mergedConfig.budgetUsd) {
      console.log(`\nBudget exhausted ($${totalCost.toFixed(4)} >= $${mergedConfig.budgetUsd})`);
      break;
    }

    // Early termination check
    const successRate =
      iterations.filter((it) => it.outcome === "success").length /
      iterations.length;

    if (
      iterations.length >= 3 &&
      successRate < mergedConfig.earlyTerminationThreshold
    ) {
      console.log(`\nEarly termination: success rate ${(successRate * 100).toFixed(1)}% below threshold`);
      break;
    }
  }

  // Summary
  console.log("\n=== LOOP COMPLETE ===");
  console.log(`Iterations: ${iterations.length}`);
  console.log(
    `Successes: ${iterations.filter((it) => it.outcome === "success").length}`
  );
  console.log(
    `Failures: ${iterations.filter((it) => it.outcome === "failure").length}`
  );
  console.log(`Total cost: $${totalCost.toFixed(4)}`);

  return iterations;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const budgetIndex = args.indexOf("--budget");
  const maxIterIndex = args.indexOf("--max-iterations");
  const targetIndex = args.indexOf("--target");

  const config: Partial<LoopConfig> = {
    verbose: args.includes("--verbose"),
  };

  if (budgetIndex !== -1 && args[budgetIndex + 1]) {
    config.budgetUsd = parseFloat(args[budgetIndex + 1]);
  }

  if (maxIterIndex !== -1 && args[maxIterIndex + 1]) {
    config.maxIterations = parseInt(args[maxIterIndex + 1], 10);
  }

  if (targetIndex !== -1 && args[targetIndex + 1]) {
    config.targetDirectory = args[targetIndex + 1];
  }

  try {
    const iterations = await runImprovementLoop(config);
    console.log("\nFinal Results:");
    console.log(JSON.stringify(iterations, null, 2));
  } catch (e) {
    console.error("Loop failed:", e);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
