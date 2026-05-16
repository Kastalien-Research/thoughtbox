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
  if (!/^proposal-\d+$/.test(proposalId)) {
    throw new Error(`--proposal-id must match proposal-N format, got: ${proposalId}`);
  }

  // Parse --issue-number
  const issueNumberIndex = args.indexOf('--issue-number');
  if (issueNumberIndex === -1 || !args[issueNumberIndex + 1]) {
    throw new Error('--issue-number is required');
  }
  const issueNumber = parseInt(args[issueNumberIndex + 1], 10);
  if (Number.isNaN(issueNumber)) {
    throw new Error(`--issue-number must be a number, got: ${args[issueNumberIndex + 1]}`);
  }

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
  pnpm agentops:daily -- [options]
  pnpm agentops:daily:fixtures -- [options]
  tsx automation-self-improvement/agentops/runner/cli.ts <command> [options]

COMMANDS:
  daily-dev-brief     Generate daily digest and create GitHub issue
  implement           Implement an approved proposal from daily issue

OPTIONS (daily-dev-brief):
  --dry-run          Don't create GitHub issue (default: false)
  --fixtures         Explicit fixture mode, no signal collection or LLM calls
  --output-dir PATH  Save artifacts to specific directory

OPTIONS (implement):
  --proposal-id ID   Proposal ID to implement (required)
  --issue-number N   GitHub issue number (required)
  --mode MODE        SMOKE or REAL (default: REAL, or infer from label)
  --dry-run          Don't create branch/PR (default: false)
  --output-dir PATH  Save artifacts to specific directory

EXAMPLES:
  # Generate real daily digest artifacts without creating a GitHub issue
  pnpm agentops:daily -- --dry-run --output-dir /tmp/agentops-real-run

  # Validate fixture-only path wiring
  pnpm agentops:daily:fixtures -- --output-dir /tmp/agentops-fixture-run

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
  ANTHROPIC_API_KEY      Anthropic API key for real daily mode
  OPENAI_API_KEY         OpenAI API key if AGENTOPS_LLM_PROVIDER=openai
  AGENTOPS_LLM_PROVIDER  LLM provider: anthropic or openai (default: anthropic)
  AGENTOPS_LLM_MODEL     Optional model override
  GITHUB_TOKEN           GitHub API token (required only for live issue creation)
  GITHUB_REPOSITORY      Repository in owner/repo format
  GITHUB_SHA             Current commit SHA
  GITHUB_REF             Current git ref
  GITHUB_RUN_ID          GitHub Actions run ID
  GITHUB_LABEL_NAME      Label that triggered workflow (for mode inference)
  LANGSMITH_API_KEY      LangSmith API key (optional)
  LANGSMITH_PROJECT      LangSmith project name (optional)
`);
}

main();
