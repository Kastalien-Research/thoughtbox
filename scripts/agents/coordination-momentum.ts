#!/usr/bin/env tsx
import { agentPath, getCommonArgs, runAgentFile } from "./run-agent-util.js";

async function main() {
  const { prompt, budget } = getCommonArgs();
  if (!prompt) {
    console.error("Usage: npx tsx scripts/agents/coordination-momentum.ts --prompt \"...\" [--budget 2]");
    process.exit(1);
  }
  await runAgentFile({ agentFile: agentPath("coordination-momentum"), prompt, budget });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
