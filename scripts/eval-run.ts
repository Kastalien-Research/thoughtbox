/**
 * eval-run — causal-lift evaluation instrument
 * SPEC: SPEC-EVAL-001 (c3, c4) / .specs/evaluation/thoughtbox-eval-strategy.md
 *
 * Measures whether giving an agent Thoughtbox improves outcomes vs. a plain
 * scratchpad baseline (assumption-1 test). Minimal cut:
 *
 *   - two LangSmith datasets: thoughtbox_core_outcomes (outcome-scored
 *     tasks) and thoughtbox_negative_controls (simple tasks where Thoughtbox
 *     should stay out of the way)
 *   - two conditions over the same tasks: `thoughtbox` (agent wired to the
 *     live Code Mode server via scripts/probes/harness.ts) and `scratchpad`
 *     (same model, same task, no tools — think-in-reply baseline)
 *   - a pairwise LLM judge ("which would you ship?") comparing conditions
 *   - an `overthinking_tax` evaluator: extra cost/latency on negative
 *     controls when Thoughtbox is in the loop
 *
 * Usage (repo root; needs LANGSMITH_API_KEY, plus .mcp.json for the
 * thoughtbox condition):
 *
 *   npx tsx scripts/eval-run.ts datasets
 *   npx tsx scripts/eval-run.ts run --dataset core_outcomes --condition scratchpad --n 2
 *   npx tsx scripts/eval-run.ts compare --dataset core_outcomes --experiments <expA>,<expB>
 *   npx tsx scripts/eval-run.ts smoke --n 2 [--model haiku] [--judge-model sonnet]
 *
 * This is an INSTRUMENT: each probe run spawns a real agent (wall clock +
 * tokens). Small N is the default; conclusions need bigger N and reruns.
 */

import { config } from "dotenv";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { evaluateComparative } from "langsmith/evaluation";
import type { Run, Example } from "langsmith/schemas";
import { loadLangSmithConfig } from "../src/evaluation/langsmith-config.js";
import { getSharedClient } from "../src/evaluation/client.js";
import { DatasetManager } from "../src/evaluation/dataset-manager.js";
import { ExperimentRunner } from "../src/evaluation/experiment-runner.js";
import type { Evaluator, ExperimentRunResult } from "../src/evaluation/types.js";
import { runProbe } from "./probes/harness.js";

config();

// =============================================================================
// Datasets
// =============================================================================

export const DATASETS = {
  core_outcomes: {
    name: "thoughtbox_core_outcomes",
    description:
      "Causal-lift core outcomes: end-user tasks where only the final result matters " +
      "(debugging, architecture choice, planning, incident analysis, decision memo, synthesis). " +
      "Judged pairwise across conditions.",
  },
  negative_controls: {
    name: "thoughtbox_negative_controls",
    description:
      "Causal-lift negative controls: simple, direct tasks where Thoughtbox should stay out " +
      "of the way. Used to measure overthinking_tax (extra cost/latency vs. scratchpad baseline).",
  },
} as const;

type DatasetKey = keyof typeof DATASETS;

interface SeedExample {
  inputs: { taskId: string; task: string };
  outputs: { rubric: string };
  metadata: {
    task_family: string;
    difficulty: "easy" | "medium" | "hard";
    negative_control: boolean;
    should_use_thoughtbox: boolean;
  };
}

