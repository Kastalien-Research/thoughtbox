#!/usr/bin/env tsx
import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { parseFrontmatter } from "./run-agent-util.js";

const DB_PATH = path.resolve(process.cwd(), "research-workflows", "workflows.db");

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function loadHunterContext(): string {
  try {
    const ownFindings = execSync(
      `sqlite3 "${DB_PATH}" "SELECT target_file, attack_pattern, finding, severity FROM adversarial_findings WHERE agent = 'silent-failure-hunter' AND found_at > datetime('now', '-30 days') ORDER BY found_at DESC LIMIT 15;" 2>/dev/null`,
      { encoding: "utf8" },
    ).trim();

    const daFindings = execSync(
      `sqlite3 "${DB_PATH}" "SELECT target_file, finding FROM adversarial_findings WHERE agent = 'devils-advocate' AND found_at > datetime('now', '-7 days') LIMIT 10;" 2>/dev/null`,
      { encoding: "utf8" },
    ).trim();

    const topPatterns = execSync(
      `sqlite3 "${DB_PATH}" "SELECT pattern_name, hit_rate, times_used FROM attack_patterns WHERE target_types LIKE '%hook%' OR target_types LIKE '%state%' OR target_types LIKE '%pipeline%' ORDER BY hit_rate DESC LIMIT 10;" 2>/dev/null`,
      { encoding: "utf8" },
    ).trim();

    let context = "\n## Hunter Playbook Context\n\n";
    if (ownFindings) {
      context += "### My Recent Findings (last 30 days)\n```\n" + ownFindings + "\n```\n\n";
    }
    if (daFindings) {
      context += "### Devil's Advocate Findings (avoid duplicating)\n```\n" + daFindings + "\n```\n\n";
    }
    if (topPatterns) {
      context += "### Top Pipeline/Hook Attack Patterns\n```\n" + topPatterns + "\n```\n\n";
    }
    return context;
  } catch {
    return "\n## Hunter Playbook Context\n\nNo playbook data yet — first hunt.\n\n";
  }
}

async function main() {
  const prompt = argValue("--prompt") ?? "";
  const budgetRaw = argValue("--budget");
  if (!prompt) {
    console.error("Usage: npx tsx scripts/agents/silent-failure-hunter.ts --prompt \"...\" [--budget 2]");
    process.exit(1);
  }

  const hunterContext = loadHunterContext();

  const agentFile = path.resolve(process.cwd(), ".claude", "agents", "silent-failure-hunter.md");
  const raw = await fs.readFile(agentFile, "utf8");
  const { fm, body } = parseFrontmatter(raw);

  const budget = budgetRaw ? Number(budgetRaw) : undefined;
  if (budget !== undefined && isNaN(budget)) {
    console.error("Error: --budget must be a number");
    process.exit(1);
  }

  const enrichedPrompt = prompt + hunterContext;

  const q = query({
    prompt: enrichedPrompt,
    options: {
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: body,
      },
      settingSources: ["project"],
      permissionMode: "bypassPermissions",
      allowedTools: ["Read", "Glob", "Grep", "Bash", "ToolSearch"],
      model: fm.model,
      maxTurns: fm.maxTurns ? Number(fm.maxTurns) : 20,
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
