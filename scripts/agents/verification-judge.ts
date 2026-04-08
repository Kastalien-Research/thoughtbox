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

function ensureVerificationTables(): void {
  try {
    execSync(`sqlite3 "${DB_PATH}" "
      CREATE TABLE IF NOT EXISTS verification_audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verified_at TEXT NOT NULL DEFAULT (datetime('now')),
        agent TEXT NOT NULL DEFAULT 'verification-judge',
        target_artifact TEXT NOT NULL,
        target_spec TEXT NOT NULL,
        verdict TEXT NOT NULL CHECK (verdict IN ('VERIFIED', 'REJECTED', 'ESCALATE')),
        deterministic_pass INTEGER NOT NULL DEFAULT 0,
        spec_compliance_pass INTEGER NOT NULL DEFAULT 0,
        perspective_review_pass INTEGER NOT NULL DEFAULT 0,
        total_blocking_issues INTEGER NOT NULL DEFAULT 0,
        total_advisory_issues INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS verification_failures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        failure_type TEXT NOT NULL CHECK (failure_type IN ('deterministic', 'spec_compliance', 'logic', 'architecture', 'security', 'completeness', 'spec_ambiguity')),
        description TEXT NOT NULL,
        discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (audit_id) REFERENCES verification_audits(id)
      );
    "`, { stdio: "pipe" });
  } catch {
    // DB may not exist yet, agent will handle gracefully
  }
}

function loadVerificationContext(): string {
  try {
    const recentAudits = execSync(
      `sqlite3 "${DB_PATH}" "SELECT target_artifact, verdict, total_blocking_issues FROM verification_audits WHERE verified_at > datetime('now', '-7 days') ORDER BY verified_at DESC LIMIT 5;" 2>/dev/null`,
      { encoding: "utf8" },
    ).trim();

    const commonFailures = execSync(
      `sqlite3 "${DB_PATH}" "SELECT failure_type, count(*) as count FROM verification_failures GROUP BY failure_type ORDER BY count DESC LIMIT 5;" 2>/dev/null`,
      { encoding: "utf8" },
    ).trim();

    let context = "\n## Verification History Context\n\n";
    if (recentAudits) {
      context += "### Recent Audits (last 7 days)\n```\n" + recentAudits + "\n```\n\n";
    }
    if (commonFailures) {
      context += "### Most Common Failure Types\n```\n" + commonFailures + "\n```\n\n";
    }
    return context;
  } catch {
    return "\n## Verification History Context\n\nNo verification data yet — this is the first run.\n\n";
  }
}

import "dotenv/config";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(`Error: ANTHROPIC_API_KEY environment variable is not set.
Please set it in your environment or add it to a .env file in the root directory:
  export ANTHROPIC_API_KEY="your-api-key-here"`);
    process.exit(1);
  }

  const prompt = argValue("--prompt") ?? "";
  const budgetRaw = argValue("--budget");
  if (!prompt) {
    console.error('Usage: npx tsx scripts/agents/verification-judge.ts --prompt "Verify [artifact] against [spec]" [--budget 2]');
    process.exit(1);
  }

  ensureVerificationTables();
  const verificationContext = loadVerificationContext();

  const agentFile = path.resolve(process.cwd(), ".claude", "agents", "verification-judge.md");
  const raw = await fs.readFile(agentFile, "utf8");
  const { fm, body } = parseFrontmatter(raw);

  const budget = budgetRaw ? Number(budgetRaw) : undefined;
  if (budget !== undefined && isNaN(budget)) {
    console.error("Error: --budget must be a number");
    process.exit(1);
  }

  const enrichedPrompt = prompt + verificationContext + "\n\nWhen you return your final verdict, please structure the output exactly as requested in the agent definition, starting with 'Artifact: [what was verified]'. You are expected to output a strict report. You may record findings into the SQLite database at research-workflows/workflows.db proactively if needed, or simply output the text report.";

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
      allowedTools: ["Read", "Glob", "Grep", "Bash", "ToolSearch"], // Mirrors verification-judge.md
      model: fm.model,
      maxTurns: fm.maxTurns ? Number(fm.maxTurns) : 10,
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
