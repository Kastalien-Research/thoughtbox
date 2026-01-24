/**
 * Core Orchestration for Reasoning Quality Evaluation
 *
 * Runs dual-run comparisons (control vs treatment) using Claude Agent SDK.
 */

import { config } from 'dotenv';
config();

import { query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type {
  ReasoningTask,
  ControlTrace,
  TreatmentTrace,
  ComparisonResult,
  ComparisonBenchmarkRun,
  ComparisonResultWithStats,
  MultiRunBenchmarkSuite,
  TaskScore,
} from './reasoning-types.js';
import { judgeLLMQuality } from './reasoning-judge.js';
import {
  calculateProcessMetricsControl,
  calculateProcessMetricsTreatment,
  calculateTaskScore,
  calculateScoreDelta,
} from './reasoning-metrics.js';
import { PROTOTYPE_TASKS } from './reasoning-tasks.js';
import {
  mean,
  std,
  median,
  min,
  max,
  confidenceInterval,
  tTest,
  cohensD,
  type RunStatistics,
  type TaskScoreStats,
} from './statistics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

/**
 * Get current git commit hash
 */
function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Generate a unique run ID
 */
function generateRunId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const commit = getGitCommit();
  return `reasoning-run-${timestamp}-${commit}`;
}

/**
 * Extract final answer from assistant messages
 * Used for correctness evaluation only - NOT for quality judging
 *
 * Strategy:
 * 1. Look for explicit answer markers (case insensitive, multi-line aware)
 * 2. Fall back to last substantial paragraph
 * 3. Last resort: last message content
 */
function extractFinalAnswer(messages: Array<{ content: string }>): string {
  if (messages.length === 0) return '';

  // Join all messages
  const fullText = messages.map(m => m.content).join('\n\n');

  // Look for explicit answer markers with better multi-line matching
  // Capture everything after the marker until we hit another major section or end
  const answerMarkers = [
    // "Final Answer: ..." or "Answer: ..." (capture rest of paragraph/section)
    /(?:final\s+)?answer:?\s*\*?\*?(.+?)(?:\n\n|$)/is,
    // "The solution is: ..." or "The answer is: ..."
    /(?:the\s+)?(?:solution|answer|conclusion)\s+is:?\s*\*?\*?(.+?)(?:\n\n|$)/is,
    // "Therefore, ..." (capture full sentence/paragraph)
    /(?:therefore|thus|so)[,\s]+(.+?)(?:\n\n|$)/is,
  ];

  for (const marker of answerMarkers) {
    const match = fullText.match(marker);
    if (match && match[1]) {
      let extracted = match[1].trim();
      // Clean up markdown formatting artifacts
      extracted = extracted.replace(/\*\*$/, '').trim();
      if (extracted.length > 10) {  // Ensure we got something substantial
        return extracted;
      }
    }
  }

  // Fall back to last substantial paragraph (split by double newlines)
  const paragraphs = fullText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const para = paragraphs[i];
    // Skip paragraphs that are just formatting or very short
    if (para.length > 50 && !para.match(/^[*_\-=]+$/)) {
      return para;
    }
  }

  // Last resort: return last message
  return messages[messages.length - 1].content.trim();
}

/**
 * Run control (without Thoughtbox)
 */
async function runControl(task: ReasoningTask): Promise<ControlTrace> {
  const startTime = performance.now();
  const assistantMessages: Array<{ content: string; timestamp: string }> = [];
  let totalBytes = 0;

  const systemPrompt = `You are a helpful AI assistant. Think step-by-step and show your reasoning clearly.`;

  try {
    for await (const message of query({
      prompt: task.prompt,
      options: {
        systemPrompt,
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: {},  // No MCP servers (control)
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        cwd: PROJECT_ROOT,
        maxTurns: 25,
        temperature: 1.0,
      },
    })) {
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if ('text' in block && block.text) {
            assistantMessages.push({
              content: block.text,
              timestamp: new Date().toISOString(),
            });
            totalBytes += block.text.length;
          }
        }
      }
    }
  } catch (error) {
    console.error('Control run error:', error);
    throw error;
  }

  const duration_ms = performance.now() - startTime;
  const fullReasoning = assistantMessages.map(m => m.content).join('\n\n');
  const finalAnswer = extractFinalAnswer(assistantMessages);

  return {
    assistantMessages,
    fullReasoning,
    finalAnswer,
    duration_ms,
    tokensEstimated: Math.ceil(totalBytes / 4),
  };
}