const CORE_OUTCOME_EXAMPLES: SeedExample[] = [
  {
    inputs: {
      taskId: "core-debug-cache",
      task: `A Node.js service caches user profiles in a Map keyed by userId. Users report that after a password change, the old profile (with the stale display name) keeps appearing for ~1 hour, but ONLY on some instances behind the load balancer. The cache has a 60-minute TTL and is invalidated on profile update via cache.delete(userId) in the update handler. Diagnose the most likely root cause and propose a fix. Be specific about the mechanism.`,
    },
    outputs: {
      rubric:
        "Correct answers identify that cache.delete only runs on the instance that handled the update; other instances keep their local Map entry until TTL expiry — per-instance in-memory cache without cross-instance invalidation. Good fixes: shared cache (Redis), pub/sub invalidation broadcast, or short TTL + versioned keys. Wrong: blaming TTL logic or the delete call itself.",
    },
    metadata: { task_family: "debugging", difficulty: "medium", negative_control: false, should_use_thoughtbox: true },
  },
  {
    inputs: {
      taskId: "core-arch-queue",
      task: `You must add background PDF-report generation (2-90 seconds per report, ~500/day, spiky) to a small SaaS: currently a single Postgres database, two stateless API servers, no queue infrastructure, team of two engineers. Choose between (A) Postgres-backed job table with SKIP LOCKED workers, (B) Redis + BullMQ, (C) AWS SQS + Lambda. Recommend one, justify against the constraints, and name the main failure mode of your choice.`,
    },
    outputs: {
      rubric:
        "Strong answers weigh operational burden for a 2-person team and existing infra: (A) is the defensible default (no new infra, transactional enqueue, SKIP LOCKED handles 500/day trivially); must name a real failure mode (e.g. polling latency, table bloat, long-running jobs holding connections). Picking B or C is acceptable ONLY with explicit justification of the added operational cost. Weak: generic pros/cons list with no commitment or no failure mode.",
    },
    metadata: { task_family: "architecture", difficulty: "medium", negative_control: false, should_use_thoughtbox: true },
  },
  {
    inputs: {
      taskId: "core-plan-migration",
      task: `Plan the migration of a live URL-shortener (40M rows, 300 writes/min) from MySQL to Postgres with under 5 minutes of write downtime. You have one week of prep time and a staging environment. Produce an ordered step-by-step plan with rollback points. The redirect read path must never break.`,
    },
    outputs: {
      rubric:
        "Good plans include: schema conversion + staging rehearsal, initial bulk copy, CDC/dual-write catch-up phase, read-path cutover behind a flag (reads can be served from either during transition), short write freeze for final delta, verification (row counts/checksums), and explicit rollback points before write cutover. Order matters: bulk copy before CDC catch-up before cutover. Weak: 'dump and restore in the downtime window' (violates 5-min constraint at 40M rows) or no rollback story.",
    },
    metadata: { task_family: "planning", difficulty: "hard", negative_control: false, should_use_thoughtbox: true },
  },
  {
    inputs: {
      taskId: "core-incident-timeline",
      task: `Incident timeline: 09:12 deploy of api v2.41 (adds per-request feature-flag lookup). 09:31 p95 latency rises 40ms. 10:02 flag service has brief 30s outage; API error rate spikes to 8% then recovers. 10:15 latency still elevated. 10:40 rollback to v2.40; latency normal within minutes. The flag client library docs mention an in-process cache with 30s TTL and a synchronous fallback fetch on cache miss. Write the root-cause analysis: what caused the latency rise, what caused the error spike, and what single change would have prevented the user-facing impact?`,
    },
    outputs: {
      rubric:
        "Correct RCA: latency rise from synchronous flag lookups on cache misses added to the request path (v2.41); error spike because the synchronous fallback fetch made requests fail when the flag service went down (hard dependency). Prevention: async/background flag refresh with stale-on-error (or default values on failure) — decoupling request path from flag service. Weak: blaming the flag outage alone (doesn't explain 09:31 latency) or the deploy alone (doesn't explain 10:02 spike mechanism).",
    },
    metadata: { task_family: "incident_analysis", difficulty: "medium", negative_control: false, should_use_thoughtbox: true },
  },
  {
    inputs: {
      taskId: "core-memo-buyvsbuild",
      task: `Write a one-page decision memo: should a 15-person startup (Series A, B2B analytics product) build its own in-app notification system (email + in-app feed) or buy (e.g. Knock, Courier)? Engineering cost of building is estimated at 6 engineer-weeks up front + 15% of one engineer ongoing. Vendor cost ~$1,200/month at current scale, rising with volume. Notifications are NOT a differentiator but ARE revenue-critical (usage alerts drive upsell). Recommend one option with a decision rationale and the trigger conditions for revisiting.`,
    },
    outputs: {
      rubric:
        "Strong memos: clear recommendation (buy is the defensible default: non-differentiating, revenue-critical favors proven delivery infra; 6 eng-weeks of a 15-person team is expensive opportunity cost), quantified comparison, named risks of the chosen path (vendor lock-in, cost growth), and concrete revisit triggers (e.g. vendor cost exceeding an engineer-fraction, needing features vendors can't do). Weak: no commitment, no revisit triggers, or ignoring the revenue-critical constraint.",
    },
    metadata: { task_family: "decision_memo", difficulty: "medium", negative_control: false, should_use_thoughtbox: true },
  },
  {
    inputs: {
      taskId: "core-synthesis-conflict",
      task: `Three reports about the same production system disagree. Report A (APM vendor dashboard): "database is the bottleneck — 70% of trace time in Postgres." Report B (DBA): "database is healthy — CPU 30%, no slow queries over 100ms, no lock contention." Report C (SRE): "app servers show high connection-pool wait times." Synthesize these into a single coherent explanation of what is actually happening, and state what one measurement would confirm it.`,
    },
    outputs: {
      rubric:
        "Correct synthesis: all three are consistent if the app is starved on a too-small connection pool — traces attribute pool WAIT time to 'database' spans (A), while the DB itself is underloaded (B), and pool wait metrics show it directly (C). Confirming measurement: pool utilization/wait-time histogram (or comparing query execution time from pg_stat_statements vs client-observed 'db time'). Weak: picking one report as 'right' and dismissing the others, or vague 'need more data' without the pool hypothesis.",
    },
    metadata: { task_family: "synthesis", difficulty: "hard", negative_control: false, should_use_thoughtbox: true },
  },
];

