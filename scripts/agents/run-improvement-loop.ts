#!/usr/bin/env npx tsx
/**
 * Self-Improvement Loop Runner
 *
 * Main entry point for running the autonomous improvement loop.
 * Orchestrates all SIL agents and captures learnings.
 *
 * Usage:
 *   npx tsx scripts/agents/run-improvement-loop.ts [options]
 *
 * Options:
 *   --budget <usd>         Maximum budget (default: 1.0)
 *   --max-iterations <n>   Maximum iterations (default: 3)
 *   --target <path>        Target directory (default: .)
 *   --output <path>        Output file for results (default: ./improvement-results.json)
 *   --update-claude-md     Update CLAUDE.md with learnings
 *   --dry-run              Don't make actual changes
 *   --verbose              Show detailed output
 */

import * as fs from "fs/promises";
import * as path from "path";
import { runImprovementLoop, LoopConfig } from "./sil-010-main-loop-orchestrator.js";
import { updateClaudeMd } from "./sil-012-claude-md-updater.js";
import { LoopIteration } from "./types.js";

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliOptions {
  budget: number;
  maxIterations: number;
  target: string;
  output: string;
  updateClaudeMd: boolean;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  const getArg = (flag: string, defaultValue: string): string => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
  };

  const hasFlag = (flag: string): boolean => args.includes(flag);

  return {
    budget: parseFloat(getArg("--budget", "1.0")),
    maxIterations: parseInt(getArg("--max-iterations", "3"), 10),
    target: getArg("--target", "."),
    output: getArg("--output", "./improvement-results.json"),
    updateClaudeMd: hasFlag("--update-claude-md"),
    dryRun: hasFlag("--dry-run"),
    verbose: hasFlag("--verbose"),
  };
}

function showHelp() {
  console.log(`
Self-Improvement Loop Runner

Usage:
  npx tsx scripts/agents/run-improvement-loop.ts [options]

Options:
  --budget <usd>         Maximum budget in USD (default: 1.0)
  --max-iterations <n>   Maximum number of iterations (default: 3)
  --target <path>        Target directory to improve (default: .)
  --output <path>        Output file for results JSON (default: ./improvement-results.json)
  --update-claude-md     Update CLAUDE.md with learnings after run
  --dry-run              Show what would happen without making changes
  --verbose              Show detailed output during execution
  --help                 Show this help message

Examples:
  # Run with defaults
  npx tsx scripts/agents/run-improvement-loop.ts

  # Run with specific budget and update CLAUDE.md
  npx tsx scripts/agents/run-improvement-loop.ts --budget 2.0 --update-claude-md

  # Dry run to see what would happen
  npx tsx scripts/agents/run-improvement-loop.ts --dry-run --verbose

Notes:
  - Requires ANTHROPIC_API_KEY environment variable
  - Requires Thoughtbox MCP server running at http://localhost:1731
  - Results are saved to the output file for analysis
`);
}

// ============================================================================
// Main Runner
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  const options = parseArgs();

  // Validate environment
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable not set");
    process.exit(1);
  }

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         SELF-IMPROVEMENT LOOP                              ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("Configuration:");
  console.log(`  Budget:         $${options.budget}`);
  console.log(`  Max Iterations: ${options.maxIterations}`);
  console.log(`  Target:         ${options.target}`);
  console.log(`  Output:         ${options.output}`);
  console.log(`  Update CLAUDE:  ${options.updateClaudeMd}`);
  console.log(`  Dry Run:        ${options.dryRun}`);
  console.log(`  Verbose:        ${options.verbose}`);
  console.log("");

  if (options.dryRun) {
    console.log("=== DRY RUN MODE ===");
    console.log("Would execute improvement loop with above configuration.");
    console.log("No actual changes will be made.");
    process.exit(0);
  }

  // Run the improvement loop
  let iterations: LoopIteration[];
  const startTime = Date.now();

  try {
    iterations = await runImprovementLoop({
      budgetUsd: options.budget,
      maxIterations: options.maxIterations,
      targetDirectory: options.target,
      verbose: options.verbose,
    });
  } catch (error) {
    console.error("\nLoop execution failed:", error);
    process.exit(1);
  }

  const duration = (Date.now() - startTime) / 1000;

  // Save results
  const results = {
    runAt: new Date().toISOString(),
    duration: `${duration.toFixed(1)}s`,
    configuration: options,
    iterations,
    summary: {
      totalIterations: iterations.length,
      successful: iterations.filter((i) => i.outcome === "success").length,
      failed: iterations.filter((i) => i.outcome === "failure").length,
      terminated: iterations.filter((i) => i.outcome === "terminated").length,
    },
  };

  await fs.writeFile(options.output, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${options.output}`);

  // Update CLAUDE.md if requested
  if (options.updateClaudeMd && iterations.length > 0) {
    console.log("\n--- Updating CLAUDE.md with learnings ---");
    try {
      const claudeMdPath = path.join(options.target, "CLAUDE.md");
      const updateResult = await updateClaudeMd(iterations, claudeMdPath, {
        verbose: options.verbose,
      });

      if (updateResult.updated) {
        console.log(`Added ${updateResult.learningsAdded} learnings to CLAUDE.md`);
      } else {
        console.log("No new learnings to add");
      }
    } catch (error) {
      console.error("Failed to update CLAUDE.md:", error);
      // Don't exit - this is not critical
    }
  }

  // Final summary
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                      SUMMARY                                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`  Duration:    ${duration.toFixed(1)}s`);
  console.log(`  Iterations:  ${results.summary.totalIterations}`);
  console.log(`  Successful:  ${results.summary.successful}`);
  console.log(`  Failed:      ${results.summary.failed}`);
  console.log(`  Terminated:  ${results.summary.terminated}`);

  const successRate =
    results.summary.totalIterations > 0
      ? (results.summary.successful / results.summary.totalIterations) * 100
      : 0;

  console.log(`  Success Rate: ${successRate.toFixed(1)}%`);

  // Exit code based on success
  if (results.summary.successful > 0) {
    console.log("\n Improvements made!");
    process.exit(0);
  } else if (results.summary.totalIterations === 0) {
    console.log("\n⚠ No iterations completed");
    process.exit(0);
  } else {
    console.log("\n No successful improvements");
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