/**
 * Extract Thoughtbox session data from agent messages
 *
 * Attempts to parse session information from tool call patterns in the conversation.
 * This is a heuristic approach - full extraction would require direct storage access.
 *
 * Returns undefined if no Thoughtbox usage detected or data unavailable.
 */
async function extractThoughtboxSession(
  messages: Array<{ content: string; timestamp: string }>
): Promise<{
  sessionId: string;
  thoughts: Array<{ content: string; thoughtNumber: number }>;
  mentalModelsUsed: string[];
  branchesCreated: number;
} | undefined> {
  try {
    // Heuristic: Look for signs of Thoughtbox usage in messages
    // This is imperfect - real extraction would query the storage layer

    const fullText = messages.map(m => m.content).join('\n');

    // Check if Thoughtbox was mentioned or used
    const hasThoughtboxMention = /thoughtbox|thought.*gateway|mental.*model/i.test(fullText);

    if (!hasThoughtboxMention) {
      return undefined;  // Thoughtbox not used
    }

    // Try to extract thought patterns
    // Look for numbered thoughts or structured thinking
    const thoughtPatterns = fullText.match(/thought\s*#?(\d+)/gi) || [];
    const thoughts: Array<{ content: string; thoughtNumber: number }> = [];

    // Parse thoughts from messages (simplified)
    thoughtPatterns.forEach((pattern, index) => {
      thoughts.push({
        content: `Thought ${index + 1}`,  // Placeholder - real extraction needs storage access
        thoughtNumber: index + 1,
      });
    });

    // Try to detect mental model usage
    const mentalModelPatterns = /mental\s*model|framework|pattern/gi;
    const mentalModelMatches = fullText.match(mentalModelPatterns) || [];
    const mentalModelsUsed = Array.from(new Set(mentalModelMatches)).slice(0, 5);

    // Try to detect branching
    const branchPatterns = /branch|alternative|diverge/gi;
    const branchMatches = fullText.match(branchPatterns) || [];
    const branchesCreated = Math.min(branchMatches.length, 3);  // Cap at 3

    // Generate a session ID (placeholder - real ID would come from storage)
    const sessionId = `session-${Date.now()}`;

    // Only return session data if we detected actual usage
    if (thoughts.length > 0 || mentalModelsUsed.length > 0 || branchesCreated > 0) {
      return {
        sessionId,
        thoughts,
        mentalModelsUsed,
        branchesCreated,
      };
    }

    return undefined;

  } catch (error) {
    console.error('Failed to extract Thoughtbox session data:', error);
    return undefined;
  }
}

/**
 * Run treatment (with Thoughtbox)
 */
async function runTreatment(
  task: ReasoningTask,
  mcpUrl: string = 'http://localhost:1731/mcp'
): Promise<TreatmentTrace> {
  const startTime = performance.now();
  const assistantMessages: Array<{ content: string; timestamp: string }> = [];
  let totalBytes = 0;

  const systemPrompt = `You are a helpful AI assistant. Think step-by-step and show your reasoning clearly.

You have access to Thoughtbox, a structured thinking tool. Feel free to use it if it helps your reasoning, but it's not required.`;

  try {
    for await (const message of query({
      prompt: task.prompt,
      options: {
        systemPrompt,
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: {
          thoughtbox: {
            type: 'http',
            url: mcpUrl,
          },
        },
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        cwd: PROJECT_ROOT,
        maxTurns: 25,
        temperature: 1.0,
      },
    })) {
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if ('text' in block && block.text) {
            assistantMessages.push({
              content: block.text,
              timestamp: new Date().toISOString(),
            });
            totalBytes += block.text.length;
          }
        }
      }
    }
  } catch (error) {
    console.error('Treatment run error:', error);
    throw error;
  }

  const duration_ms = performance.now() - startTime;
  const fullReasoning = assistantMessages.map(m => m.content).join('\n\n');
  const finalAnswer = extractFinalAnswer(assistantMessages);

  // Extract Thoughtbox session info
  // NOTE: This requires manual extraction from Thoughtbox storage/logs
  // For automatic extraction in future, would need MCP query capability
  const thoughtboxSession = await extractThoughtboxSession(assistantMessages);

  return {
    assistantMessages,
    fullReasoning,
    finalAnswer,
    duration_ms,
    tokensEstimated: Math.ceil(totalBytes / 4),
    thoughtboxSession,
  };
}