const NEGATIVE_CONTROL_EXAMPLES: SeedExample[] = [
  {
    inputs: { taskId: "neg-convert-temp", task: "Convert 72°F to Celsius. Give the result to one decimal place." },
    outputs: { rubric: "22.2°C. Any answer stating 22.2 (or 22.22) is correct." },
    metadata: { task_family: "direct_computation", difficulty: "easy", negative_control: true, should_use_thoughtbox: false },
  },
  {
    inputs: { taskId: "neg-regex-iso-date", task: "Write a regular expression that matches an ISO 8601 calendar date like 2026-07-06 (four-digit year, two-digit month 01-12, two-digit day 01-31). Just the regex and one sentence of explanation." },
    outputs: { rubric: "A correct pattern like ^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$ . Looser \\d{2} groups for month/day are acceptable if stated; grossly wrong structure is not." },
    metadata: { task_family: "direct_code", difficulty: "easy", negative_control: true, should_use_thoughtbox: false },
  },
  {
    inputs: { taskId: "neg-off-by-one", task: "This JavaScript is meant to print the numbers 1 through 5 inclusive but prints 1 through 4. Fix it and show the corrected line only.\n\nfor (let i = 1; i < 5; i++) { console.log(i); }" },
    outputs: { rubric: "Change the condition to i <= 5 (or i < 6). Corrected line shown." },
    metadata: { task_family: "direct_fix", difficulty: "easy", negative_control: true, should_use_thoughtbox: false },
  },
  {
    inputs: { taskId: "neg-http-304", task: "In one or two sentences: what does an HTTP 304 response mean and when does a server send it?" },
    outputs: { rubric: "304 Not Modified — sent for conditional requests (If-None-Match/ETag or If-Modified-Since) when the resource hasn't changed, telling the client to use its cached copy." },
    metadata: { task_family: "direct_recall", difficulty: "easy", negative_control: true, should_use_thoughtbox: false },
  },
  {
    inputs: { taskId: "neg-json-rename", task: 'Rename the key "usr_nm" to "username" in this JSON and output the full result:\n\n{"usr_nm": "ada", "role": "admin", "active": true}' },
    outputs: { rubric: '{"username": "ada", "role": "admin", "active": true} — same values, key renamed, nothing else changed.' },
    metadata: { task_family: "direct_transform", difficulty: "easy", negative_control: true, should_use_thoughtbox: false },
  },
  {
    inputs: { taskId: "neg-compound-interest", task: "You invest $1,000 at 5% annual interest, compounded yearly. How much is it worth after 3 years? Round to the nearest cent." },
    outputs: { rubric: "$1,157.63 (1000 × 1.05³)." },
    metadata: { task_family: "direct_computation", difficulty: "easy", negative_control: true, should_use_thoughtbox: false },
  },
];

const SEEDS: Record<DatasetKey, SeedExample[]> = {
  core_outcomes: CORE_OUTCOME_EXAMPLES,
  negative_controls: NEGATIVE_CONTROL_EXAMPLES,
};

// =============================================================================
// Conditions
// =============================================================================

