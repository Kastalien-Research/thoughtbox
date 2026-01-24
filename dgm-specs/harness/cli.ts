#!/usr/bin/env npx tsx
/**
 * CLI for SIL Benchmark Harness
 * SPEC-SIL-100: Benchmark Harness
 *
 * Usage:
 *   npx tsx dgm-specs/harness/cli.ts run         # Run benchmarks, compare to baseline
 *   npx tsx dgm-specs/harness/cli.ts baseline    # Establish new baseline
 *   npx tsx dgm-specs/harness/cli.ts report      # Generate comparison report
 *   npx tsx dgm-specs/harness/cli.ts --help      # Show help
 */

import { config } from 'dotenv';
config();

import {
  runAllBenchmarks,
  formatBenchmarkRun,
  TEST_CONFIGS,
} from './benchmark-runner.js';
import {
  loadBaseline,
  saveBaseline,
  saveToHistory,
  compareToBaseline,
  formatComparison,
} from './baseline.js';
import {
  runReasoningComparisonSuite,
  runMultiRunReasoningSuite,
  formatComparisonResults,
  formatMultiRunResults,
} from './reasoning-runner.js';
import {
  loadReasoningBaseline,
  saveReasoningBaseline,
  saveReasoningToHistory,
  compareToReasoningBaseline,
  formatReasoningComparison,
} from './reasoning-baseline.js';
import {
  PROTOTYPE_TASKS,
  estimatePrototypeCost,
} from './reasoning-tasks.js';

const HELP_TEXT = `
SIL Benchmark Harness CLI
SPEC-SIL-100: Benchmark Harness

Usage:
  npx tsx dgm-specs/harness/cli.ts <command> [options]

Commands:
  run             Run all benchmarks, compare to baseline if exists
  baseline        Run benchmarks and save as new baseline
  report          Show comparison between current run and baseline
  list            List available test configurations
  help            Show this help message

Reasoning Evaluation Commands:
  reasoning-compare   Run reasoning quality comparison (with/without Thoughtbox)
  reasoning-baseline  Establish reasoning evaluation baseline
  reasoning-report    Compare reasoning evaluation to baseline
  reasoning-list      List available reasoning tasks

Options:
  --json          Output results as JSON
  --url <url>     MCP server URL (default: http://localhost:1731/mcp)
  --runs <n>      Number of runs per task for statistical validity (default: 1)

Examples:
  # Run benchmarks and compare to baseline
  npx tsx dgm-specs/harness/cli.ts run

  # Establish new baseline
  npx tsx dgm-specs/harness/cli.ts baseline

  # Run reasoning evaluation
  npx tsx dgm-specs/harness/cli.ts reasoning-compare

  # Run reasoning evaluation with 5 runs per task (statistical mode)
  npx tsx dgm-specs/harness/cli.ts reasoning-compare --runs 5

  # Establish reasoning baseline
  npx tsx dgm-specs/harness/cli.ts reasoning-baseline

  # Run with custom MCP URL
  npx tsx dgm-specs/harness/cli.ts run --url http://localhost:4000/mcp

  # Output as JSON for CI integration
  npx tsx dgm-specs/harness/cli.ts run --json
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const jsonOutput = args.includes('--json');
  const urlIndex = args.indexOf('--url');
  const mcpUrl = urlIndex !== -1 ? args[urlIndex + 1] : 'http://localhost:1731/mcp';
  const runsIndex = args.indexOf('--runs');
  const numRuns = runsIndex !== -1 ? parseInt(args[runsIndex + 1], 10) : 1;

  // Validate API key early
  const commandsWithoutApiKey = ['list', 'reasoning-list', 'help', '--help', '-h'];
  if (!process.env.ANTHROPIC_API_KEY && !commandsWithoutApiKey.includes(command) && command !== undefined) {
    console.error(`
Error: ANTHROPIC_API_KEY environment variable is not set.

The benchmark harness uses the Claude Agent SDK which requires an Anthropic API key.

To fix this:
  1. Create a .env file with: ANTHROPIC_API_KEY=your-key
  2. Or set the environment variable directly