/**
 * Run a single task comparison (control vs treatment)
 */
export async function runTaskComparison(
  task: ReasoningTask,
  mcpUrl?: string
): Promise<ComparisonResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Task: ${task.name} (${task.id})`);
  console.log(`Category: ${task.category}`);
  console.log(`${'='.repeat(60)}\n`);

  // Run control first
  console.log('Running CONTROL (without Thoughtbox)...');
  const controlTrace = await runControl(task);
  console.log(`  ✓ Completed in ${controlTrace.duration_ms.toFixed(0)}ms`);

  // Small delay between runs
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Run treatment
  console.log('Running TREATMENT (with Thoughtbox)...');
  const treatmentTrace = await runTreatment(task, mcpUrl);
  console.log(`  ✓ Completed in ${treatmentTrace.duration_ms.toFixed(0)}ms`);

  // Evaluate both runs
  console.log('Evaluating quality...');

  // LLM judge evaluation - use FULL reasoning, not just extracted answer
  const [controlJudge, treatmentJudge] = await Promise.all([
    judgeLLMQuality(task, controlTrace.fullReasoning),
    judgeLLMQuality(task, treatmentTrace.fullReasoning),
  ]);

  // Process metrics
  const controlProcessMetrics = calculateProcessMetricsControl(controlTrace);
  const treatmentProcessMetrics = calculateProcessMetricsTreatment(treatmentTrace);

  // Overall scores - now using fullReasoning for correctness evaluation
  const [controlScore, treatmentScore] = await Promise.all([
    calculateTaskScore(
      task,
      controlTrace.fullReasoning,
      controlJudge,
      controlProcessMetrics
    ),
    calculateTaskScore(
      task,
      treatmentTrace.fullReasoning,
      treatmentJudge,
      treatmentProcessMetrics
    ),
  ]);

  // Delta
  const delta = calculateScoreDelta(treatmentScore, controlScore);

  console.log(`\nResults:`);
  console.log(`  Control:   ${controlScore.overallScore.toFixed(1)}`);
  console.log(`  Treatment: ${treatmentScore.overallScore.toFixed(1)}`);
  console.log(`  Delta:     ${delta.overallScore >= 0 ? '+' : ''}${delta.overallScore.toFixed(1)}`);
  console.log(`  ${delta.overallScore > 0 ? '✓ Thoughtbox improved' : delta.overallScore < 0 ? '✗ Thoughtbox regressed' : '- No significant change'}\n`);

  return {
    taskId: task.id,
    taskName: task.name,
    category: task.category,
    control: {
      trace: controlTrace,
      score: controlScore,
      llmJudge: controlJudge,
      processMetrics: controlProcessMetrics,
    },
    treatment: {
      trace: treatmentTrace,
      score: treatmentScore,
      llmJudge: treatmentJudge,
      processMetrics: treatmentProcessMetrics,
    },
    delta: {
      correctness: delta.correctness,
      qualityScore: delta.qualityScore,
      processScore: delta.processScore,
      overallScore: delta.overallScore,
    },
    thoughtboxImproved: delta.overallScore > 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compute statistics for a score metric across multiple runs
 */
function computeScoreStatistics(scores: number[]): RunStatistics {
  return {
    mean: mean(scores),
    std: std(scores),
    median: median(scores),
    min: min(scores),
    max: max(scores),
    confidenceInterval: confidenceInterval(scores),
    runs: scores.length,
  };
}

/**
 * Compute statistics for all score components
 */
function computeTaskScoreStats(taskScores: TaskScore[]): TaskScoreStats {
  return {
    correctness: computeScoreStatistics(taskScores.map(s => s.correctness)),
    qualityScore: computeScoreStatistics(taskScores.map(s => s.qualityScore)),
    processScore: computeScoreStatistics(taskScores.map(s => s.processScore)),
    overallScore: computeScoreStatistics(taskScores.map(s => s.overallScore)),
  };
}

/**
 * Run multiple iterations of task comparison and compute statistics
 *
 * @param task Task to evaluate
 * @param numRuns Number of runs (default: 5)
 * @param mcpUrl Optional MCP server URL
 * @returns Comparison results with statistical analysis
 */
export async function runTaskComparisonWithRuns(
  task: ReasoningTask,
  numRuns: number = 5,
  mcpUrl?: string
): Promise<ComparisonResultWithStats> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Task: ${task.name} (${task.id})`);
  console.log(`Running ${numRuns} iterations for statistical validity`);
  console.log(`${'='.repeat(60)}\n`);

  const runs: ComparisonResult[] = [];

  for (let i = 0; i < numRuns; i++) {
    console.log(`\n--- Run ${i + 1}/${numRuns} ---`);
    const result = await runTaskComparison(task, mcpUrl);
    runs.push(result);

    // Small delay between runs to avoid rate limits
    if (i < numRuns - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Compute statistics across runs
  const controlScores = runs.map(r => r.control.score);
  const treatmentScores = runs.map(r => r.treatment.score);
  const deltas = runs.map(r => r.delta);

  const controlStats = computeTaskScoreStats(controlScores);
  const treatmentStats = computeTaskScoreStats(treatmentScores);
  const deltaStats = computeTaskScoreStats(deltas as any);  // Cast delta to TaskScore for stats

  // Statistical significance test (overall score)
  const test = tTest(
    treatmentScores.map(s => s.overallScore),
    controlScores.map(s => s.overallScore)
  );

  // Effect size
  const effectSize = cohensD(
    treatmentScores.map(s => s.overallScore),
    controlScores.map(s => s.overallScore)
  );

  // Determine consistent improvement (majority of runs)
  const improvementCount = runs.filter(r => r.thoughtboxImproved).length;
  const thoughtboxImprovedConsistently = improvementCount > numRuns / 2;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Multi-Run Results (n=${numRuns}):`);
  console.log(`  Control:   ${controlStats.overallScore.mean.toFixed(1)} ± ${std(controlScores.map(s => s.overallScore)).toFixed(1)}`);
  console.log(`  Treatment: ${treatmentStats.overallScore.mean.toFixed(1)} ± ${std(treatmentScores.map(s => s.overallScore)).toFixed(1)}`);
  console.log(`  Delta:     ${deltaStats.overallScore.mean >= 0 ? '+' : ''}${deltaStats.overallScore.mean.toFixed(1)} ± ${std(deltas.map(d => d.overallScore)).toFixed(1)}`);
  console.log(`  p-value:   ${test.pValue < 0.001 ? '<0.001' : test.pValue.toFixed(3)} ${test.pValue < 0.05 ? '(significant)' : ''}`);
  console.log(`  Effect:    Cohen's d = ${effectSize.toFixed(2)}`);
  console.log(`  Wins:      ${improvementCount}/${numRuns} runs improved`);
  console.log(`${'='.repeat(60)}\n`);

  return {
    taskId: task.id,
    taskName: task.name,
    category: task.category,
    runs,
    control: {
      scoreStats: controlStats,
    },
    treatment: {
      scoreStats: treatmentStats,
    },
    delta: {
      scoreStats: deltaStats,
      tTest: {
        pValue: test.pValue,
        significant: test.pValue < 0.05,
      },
      effectSize,
    },
    thoughtboxImprovedConsistently,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run full reasoning comparison suite
 */
export async function runReasoningComparisonSuite(
  tasks: ReasoningTask[] = PROTOTYPE_TASKS,
  mcpUrl?: string
): Promise<ComparisonBenchmarkRun> {
  const runId = generateRunId();
  const results: ComparisonResult[] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`REASONING QUALITY EVALUATION`);
  console.log(`Run ID: ${runId}`);
  console.log(`Tasks: ${tasks.length}`);
  console.log(`${'='.repeat(60)}\n`);

  for (const task of tasks) {
    const result = await runTaskComparison(task, mcpUrl);
    results.push(result);
  }

  // Calculate summary statistics
  const improvementCount = results.filter(r => r.thoughtboxImproved).length;
  const regressionCount = results.filter(r => r.delta.overallScore < -5).length;  // > 5 point drop
  const noChangeCount = results.length - improvementCount - regressionCount;

  const avgCorrectnessGain =
    results.reduce((sum, r) => sum + r.delta.correctness, 0) / results.length;
  const avgQualityGain =
    results.reduce((sum, r) => sum + r.delta.qualityScore, 0) / results.length;
  const avgProcessGain =
    results.reduce((sum, r) => sum + r.delta.processScore, 0) / results.length;
  const avgOverallGain =
    results.reduce((sum, r) => sum + r.delta.overallScore, 0) / results.length;

  const thoughtboxWinRate = (improvementCount / results.length) * 100;

  // Estimate cost (very rough)
  const totalTokens = results.reduce(
    (sum, r) => sum + r.control.trace.tokensEstimated + r.treatment.trace.tokensEstimated,
    0
  );
  const totalCostEstimate = (totalTokens / 1_000_000) * 45;  // Rough estimate

  return {
    runId,
    timestamp: new Date().toISOString(),
    gitCommit: getGitCommit(),
    results,
    summary: {
      totalTasks: results.length,
      improvementCount,
      regressionCount,
      noChangeCount,
      avgCorrectnessGain,
      avgQualityGain,
      avgProcessGain,
      avgOverallGain,
      thoughtboxWinRate,
      totalCostEstimate,
    },
  };
}

/**
 * Run multi-run reasoning comparison suite
 * Each task is run N times for statistical validity
 */
export async function runMultiRunReasoningSuite(
  tasks: ReasoningTask[] = PROTOTYPE_TASKS,
  numRuns: number = 5,
  mcpUrl?: string
): Promise<MultiRunBenchmarkSuite> {
  const runId = generateRunId();
  const results: ComparisonResultWithStats[] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`MULTI-RUN REASONING QUALITY EVALUATION`);
  console.log(`Run ID: ${runId}`);
  console.log(`Tasks: ${tasks.length}`);
  console.log(`Runs per task: ${numRuns}`);
  console.log(`Total comparisons: ${tasks.length * numRuns * 2} (control + treatment)`);
  console.log(`${'='.repeat(60)}\n`);

  for (const task of tasks) {
    const result = await runTaskComparisonWithRuns(task, numRuns, mcpUrl);
    results.push(result);
  }

  // Calculate summary statistics across all tasks
  const improvementCount = results.filter(r => r.thoughtboxImprovedConsistently).length;
  const regressionCount = results.filter(
    r => r.delta.scoreStats.overallScore.mean < -5
  ).length;
  const noChangeCount = results.length - improvementCount - regressionCount;

  // Compute aggregate statistics for deltas
  const allCorrectnessDeltas = results.flatMap(r =>
    r.runs.map(run => run.delta.correctness)
  );
  const allQualityDeltas = results.flatMap(r =>
    r.runs.map(run => run.delta.qualityScore)
  );
  const allProcessDeltas = results.flatMap(r =>
    r.runs.map(run => run.delta.processScore)
  );
  const allOverallDeltas = results.flatMap(r =>
    r.runs.map(run => run.delta.overallScore)
  );

  const avgCorrectnessGain = computeScoreStatistics(allCorrectnessDeltas);
  const avgQualityGain = computeScoreStatistics(allQualityDeltas);
  const avgProcessGain = computeScoreStatistics(allProcessDeltas);
  const avgOverallGain = computeScoreStatistics(allOverallDeltas);

  const thoughtboxWinRate = (improvementCount / results.length) * 100;

  // Estimate cost (rough)
  const totalTokens = results.reduce((sum, r) =>
    sum + r.runs.reduce((runSum, run) =>
      runSum + run.control.trace.tokensEstimated + run.treatment.trace.tokensEstimated,
      0
    ),
    0
  );
  const totalCostEstimate = (totalTokens / 1_000_000) * 45;  // Rough estimate

  return {
    runId,
    timestamp: new Date().toISOString(),
    gitCommit: getGitCommit(),
    runsPerTask: numRuns,
    results,
    summary: {
      totalTasks: results.length,
      improvementCount,
      regressionCount,
      noChangeCount,
      avgCorrectnessGain,
      avgQualityGain,
      avgProcessGain,
      avgOverallGain,
      thoughtboxWinRate,
      totalCostEstimate,
    },
  };
}

/**
 * Format multi-run suite results for console output
 */
export function formatMultiRunResults(run: MultiRunBenchmarkSuite): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(60)}`);
  lines.push('MULTI-RUN REASONING EVALUATION SUMMARY');
  lines.push(`${'='.repeat(60)}`);
  lines.push(`Run ID: ${run.runId}`);
  lines.push(`Git Commit: ${run.gitCommit}`);
  lines.push(`Timestamp: ${run.timestamp}`);
  lines.push(`Runs per task: ${run.runsPerTask}`);
  lines.push('');

  lines.push('Overall Results:');
  lines.push(`  Total Tasks: ${run.summary.totalTasks}`);
  lines.push(`  Thoughtbox Improved: ${run.summary.improvementCount} (${run.summary.thoughtboxWinRate.toFixed(1)}%)`);
  lines.push(`  Thoughtbox Regressed: ${run.summary.regressionCount}`);
  lines.push(`  No Significant Change: ${run.summary.noChangeCount}`);
  lines.push('');

  lines.push('Average Gains (Treatment - Control) with 95% CI:');
  const formatStat = (stat: RunStatistics) => {
    const [lower, upper] = stat.confidenceInterval;
    const margin = (upper - lower) / 2;
    return `${stat.mean >= 0 ? '+' : ''}${stat.mean.toFixed(2)} ± ${margin.toFixed(2)}`;
  };

  lines.push(`  Correctness: ${formatStat(run.summary.avgCorrectnessGain)}`);
  lines.push(`  Quality:     ${formatStat(run.summary.avgQualityGain)}`);
  lines.push(`  Process:     ${formatStat(run.summary.avgProcessGain)}`);
  lines.push(`  Overall:     ${formatStat(run.summary.avgOverallGain)}`);
  lines.push('');

  // Per-task summary
  lines.push('Per-Task Results:');
  for (const result of run.results) {
    const sig = result.delta.tTest.significant ? ' *' : '';
    const improvementIcon = result.thoughtboxImprovedConsistently ? '✓' : '✗';
    lines.push(`  ${improvementIcon} ${result.taskName}:`);
    lines.push(`    Delta: ${formatStat(result.delta.scoreStats.overallScore)}${sig}`);
    lines.push(`    p-value: ${result.delta.tTest.pValue < 0.001 ? '<0.001' : result.delta.tTest.pValue.toFixed(3)}`);
    lines.push(`    Effect size (d): ${result.delta.effectSize.toFixed(2)}`);
  }
  lines.push('');

  lines.push(`Estimated Cost: $${run.summary.totalCostEstimate.toFixed(2)}`);
  lines.push(`${'='.repeat(60)}\n`);

  return lines.join('\n');
}

/**
 * Format comparison results for console output
 */
export function formatComparisonResults(run: ComparisonBenchmarkRun): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(60)}`);
  lines.push('REASONING EVALUATION SUMMARY');
  lines.push(`${'='.repeat(60)}`);
  lines.push(`Run ID: ${run.runId}`);
  lines.push(`Git Commit: ${run.gitCommit}`);
  lines.push(`Timestamp: ${run.timestamp}`);
  lines.push('');

  lines.push('Overall Results:');
  lines.push(`  Total Tasks: ${run.summary.totalTasks}`);
  lines.push(`  Thoughtbox Improved: ${run.summary.improvementCount} (${run.summary.thoughtboxWinRate.toFixed(1)}%)`);
  lines.push(`  Thoughtbox Regressed: ${run.summary.regressionCount}`);
  lines.push(`  No Significant Change: ${run.summary.noChangeCount}`);
  lines.push('');

  lines.push('Average Gains (Treatment - Control):');
  lines.push(`  Correctness: ${run.summary.avgCorrectnessGain >= 0 ? '+' : ''}${run.summary.avgCorrectnessGain.toFixed(2)}`);
  lines.push(`  Quality:     ${run.summary.avgQualityGain >= 0 ? '+' : ''}${run.summary.avgQualityGain.toFixed(2)}`);
  lines.push(`  Process:     ${run.summary.avgProcessGain >= 0 ? '+' : ''}${run.summary.avgProcessGain.toFixed(2)}`);
  lines.push(`  Overall:     ${run.summary.avgOverallGain >= 0 ? '+' : ''}${run.summary.avgOverallGain.toFixed(2)}`);
  lines.push('');

  lines.push(`Estimated Cost: $${run.summary.totalCostEstimate.toFixed(2)}`);
  lines.push(`${'='.repeat(60)}\n`);

  return lines.join('\n');
}