export const CONDITIONS = {
  thoughtbox: {
    thoughtbox: true,
    preamble:
      "You have access to the Thoughtbox reasoning server (thoughtbox_search / thoughtbox_execute). " +
      "Use it to structure your reasoning while you work: record your key hypotheses, decisions, and " +
      "conclusions as thoughts via tb.thought inside thoughtbox_execute. When you are done, give your " +
      "complete final answer directly in your reply.\n\nTask:\n",
  },
  scratchpad: {
    thoughtbox: false,
    preamble:
      "Work through the task in a written scratchpad: think step by step in your reply, laying out " +
      "hypotheses, decisions, and conclusions as you go. Then give your complete final answer.\n\nTask:\n",
  },
} as const;

type ConditionKey = keyof typeof CONDITIONS;

interface TargetOutputs extends Record<string, any> {
  answer: string;
  condition: ConditionKey;
  completed: boolean;
  turns: number;
  tbOperations: string[];
  costUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
  error: string | null;
}

function makeTarget(condition: ConditionKey, model: string | undefined, maxTurns: number) {
  const spec = CONDITIONS[condition];
  return async (inputs: Record<string, any>): Promise<TargetOutputs> => {
    const task = String(inputs.task ?? "");
    const taskId = String(inputs.taskId ?? "unknown");
    const result = await runProbe({
      name: `eval-${condition}-${taskId}`,
      prompt: spec.preamble + task,
      thoughtbox: spec.thoughtbox,
      maxTurns,
      ...(model ? { model } : {}),
    });
    console.log(
      `  [${condition}] ${taskId}: ${result.completed ? "done" : "INCOMPLETE"} ` +
        `(${(result.durationMs / 1000).toFixed(1)}s, $${result.usage.totalCostUsd?.toFixed(4) ?? "?"}, ` +
        `${result.turns} turns, tb ops: ${result.tbOperations.join(",") || "none"})`,
    );
    return {
      answer: result.finalText,
      condition,
      completed: result.completed,
      turns: result.turns,
      tbOperations: result.tbOperations,
      costUsd: result.usage.totalCostUsd ?? null,
      inputTokens: result.usage.inputTokens ?? null,
      outputTokens: result.usage.outputTokens ?? null,
      durationMs: result.durationMs,
      error: result.error ?? null,
    };
  };
}

// =============================================================================
// Evaluators
// =============================================================================

/** Code evaluator: did the agent finish and produce a non-empty answer? */
export const taskCompletedEvaluator: Evaluator = ({ outputs }) => ({
  key: "task_completed",
  score: outputs.completed && String(outputs.answer ?? "").trim().length > 0 ? 1 : 0,
  comment: outputs.error ? `error: ${outputs.error}` : undefined,
});

interface BaselineStats {
  costUsd: number | null;
  durationMs: number;
  outputTokens: number | null;
}

/**
 * overthinking_tax — on negative-control examples only, the extra cost (USD)
 * the Thoughtbox condition spends vs. the scratchpad baseline on the same
 * example. Latency and token deltas ride along in evaluatorInfo. Positive
 * score = Thoughtbox made the simple task more expensive.
 */
export function makeOverthinkingTaxEvaluator(baseline: Map<string, BaselineStats>): Evaluator {
  return ({ example, outputs }) => {
    const isNegativeControl = (example.metadata as Record<string, unknown> | undefined)?.negative_control === true;
    if (!isNegativeControl) {
      return { key: "overthinking_tax", comment: "n/a — not a negative-control example" };
    }
    const base = example.id ? baseline.get(example.id) : undefined;
    if (!base) {
      return { key: "overthinking_tax", comment: "n/a — no scratchpad baseline for this example" };
    }
    const costDelta =
      typeof outputs.costUsd === "number" && typeof base.costUsd === "number"
        ? outputs.costUsd - base.costUsd
        : null;
    const latencyDeltaMs = outputs.durationMs - base.durationMs;
    const tokenDelta =
      typeof outputs.outputTokens === "number" && typeof base.outputTokens === "number"
        ? outputs.outputTokens - base.outputTokens
        : null;
    return {
      key: "overthinking_tax",
      // Score is the raw USD delta so the aggregate reads as "mean extra $
      // per negative-control task". Latency/token deltas in evaluatorInfo.
      score: costDelta ?? undefined,
      comment:
        `Δcost=$${costDelta?.toFixed(4) ?? "?"} Δlatency=${(latencyDeltaMs / 1000).toFixed(1)}s ` +
        `Δtokens=${tokenDelta ?? "?"} vs scratchpad baseline`,
      evaluatorInfo: { costDelta, latencyDeltaMs, tokenDelta },
    };
  };
}

