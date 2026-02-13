#!/usr/bin/env tsx
import fs from "fs/promises";
import path from "path";
import { query } from "@anthropic-ai/claude-agent-sdk";

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

async function main() {
  const file = argValue("--file");
  const planOnly = process.argv.includes("--plan-only");
  const budgetRaw = argValue("--budget");
  if (!file) {
    console.error("Usage: npx tsx scripts/agents/spec-implementer.ts --file <path> [--plan-only] [--budget 2]");
    process.exit(1);
  }

  const abs = path.resolve(file);
  const spec = await fs.readFile(abs, "utf8");
  const prompt = planOnly
    ? `Read this spec and produce a concrete implementation plan with ordered steps and files.\n\nSpec path: ${abs}\n\n${spec}`
    : `Read this spec and implement phase 1 if feasible; otherwise output an exact implementation plan.\n\nSpec path: ${abs}\n\n${spec}`;

  const q = query({
    prompt,
    options: {
      settingSources: ["project"],
      permissionMode: "bypassPermissions",
      allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
      maxBudgetUsd: budgetRaw ? Number(budgetRaw) : undefined,
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
