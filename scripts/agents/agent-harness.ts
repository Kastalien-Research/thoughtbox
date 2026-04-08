#!/usr/bin/env tsx
import { query } from "@anthropic-ai/claude-agent-sdk";

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

async function main() {
  const prompt = argValue("--prompt") ?? "";
  const toolsRaw = argValue("--tools");
  const budgetRaw = argValue("--budget");
  if (!prompt) {
    console.error("Usage: npx tsx scripts/agents/agent-harness.ts --prompt \"...\" [--budget 2] [--tools Read,Edit,Bash]");
    process.exit(1);
  }

  const budget = budgetRaw ? Number(budgetRaw) : undefined;
  if (budget !== undefined && isNaN(budget)) {
    console.error("Error: --budget must be a number");
    process.exit(1);
  }

  const allowedTools = toolsRaw
    ? toolsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Read", "Edit", "Glob", "Grep", "Bash"];

  const q = query({
    prompt,
    options: {
      settingSources: ["project"],
      permissionMode: "bypassPermissions",
      allowedTools,
      maxBudgetUsd: budget,
    },
  });

  for await (const msg of q) {
    if (msg.type === "assistant") {
      const blocks = msg.message.content.filter((b: any) => b.type === "text");
      for (const block of blocks) process.stdout.write(`${block.text}\n`);
    } else if (msg.type === "result") {
      process.stdout.write(
        `Result: ${msg.subtype} | cost: ${msg.total_cost_usd ?? "n/a"} | turns: ${msg.num_turns}\n`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
