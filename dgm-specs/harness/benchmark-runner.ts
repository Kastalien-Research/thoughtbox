/**
 * Benchmark Runner for SIL Benchmark Harness
 * SPEC-SIL-100: Benchmark Harness
 *
 * Wraps the agentic test runner to capture timing and size metrics.
 */

import { config } from 'dotenv';
config();

import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { BenchmarkResult, BenchmarkRun, TestConfig } from './types.js';

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
  return `run-${timestamp}-${commit}`;
}

/**
 * Test configurations for benchmark
 */
export const TEST_CONFIGS: TestConfig[] = [
  {
    id: 'thoughtbox-basic',
    name: 'Thoughtbox Basic Flow',
    toolhost: 'thoughtbox',
    description: 'Tests basic thought progression through gateway',
    steps: [
      { operation: 'start_new', args: { newWork: { project: 'benchmark' } }, expectedBehavior: 'Creates new session' },
      { operation: 'cipher', expectedBehavior: 'Loads notation system' },
      { operation: 'thought', args: { thought: 'Benchmark thought 1', thoughtNumber: 1, totalThoughts: 3, nextThoughtNeeded: true }, expectedBehavior: 'Records thought' },
      { operation: 'thought', args: { thought: 'Benchmark thought 2', thoughtNumber: 2, totalThoughts: 3, nextThoughtNeeded: true }, expectedBehavior: 'Continues chain' },
      { operation: 'thought', args: { thought: 'Benchmark thought 3', thoughtNumber: 3, totalThoughts: 3, nextThoughtNeeded: false }, expectedBehavior: 'Completes session' },
    ],
  },
  {
    id: 'mental-models-list',
    name: 'Mental Models List Operation',
    toolhost: 'mental_models',
    description: 'Tests mental models listing through gateway',
    steps: [
      { operation: 'start_new', args: { newWork: { project: 'benchmark' } }, expectedBehavior: 'Creates new session' },
      { operation: 'cipher', expectedBehavior: 'Loads notation system' },
      { operation: 'mental_models', args: { operation: 'list_models' }, expectedBehavior: 'Returns model list' },
    ],
  },
  {
    id: 'mental-models-get',
    name: 'Mental Models Get Operation',
    toolhost: 'mental_models',
    description: 'Tests getting a specific mental model',
    steps: [
      { operation: 'start_new', args: { newWork: { project: 'benchmark' } }, expectedBehavior: 'Creates new session' },
      { operation: 'cipher', expectedBehavior: 'Loads notation system' },
      { operation: 'mental_models', args: { operation: 'get_model', args: { model: 'five-whys' } }, expectedBehavior: 'Returns model details' },
    ],
  },
  {
    id: 'init-state',
    name: 'Init State Check',
    toolhost: 'init',
    description: 'Tests getting server state',
    steps: [
      { operation: 'get_state', expectedBehavior: 'Returns current stage and session info' },
    ],
  },
];

/**
 * Run a single benchmark test using MCP client
 */
export async function runSingleBenchmark(test: TestConfig, mcpUrl: string = 'http://localhost:1731/mcp'): Promise<BenchmarkResult> {
  const startTime = performance.now();
  let totalResponseBytes = 0;
  let passed = true;
  let error: string | undefined;

  const systemPrompt = `You are a deterministic test executor. Execute EXACTLY the operations specified.
For each step, call thoughtbox_gateway with the exact operation and args provided.
Report only SUCCESS or FAILURE for each step. Be concise.`;

  const testPrompt = `Execute these operations in order using thoughtbox_gateway:

${test.steps.map((step, i) =>
  `${i + 1}. operation: "${step.operation}"${step.args ? `, args: ${JSON.stringify(step.args)}` : ''}`
).join('\n')}

For each step, report: "Step N: SUCCESS" or "Step N: FAILURE: reason"
End with: "TEST RESULT: PASS" or "TEST RESULT: FAIL"`;

  try {
    for await (const message of query({
      prompt: testPrompt,
      options: {
        systemPrompt,
        mcpServers: {
          thoughtbox: {
            type: "http",
            url: mcpUrl,
          },
        },
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        cwd: PROJECT_ROOT,
        maxTurns: 20,
      },
    })) {
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block) {
            totalResponseBytes += block.text.length;
            if (block.text.includes("TEST RESULT: FAIL") || block.text.includes("FAILURE:")) {
              passed = false;
            }
          }
        }
      } else if (message.type === "result" && message.subtype !== "success") {
        passed = false;
        error = `Agent error: ${message.subtype}`;
      }
    }
  } catch (e) {
    passed = false;
    error = String(e);
  }

  const duration_ms = performance.now() - startTime;

  return {
    testId: test.id,
    testName: test.name,
    toolhost: test.toolhost as BenchmarkResult['toolhost'],
    passed,
    duration_ms,
    response_bytes: totalResponseBytes,
    tokens_estimated: Math.ceil(totalResponseBytes / 4),
    timestamp: new Date().toISOString(),
    error,
  };
}

/**
 * Run all benchmark tests
 */
export async function runAllBenchmarks(
  configs: TestConfig[] = TEST_CONFIGS,
  mcpUrl: string = 'http://localhost:1731/mcp'
): Promise<BenchmarkRun> {
  const runId = generateRunId();
  const results: BenchmarkResult[] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`BENCHMARK RUN: ${runId}`);
  console.log(`${'='.repeat(60)}\n`);

  for (const test of configs) {
    console.log(`Running: ${test.name}...`);
    const result = await runSingleBenchmark(test, mcpUrl);
    results.push(result);
    console.log(`  ${result.passed ? '✓' : '✗'} ${result.duration_ms.toFixed(0)}ms, ${result.response_bytes} bytes`);
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length;
  const totalBytes = results.reduce((sum, r) => sum + r.response_bytes, 0);
  const totalTokens = results.reduce((sum, r) => sum + r.tokens_estimated, 0);

  return {
    runId,
    timestamp: new Date().toISOString(),
    gitCommit: getGitCommit(),
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      avg_duration_ms: avgDuration,
      total_response_bytes: totalBytes,
      total_tokens_estimated: totalTokens,
    },
  };
}

/**
 * Format benchmark run for console output
 */
export function formatBenchmarkRun(run: BenchmarkRun): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(60)}`);
  lines.push('BENCHMARK RESULTS');
  lines.push(`${'='.repeat(60)}`);
  lines.push(`Run ID: ${run.runId}`);
  lines.push(`Git Commit: ${run.gitCommit}`);
  lines.push(`Timestamp: ${run.timestamp}`);
  lines.push('');
  lines.push('Results:');

  for (const result of run.results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    lines.push(`  ${status} | ${result.testId}`);
    lines.push(`         Duration: ${result.duration_ms.toFixed(2)}ms`);
    lines.push(`         Response: ${result.response_bytes} bytes (~${result.tokens_estimated} tokens)`);
    if (result.error) {
      lines.push(`         Error: ${result.error}`);
    }
  }

  lines.push('');
  lines.push('Summary:');
  lines.push(`  Total: ${run.summary.total}`);
  lines.push(`  Passed: ${run.summary.passed}`);
  lines.push(`  Failed: ${run.summary.failed}`);
  lines.push(`  Avg Duration: ${run.summary.avg_duration_ms.toFixed(2)}ms`);
  lines.push(`  Total Response: ${run.summary.total_response_bytes} bytes`);
  lines.push(`  Est. Tokens: ${run.summary.total_tokens_estimated}`);
  lines.push(`${'='.repeat(60)}\n`);

  return lines.join('\n');
}
