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

function ensurePlaybookTables(): void {
  try {
    execSync(`sqlite3 "${DB_PATH}" "
      CREATE TABLE IF NOT EXISTS adversarial_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        found_at TEXT NOT NULL DEFAULT (datetime('now')),
        agent TEXT NOT NULL DEFAULT 'devils-advocate',
        target_file TEXT NOT NULL,
        target_type TEXT NOT NULL CHECK (target_type IN ('spec', 'implementation', 'hook', 'config', 'plan', 'test', 'agent_definition')),
        attack_pattern TEXT NOT NULL,
        finding TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'observation')),
        was_real_bug INTEGER NOT NULL DEFAULT 1,
        false_positive INTEGER NOT NULL DEFAULT 0,
        fixed INTEGER NOT NULL DEFAULT 0,
        fix_commit TEXT,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS attack_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        target_types TEXT NOT NULL,
        times_used INTEGER NOT NULL DEFAULT 0,
        times_hit INTEGER NOT NULL DEFAULT 0,
        hit_rate REAL GENERATED ALWAYS AS (CASE WHEN times_used > 0 THEN CAST(times_hit AS REAL) / times_used ELSE 0.0 END) STORED,
        avg_severity REAL NOT NULL DEFAULT 0.0,
        last_used TEXT,
        discovered_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    "`, { stdio: "pipe" });
  } catch {
    // DB may not exist yet, agent will handle gracefully
  }
}

function loadPlaybookContext(): string {
  try {
    const topPatterns = execSync(
      `sqlite3 "${DB_PATH}" "SELECT pattern_name, hit_rate, avg_severity, times_used FROM attack_patterns WHERE times_used >= 3 ORDER BY hit_rate * avg_severity DESC LIMIT 10;" 2>/dev/null`,
      { encoding: "utf8" },
    ).trim();

    const recentFindings = execSync(
      `sqlite3 "${DB_PATH}" "SELECT target_file, attack_pattern, finding, severity FROM adversarial_findings WHERE found_at > datetime('now', '-14 days') ORDER BY found_at DESC LIMIT 10;" 2>/dev/null`,
      { encoding: "utf8" },
    ).trim();

    const stats = execSync(
      `sqlite3 "${DB_PATH}" "SELECT count(*) as total, sum(CASE WHEN was_real_bug = 1 THEN 1 ELSE 0 END) as real_bugs, sum(CASE WHEN false_positive = 1 THEN 1 ELSE 0 END) as false_positives FROM adversarial_findings;" 2>/dev/null`,
      { encoding: "utf8" },
    ).trim();

    let context = "\n## Adversarial Playbook Context\n\n";
    if (topPatterns) {
      context += "### Top Attack Patterns (by hit_rate × severity)\n```\n" + topPatterns + "\n```\n\n";
    }
    if (recentFindings) {
      context += "### Recent Findings (last 14 days)\n```\n" + recentFindings + "\n```\n\n";
    }
    if (stats) {
      context += "### Lifetime Stats\n```\n" + stats + "\n```\n\n";
    }
    return context;
  } catch {
    return "\n## Adversarial Playbook Context\n\nNo playbook data yet — this is the first run.\n\n";
  }
}

async function main() {
  const prompt = argValue("--prompt") ?? "";
  const budgetRaw = argValue("--budget");
  if (!prompt) {
    console.error("Usage: npx tsx scripts/agents/devils-advocate.ts --prompt \"...\" [--budget 2]");
    process.exit(1);
  }

  ensurePlaybookTables();
  const playbookContext = loadPlaybookContext();

  const agentFile = path.resolve(process.cwd(), ".claude", "agents", "devils-advocate.md");
  const raw = await fs.readFile(agentFile, "utf8");
  const { fm, body } = parseFrontmatter(raw);

  const budget = budgetRaw ? Number(budgetRaw) : undefined;
  if (budget !== undefined && isNaN(budget)) {
    console.error("Error: --budget must be a number");
    process.exit(1);
  }

  const enrichedPrompt = prompt + playbookContext;

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
      allowedTools: ["Read", "Glob", "Grep", "Bash", "WebSearch", "ToolSearch"],
      model: fm.model,
      maxTurns: fm.maxTurns ? Number(fm.maxTurns) : 15,
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
