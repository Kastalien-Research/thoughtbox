#!/usr/bin/env tsx
import { agentPath, getCommonArgs, runAgentFile } from "./run-agent-util.js";

async function main() {
  const { prompt, budget } = getCommonArgs();
  if (!prompt) {
    console.error("Usage: npx tsx scripts/agents/meta-agent.ts --prompt \"...\" [--budget 2]");
    process.exit(1);
  }
  await runAgentFile({ agentFile: agentPath("meta-agent"), prompt, budget });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