`);
    process.exit(1);
  }

  switch (command) {
    case 'run': {
      const currentRun = await runAllBenchmarks(TEST_CONFIGS, mcpUrl);
      const baseline = loadBaseline();

      if (jsonOutput) {
        if (baseline) {
          const comparison = compareToBaseline(currentRun, baseline);
          console.log(JSON.stringify({ run: currentRun, comparison }, null, 2));
          process.exit(comparison.verdict === 'PASS' ? 0 : 1);
        } else {
          console.log(JSON.stringify({ run: currentRun, comparison: null }, null, 2));
        }
      } else {
        console.log(formatBenchmarkRun(currentRun));
        if (baseline) {
          const comparison = compareToBaseline(currentRun, baseline);
          console.log(formatComparison(comparison));
          process.exit(comparison.verdict === 'PASS' ? 0 : 1);
        } else {
          console.log('\nNo baseline found. Run `npx tsx dgm-specs/harness/cli.ts baseline` to establish one.\n');
        }
      }

      // Save to history
      saveToHistory(currentRun);
      break;
    }

    case 'baseline': {
      console.log('Establishing new baseline...\n');
      const run = await runAllBenchmarks(TEST_CONFIGS, mcpUrl);

      if (jsonOutput) {
        console.log(JSON.stringify(run, null, 2));
      } else {
        console.log(formatBenchmarkRun(run));
      }

      saveBaseline(run);
      saveToHistory(run);

      if (!jsonOutput) {
        console.log(`\n✓ Baseline established: ${run.runId}`);
        console.log('  Future runs will compare against this baseline.\n');
      }
      break;
    }

    case 'report': {
      const baseline = loadBaseline();
      if (!baseline) {
        console.error('No baseline found. Run `baseline` command first.');
        process.exit(1);
      }

      const currentRun = await runAllBenchmarks(TEST_CONFIGS, mcpUrl);
      const comparison = compareToBaseline(currentRun, baseline);

      if (jsonOutput) {
        console.log(JSON.stringify({ baseline, current: currentRun, comparison }, null, 2));
      } else {
        console.log(formatBenchmarkRun(currentRun));
        console.log(formatComparison(comparison));
      }

      saveToHistory(currentRun);
      process.exit(comparison.verdict === 'PASS' ? 0 : 1);
    }

    case 'list': {
      console.log('\nAvailable Test Configurations:\n');
      for (const config of TEST_CONFIGS) {
        console.log(`  ${config.id}`);
        console.log(`    Name: ${config.name}`);
        console.log(`    Toolhost: ${config.toolhost}`);
        console.log(`    Steps: ${config.steps.length}`);
        console.log('');
      }
      break;
    }

    case 'reasoning-compare': {
      // Use multi-run mode if --runs > 1
      if (numRuns > 1) {
        const currentRun = await runMultiRunReasoningSuite(PROTOTYPE_TASKS, numRuns, mcpUrl);

        if (jsonOutput) {
          console.log(JSON.stringify({ run: currentRun }, null, 2));
        } else {
          console.log(formatMultiRunResults(currentRun));
          console.log('\nNote: Multi-run mode does not support baseline comparison yet.');
          console.log('      Use --runs 1 (or omit --runs) for baseline comparison.\n');
        }

        // TODO: Implement multi-run baseline comparison
        // For now, just display results without comparison
      } else {
        // Single-run mode (original behavior)
        const currentRun = await runReasoningComparisonSuite(PROTOTYPE_TASKS, mcpUrl);
        const baseline = loadReasoningBaseline();

        if (jsonOutput) {
          if (baseline) {
            const comparison = compareToReasoningBaseline(currentRun, baseline);
            console.log(JSON.stringify({ run: currentRun, comparison }, null, 2));
            process.exit(comparison.verdict === 'PASS' ? 0 : 1);
          } else {
            console.log(JSON.stringify({ run: currentRun, comparison: null }, null, 2));
          }
        } else {
          console.log(formatComparisonResults(currentRun));
          if (baseline) {
            const comparison = compareToReasoningBaseline(currentRun, baseline);
            console.log(formatReasoningComparison(comparison));
            process.exit(comparison.verdict === 'PASS' ? 0 : 1);
          } else {
            console.log('\nNo reasoning baseline found. Run `npx tsx dgm-specs/harness/cli.ts reasoning-baseline` to establish one.\n');
          }
        }

        // Save to history
        saveReasoningToHistory(currentRun);
      }
      break;
    }

    case 'reasoning-baseline': {
      console.log('Establishing new reasoning baseline...\n');
      const run = await runReasoningComparisonSuite(PROTOTYPE_TASKS, mcpUrl);

      if (jsonOutput) {
        console.log(JSON.stringify(run, null, 2));
      } else {
        console.log(formatComparisonResults(run));
      }

      saveReasoningBaseline(run);
      saveReasoningToHistory(run);

      if (!jsonOutput) {
        console.log(`\n✓ Reasoning baseline established: ${run.runId}`);
        console.log('  Future runs will compare against this baseline.\n');
      }
      break;
    }

    case 'reasoning-report': {
      const baseline = loadReasoningBaseline();
      if (!baseline) {
        console.error('No reasoning baseline found. Run `reasoning-baseline` command first.');
        process.exit(1);
      }

      const currentRun = await runReasoningComparisonSuite(PROTOTYPE_TASKS, mcpUrl);
      const comparison = compareToReasoningBaseline(currentRun, baseline);

      if (jsonOutput) {
        console.log(JSON.stringify({ baseline, current: currentRun, comparison }, null, 2));
      } else {
        console.log(formatComparisonResults(currentRun));
        console.log(formatReasoningComparison(comparison));
      }

      saveReasoningToHistory(currentRun);
      process.exit(comparison.verdict === 'PASS' ? 0 : 1);
    }

    case 'reasoning-list': {
      console.log('\nAvailable Reasoning Tasks:\n');
      for (const task of PROTOTYPE_TASKS) {
        console.log(`  ${task.id}`);
        console.log(`    Name: ${task.name}`);
        console.log(`    Category: ${task.category}`);
        console.log(`    Estimated tokens: ${task.estimatedTokens.toLocaleString()}`);
        console.log('');
      }

      const costEstimate = estimatePrototypeCost();
      console.log(`\nPrototype Suite Cost Estimate:`);
      console.log(`  Per task: $${costEstimate.perTask.toFixed(3)}`);
      console.log(`  Total:    $${costEstimate.total.toFixed(2)}`);
      console.log('');
      break;
    }

    case 'help':
    case '--help':
    case '-h':
    case undefined: {
      console.log(HELP_TEXT);
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      console.log(HELP_TEXT);
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('Benchmark error:', error);
  process.exit(1);
});