// =============================================================================
// Pairwise LLM judge
// =============================================================================

/** One-shot, tool-less LLM call via the Agent SDK (ambient auth). */
async function judgeOnce(prompt: string, model: string | undefined): Promise<string> {
  let text = "";
  for await (const message of query({
    prompt,
    options: {
      allowedTools: [],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 1,
      ...(model ? { model } : {}),
    },
  })) {
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if ("text" in block) text += block.text;
      }
    }
  }
  return text.trim();
}

export interface PairwiseSummary {
  comparisons: number;
  winsByCondition: Record<string, number>;
  ties: number;
}

/**
 * Run outputs can lag LangSmith ingestion for a few seconds after an
 * experiment finishes; an empty answer at judge time is usually that race,
 * not a real empty response. Refetch the run until outputs land.
 */
async function resolveRunOutputs(
  client: ReturnType<typeof getSharedClient>,
  run: Run,
  provided: Record<string, any>,
): Promise<Record<string, any>> {
  if (String(provided?.answer ?? "").trim().length > 0) return provided;
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    const fresh = await client.readRun(run.id);
    const outputs = (fresh.outputs ?? {}) as Record<string, any>;
    if (String(outputs.answer ?? "").trim().length > 0) return outputs;
  }
  console.warn(`  [judge] run ${run.id} still has an empty answer after refetch — judging as empty`);
  return provided ?? {};
}

/**
 * Comparative evaluator: "which response would you ship?" Scores 1 for the
 * winner run, 0 for the loser. Tracks per-condition wins in `summary`.
 */
function makePairwiseJudge(
  client: ReturnType<typeof getSharedClient>,
  judgeModel: string | undefined,
  summary: PairwiseSummary,
) {
  return async (args: { runs: Run[]; example: Example; inputs: Record<string, any>; outputs: Record<string, any>[] }) => {
    const { runs, example, inputs } = args;
    if (runs.length !== 2 || args.outputs.length !== 2) {
      throw new Error(`pairwise judge expects exactly 2 runs, got ${runs.length}`);
    }
    const outputs = [
      await resolveRunOutputs(client, runs[0], args.outputs[0]),
      await resolveRunOutputs(client, runs[1], args.outputs[1]),
    ];
    const rubric = (example.outputs as Record<string, unknown> | undefined)?.rubric ?? "(none)";
    const prompt = [
      "You are an exacting engineering lead judging two AI assistant responses to the same task.",
      "Decide which response you would actually ship to the requester. Judge on correctness against",
      "the rubric, specificity, and actionability — NOT on length. Longer is not better.",
      "",
      `TASK:\n${inputs.task}`,
      "",
      `HIDDEN RUBRIC (the assistants did not see this):\n${rubric}`,
      "",
      `RESPONSE A:\n${outputs[0].answer ?? "(empty)"}`,
      "",
      `RESPONSE B:\n${outputs[1].answer ?? "(empty)"}`,
      "",
      'Reply with ONLY a JSON object, no code fences: {"winner": "A" | "B", "reason": "<one sentence>"}',
    ].join("\n");

    const raw = await judgeOnce(prompt, judgeModel);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`judge returned unparseable output: ${raw.slice(0, 200)}`);
    const verdict = JSON.parse(match[0]) as { winner: "A" | "B"; reason?: string };
    if (verdict.winner !== "A" && verdict.winner !== "B") {
      throw new Error(`judge verdict has no winner: ${match[0].slice(0, 200)}`);
    }

    const winnerIdx = verdict.winner === "A" ? 0 : 1;
    const winnerCondition = String(outputs[winnerIdx].condition ?? "unknown");
    summary.comparisons += 1;
    summary.winsByCondition[winnerCondition] = (summary.winsByCondition[winnerCondition] ?? 0) + 1;
    console.log(`  [judge] ${inputs.taskId}: winner=${winnerCondition} — ${verdict.reason ?? ""}`);

    const scores: Record<string, number> = {};
    for (let i = 0; i < runs.length; i++) {
      scores[runs[i].id] = i === winnerIdx ? 1 : 0;
    }
    return { key: "pairwise_ship_preference", scores };
  };
}

// =============================================================================
// Commands
// =============================================================================

function requireLangSmith() {
  const config = loadLangSmithConfig();
  if (!config) {
    console.error("LANGSMITH_API_KEY is not set. The instrument needs LangSmith to store datasets and experiments.");
    process.exit(1);
  }
  return { config, client: getSharedClient(config) };
}

