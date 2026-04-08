#!/usr/bin/env tsx
import { agentPath, getCommonArgs, runAgentFile } from "./run-agent-util.js";

function parseAgent(): string | null {
  const i = process.argv.indexOf("--agent");
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

async function main() {
  const agent = parseAgent();
  const { prompt, budget } = getCommonArgs();
  if (!agent || !prompt) {
    console.error("Usage: npx tsx scripts/agents/run-agent.ts --agent <name> --prompt \"...\" [--budget 2]");
    process.exit(1);
  }
  await runAgentFile({ agentFile: agentPath(agent), prompt, budget });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
