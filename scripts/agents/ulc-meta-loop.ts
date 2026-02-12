#!/usr/bin/env tsx
import fs from "fs/promises";
import path from "path";
import { query } from "@anthropic-ai/claude-agent-sdk";

interface Signal {
  source_type: string;
  category: string;
  timestamp: string;
}

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

async function readSignals(): Promise<Signal[]> {
  const dir = path.resolve(process.cwd(), "agentops", "signals");
  try {
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".jsonl")).sort();
    const all: Signal[] = [];
    for (const file of files) {
      const raw = await fs.readFile(path.join(dir, file), "utf8");
      for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          all.push(JSON.parse(line));
        } catch {}
      }
    }
    return all;
  } catch {
    return [];
  }
}

function summarize(signals: Signal[]) {
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  for (const s of signals) {
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
    bySource[s.source_type] = (bySource[s.source_type] ?? 0) + 1;
  }
  return { total: signals.length, byCategory, bySource };
}

async function main() {
  const budgetRaw = argValue("--budget");
  const signals = await readSignals();
  const summary = summarize(signals);

  const prompt = [
    "You are the Unified Loop Controller meta-agent.",
    "Given this signals summary, propose parameter changes for TTL, budget split, and prompt calibration.",
    "Return concise JSON with recommendations, risks, and quickWins.",
    JSON.stringify(summary, null, 2),
  ].join("\n\n");

  const q = query({
    prompt,
    options: {
      settingSources: ["project"],
      permissionMode: "bypassPermissions",
      allowedTools: [],
      maxBudgetUsd: budgetRaw ? Number(budgetRaw) : 2,
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