async function cmdDatasets(): Promise<void> {
  const { config, client } = requireLangSmith();
  const manager = new DatasetManager(config, client);

  for (const key of Object.keys(DATASETS) as DatasetKey[]) {
    const { name, description } = DATASETS[key];
    await manager.ensureDataset(name, description);
    const existing = await manager.getDatasetExamples(name, { limit: 1 });
    if (existing.length > 0) {
      console.log(`dataset ${name}: exists with examples — leaving as-is`);
      continue;
    }
    const added = await manager.addExamples(name, SEEDS[key]);
    console.log(`dataset ${name}: created and seeded ${added} examples`);
  }
}

interface RunOpts {
  dataset: DatasetKey;
  condition: ConditionKey;
  n?: number;
  model?: string;
  maxTurns: number;
  evaluators: Evaluator[];
  concurrency: number;
}

async function runCondition(opts: RunOpts): Promise<ExperimentRunResult> {
  const { config, client } = requireLangSmith();
  const manager = new DatasetManager(config, client);
  const runner = new ExperimentRunner(config, client);
  const datasetName = DATASETS[opts.dataset].name;

  let exampleIds: string[] | undefined;
  if (opts.n && opts.n > 0) {
    const examples = await manager.getDatasetExamples(datasetName, { limit: opts.n });
    if (examples.length === 0) {
      console.error(`dataset ${datasetName} has no examples — run 'datasets' first`);
      process.exit(1);
    }
    exampleIds = examples.map((e) => e.id);
  }

  console.log(`\n=== experiment: ${datasetName} / ${opts.condition} (n=${exampleIds?.length ?? "all"}) ===`);
  const result = await runner.runExperiment({
    datasetName,
    exampleIds,
    target: makeTarget(opts.condition, opts.model, opts.maxTurns),
    evaluators: opts.evaluators,
    experimentPrefix: `causal-lift-${opts.dataset}-${opts.condition}`,
    description: `Causal-lift ${opts.condition} condition on ${datasetName}`,
    metadata: { condition: opts.condition, model: opts.model ?? "session-default", instrument: "eval-run" },
    maxConcurrency: opts.concurrency,
  });
  if (!result) {
    console.error("experiment produced no result (see warnings above)");
    process.exit(1);
  }
  console.log(
    `experiment ${result.experimentName}: ${result.totalExamples} examples, ` +
      `${(result.totalDuration_ms / 1000).toFixed(0)}s, aggregates=${JSON.stringify(result.aggregateScores)}`,
  );
  return result;
}

function extractBaseline(result: ExperimentRunResult): Map<string, BaselineStats> {
  const map = new Map<string, BaselineStats>();
  for (const row of result.exampleResults) {
    map.set(row.exampleId, {
      costUsd: typeof row.outputs.costUsd === "number" ? row.outputs.costUsd : null,
      durationMs: typeof row.outputs.durationMs === "number" ? row.outputs.durationMs : 0,
      outputTokens: typeof row.outputs.outputTokens === "number" ? row.outputs.outputTokens : null,
    });
  }
  return map;
}

async function cmdCompare(datasetKey: DatasetKey, experimentNames: [string, string], judgeModel?: string): Promise<PairwiseSummary> {
  const { client } = requireLangSmith();
  const summary: PairwiseSummary = { comparisons: 0, winsByCondition: {}, ties: 0 };
  console.log(`\n=== pairwise judge: ${experimentNames[0]} vs ${experimentNames[1]} ===`);
  await evaluateComparative([experimentNames[0], experimentNames[1]], {
    evaluators: [makePairwiseJudge(client, judgeModel, summary) as any],
    client,
    randomizeOrder: true,
    experimentPrefix: `causal-lift-${datasetKey}-pairwise`,
    description: "Which would you ship? Pairwise judge across conditions.",
    maxConcurrency: 1,
  });
  console.log(`pairwise summary: ${JSON.stringify(summary)}`);
  return summary;
}

