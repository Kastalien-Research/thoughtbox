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
} from './reasoning-types.js';
import { judgeLLMQuality } from './reasoning-judge.js';
import {
  calculateProcessMetricsControl,
  calculateProcessMetricsTreatment,
  calculateTaskScore,
  calculateScoreDelta,
} from './reasoning-metrics.js';
import { PROTOTYPE_TASKS } from './reasoning-tasks.js';

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

  // TODO: Extract Thoughtbox session info from MCP server
  // For now, we'll leave it undefined and rely on process metrics
  const thoughtboxSession = undefined;

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

  // Overall scores
  const controlScore = calculateTaskScore(
    task,
    controlTrace.finalAnswer,
    controlJudge,
    controlProcessMetrics
  );
  const treatmentScore = calculateTaskScore(
    task,
    treatmentTrace.finalAnswer,
    treatmentJudge,
    treatmentProcessMetrics
  );

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
