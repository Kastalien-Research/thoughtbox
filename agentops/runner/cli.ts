#!/usr/bin/env node
/**
 * AgentOps CLI Entry Point
 */

import dotenv from 'dotenv';
import { runDailyDevBrief } from './daily-dev-brief.js';
import { runImplementation } from './implement.js';
import { GitHubClient } from './lib/github.js';

// Load environment variables from .env file
dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'daily-dev-brief':
        await handleDailyDevBrief(args.slice(1));
        break;

      case 'implement':
        await handleImplement(args.slice(1));
        break;

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

async function handleDailyDevBrief(args: string[]): Promise<void> {
  const dryRun = args.includes('--dry-run');
  const fixturesMode = args.includes('--fixtures');
  const outputDirIndex = args.indexOf('--output-dir');
  const outputDir =
    outputDirIndex !== -1 && args[outputDirIndex + 1]
      ? args[outputDirIndex + 1]
      : undefined;

  await runDailyDevBrief({ dryRun, fixturesMode, outputDir });
}

async function handleImplement(args: string[]): Promise<void> {
  const dryRun = args.includes('--dry-run');

  // Parse --proposal-id
  const proposalIdIndex = args.indexOf('--proposal-id');
  if (proposalIdIndex === -1 || !args[proposalIdIndex + 1]) {
    throw new Error('--proposal-id is required');
  }
  const proposalId = args[proposalIdIndex + 1];

  // Parse --issue-number
  const issueNumberIndex = args.indexOf('--issue-number');
  if (issueNumberIndex === -1 || !args[issueNumberIndex + 1]) {
    throw new Error('--issue-number is required');
  }
  const issueNumber = parseInt(args[issueNumberIndex + 1], 10);

  // Parse --mode (or infer from label)
  let mode: 'SMOKE' | 'REAL' = 'REAL';
  const modeIndex = args.indexOf('--mode');
  if (modeIndex !== -1 && args[modeIndex + 1]) {
    const modeArg = args[modeIndex + 1].toUpperCase();
    if (modeArg !== 'SMOKE' && modeArg !== 'REAL') {
      throw new Error('--mode must be SMOKE or REAL');
    }
    mode = modeArg as 'SMOKE' | 'REAL';
  } else {
    // Try to infer from label in environment
    const labelName = process.env.GITHUB_LABEL_NAME;
    if (labelName) {
      const parsed = GitHubClient.parseLabel(labelName);
      if (parsed) {
        mode = parsed.mode;
      }
    }
  }

  // Parse --output-dir
  const outputDirIndex = args.indexOf('--output-dir');
  const outputDir =
    outputDirIndex !== -1 && args[outputDirIndex + 1]
      ? args[outputDirIndex + 1]
      : undefined;

  await runImplementation({
    proposalId,
    issueNumber,
    mode,
    dryRun,
    outputDir,
  });
}

function printHelp(): void {
  console.log(`
AgentOps CLI - Autonomous development workflow runner

USAGE:
  tsx agentops/runner/cli.ts <command> [options]

COMMANDS:
  daily-dev-brief     Generate daily digest and create GitHub issue
  implement           Implement an approved proposal from daily issue

OPTIONS (daily-dev-brief):
  --dry-run          Don't create GitHub issue (default: false)
  --fixtures         Use fixture data, no LLM call, zero cost (default: false)
  --output-dir PATH  Save artifacts to specific directory

OPTIONS (implement):
  --proposal-id ID   Proposal ID to implement (required)
  --issue-number N   GitHub issue number (required)
  --mode MODE        SMOKE or REAL (default: REAL, or infer from label)
  --dry-run          Don't create branch/PR (default: false)
  --output-dir PATH  Save artifacts to specific directory

EXAMPLES:
  # Generate daily digest (dry run)
  tsx agentops/runner/cli.ts daily-dev-brief --dry-run

  # Implement proposal (REAL mode)
  tsx agentops/runner/cli.ts implement \\
    --proposal-id proposal-1 \\
    --issue-number 123 \\
    --mode REAL

  # Implement proposal (SMOKE mode for testing)
  tsx agentops/runner/cli.ts implement \\
    --proposal-id proposal-2 \\
    --issue-number 123 \\
    --mode SMOKE

ENVIRONMENT VARIABLES:
  GITHUB_TOKEN           GitHub API token (required)
  GITHUB_REPOSITORY      Repository in owner/repo format (required)
  GITHUB_SHA             Current commit SHA
  GITHUB_REF             Current git ref
  GITHUB_RUN_ID          GitHub Actions run ID
  GITHUB_LABEL_NAME      Label that triggered workflow (for mode inference)
  LANGSMITH_API_KEY      LangSmith API key (optional)
  LANGSMITH_PROJECT      LangSmith project name (optional)
`);
}

main();