async function cmdSmoke(n: number, model?: string, judgeModel?: string, maxTurns = 16): Promise<void> {
  await cmdDatasets();

  const totals: Record<string, unknown> = {};

  // 1) core_outcomes: scratchpad baseline, then thoughtbox, then pairwise judge
  const coreScratch = await runCondition({
    dataset: "core_outcomes", condition: "scratchpad", n, model, maxTurns,
    evaluators: [taskCompletedEvaluator], concurrency: 1,
  });
  const coreTb = await runCondition({
    dataset: "core_outcomes", condition: "thoughtbox", n, model, maxTurns,
    evaluators: [taskCompletedEvaluator], concurrency: 1,
  });
  const pairwise = await cmdCompare("core_outcomes", [coreScratch.experimentName, coreTb.experimentName], judgeModel);

  // 2) negative_controls: scratchpad baseline feeds overthinking_tax on the
  //    thoughtbox condition
  const negScratch = await runCondition({
    dataset: "negative_controls", condition: "scratchpad", n, model, maxTurns,
    evaluators: [taskCompletedEvaluator], concurrency: 1,
  });
  const negTb = await runCondition({
    dataset: "negative_controls", condition: "thoughtbox", n, model, maxTurns,
    evaluators: [taskCompletedEvaluator, makeOverthinkingTaxEvaluator(extractBaseline(negScratch))],
    concurrency: 1,
  });

  totals.core_scratchpad = { experiment: coreScratch.experimentName, aggregates: coreScratch.aggregateScores };
  totals.core_thoughtbox = { experiment: coreTb.experimentName, aggregates: coreTb.aggregateScores };
  totals.pairwise_ship_preference = pairwise;
  totals.negative_scratchpad = { experiment: negScratch.experimentName, aggregates: negScratch.aggregateScores };
  totals.negative_thoughtbox = {
    experiment: negTb.experimentName,
    aggregates: negTb.aggregateScores,
    overthinking_tax_mean_usd: negTb.aggregateScores.overthinking_tax ?? null,
  };

  console.log("\n=== smoke summary ===");
  console.log(JSON.stringify(totals, null, 2));
  console.log(
    "\nInstrument check complete. These numbers are NOT experimental conclusions — " +
      "N is tiny and single-run. Scale N and rerun for real measurements.",
  );
}

// =============================================================================
// CLI
// =============================================================================

function argValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

function parseDatasetKey(raw: string | undefined): DatasetKey {
  if (raw === "core_outcomes" || raw === "core") return "core_outcomes";
  if (raw === "negative_controls" || raw === "neg") return "negative_controls";
  console.error(`--dataset must be core_outcomes|negative_controls (got: ${raw ?? "missing"})`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  const model = argValue(args, "--model");
  const judgeModel = argValue(args, "--judge-model");
  const n = argValue(args, "--n") ? Number(argValue(args, "--n")) : undefined;
  const maxTurns = argValue(args, "--max-turns") ? Number(argValue(args, "--max-turns")) : 16;

  switch (command) {
    case "datasets":
      await cmdDatasets();
      break;
    case "run": {
      const dataset = parseDatasetKey(argValue(args, "--dataset"));
      const conditionRaw = argValue(args, "--condition");
      if (conditionRaw !== "thoughtbox" && conditionRaw !== "scratchpad") {
        console.error(`--condition must be thoughtbox|scratchpad (got: ${conditionRaw ?? "missing"})`);
        process.exit(1);
      }
      await runCondition({
        dataset, condition: conditionRaw, n, model, maxTurns,
        evaluators: [taskCompletedEvaluator], concurrency: 1,
      });
      break;
    }
    case "compare": {
      const dataset = parseDatasetKey(argValue(args, "--dataset"));
      const experiments = argValue(args, "--experiments")?.split(",");
      if (!experiments || experiments.length !== 2) {
        console.error("--experiments requires exactly two comma-separated experiment names");
        process.exit(1);
      }
      await cmdCompare(dataset, [experiments[0], experiments[1]], judgeModel);
      break;
    }
    case "smoke":
      await cmdSmoke(n ?? 2, model, judgeModel, maxTurns);
      break;
    default:
      console.log(
        [
          "eval-run — causal-lift evaluation instrument (SPEC-EVAL-001)",
          "",
          "commands:",
          "  datasets                                        ensure + seed the two LangSmith datasets",
          "  run --dataset core|neg --condition thoughtbox|scratchpad [--n N] [--model M] [--max-turns T]",
          "  compare --dataset core|neg --experiments <expA>,<expB> [--judge-model M]",
          "  smoke [--n 2] [--model M] [--judge-model M]     full end-to-end small-N run",
        ].join("\n"),
      );
      process.exit(command ? 1 : 0);
  }
}

main().catch((err) => {
  console.error("eval-run failed:", err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
