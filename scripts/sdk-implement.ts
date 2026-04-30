#!/usr/bin/env tsx
/**
 * Minimum SDK runner for implementing systems autonomously, with
 * EXTERNAL verification that the agent cannot game.
 *
 * Usage:
 *   npx tsx scripts/sdk-implement.ts <path-to-spec.yaml> [--budget 5]
 *
 * Spec format (YAML):
 *   task:        prose description of what to implement
 *   constraints: list of hard rules (prepended to prompt verbatim)
 *   verify:      list of shell commands; ALL must exit 0
 *   artifacts:   list of paths that must exist after the run
 *
 * Exit codes:
 *   0  - agent claimed done AND every verify command passed AND every artifact exists
 *   1  - script error (bad spec, SDK failure)
 *   2  - GAMING DETECTED: agent finished but external verification failed
 */
import { query } from "@anthropic-ai/claude-agent-sdk";
import { promises as fsp } from "node:fs";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { parse } from "yaml";

interface Spec {
  task: string;
  constraints?: string[];
  verify?: string[];
  artifacts?: string[];
}

function arg(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i < 0 || i + 1 >= process.argv.length ? null : process.argv[i + 1];
}

async function loadSpec(specPath: string): Promise<Spec> {
  const raw = await fsp.readFile(specPath, "utf8");
  const spec = parse(raw) as Spec;
  if (!spec || typeof spec.task !== "string" || !spec.task.trim()) {
    throw new Error(`Spec ${specPath} missing required "task" field`);
  }
  return spec;
}

function buildPrompt(spec: Spec, specPath: string): string {
  const constraints = (spec.constraints ?? [])
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");
  const verify = (spec.verify ?? []).map((v) => `  - ${v}`).join("\n");
  const artifacts = (spec.artifacts ?? []).map((a) => `  - ${a}`).join("\n");

  return [
    `# HARD CONSTRAINTS (non-negotiable)`,
    constraints || "(none)",
    ``,
    `# TASK`,
    spec.task.trim(),
    ``,
    `# OPERATIONAL DEFINITION OF DONE`,
    `After your changes, these external checks WILL be run by the harness. They must all pass:`,
    ``,
    `Verify commands (each must exit 0):`,
    verify || "  (none)",
    ``,
    `Required artifacts (each must exist):`,
    artifacts || "  (none)",
    ``,
    `If you cannot satisfy these, say so explicitly. Do not claim completion if any check would fail. The harness verifies externally — claiming done without actually being done will be detected and reported as gaming.`,
    ``,
    `Spec file: ${specPath}`,
  ].join("\n");
}

function runVerifyCommands(commands: string[], cwd: string): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const cmd of commands) {
    const res = spawnSync("bash", ["-c", cmd], { cwd, stdio: "inherit" });
    if (res.status !== 0) {
      failures.push(`exit ${res.status}: ${cmd}`);
    }
  }
  return { ok: failures.length === 0, failures };
}

function checkArtifacts(artifacts: string[], cwd: string): { ok: boolean; missing: string[] } {
  const missing = artifacts.filter((a) => !existsSync(path.resolve(cwd, a)));
  return { ok: missing.length === 0, missing };
}

async function main(): Promise<void> {
  const specPath = process.argv[2];
  if (!specPath || specPath.startsWith("-")) {
    console.error("Usage: npx tsx scripts/sdk-implement.ts <spec.yaml> [--budget 5]");
    process.exit(1);
  }
  const budgetRaw = arg("--budget");
  const budget = budgetRaw ? Number(budgetRaw) : 5;
  if (Number.isNaN(budget)) {
    console.error("--budget must be a number");
    process.exit(1);
  }

  const cwd = process.cwd();
  const spec = await loadSpec(specPath);
  const prompt = buildPrompt(spec, specPath);

  const auditDir = path.join(cwd, ".sdk-runs");
  await fsp.mkdir(auditDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const auditPath = path.join(auditDir, `${path.basename(specPath, ".yaml")}-${stamp}.jsonl`);
  const audit = await fsp.open(auditPath, "a");

  console.log(`[sdk-implement] spec=${specPath} budget=$${budget} audit=${auditPath}`);

  const q = query({
    prompt,
    options: {
      settingSources: ["project"],
      permissionMode: "bypassPermissions",
      allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash"],
      maxBudgetUsd: budget,
    },
  });

  let resultSubtype = "unknown";
  let resultCost: number | undefined;
  let resultTurns: number | undefined;
  for await (const msg of q) {
    await audit.write(JSON.stringify(msg) + "\n");
    if (msg.type === "assistant") {
      const blocks = (msg.message.content as Array<{ type: string; text?: string }>).filter(
        (b) => b.type === "text" && b.text,
      );
      for (const b of blocks) process.stdout.write(b.text + "\n");
    } else if (msg.type === "result") {
      resultSubtype = msg.subtype;
      resultCost = msg.total_cost_usd;
      resultTurns = msg.num_turns;
    }
  }
  await audit.close();

  console.log(
    `\n[sdk-implement] agent finished: ${resultSubtype} | cost=$${resultCost ?? "n/a"} | turns=${resultTurns ?? "n/a"}`,
  );

  // EXTERNAL VERIFICATION — the agent does not control this.
  console.log(`\n[sdk-implement] running external verification...`);
  const verifyResult = runVerifyCommands(spec.verify ?? [], cwd);
  const artifactResult = checkArtifacts(spec.artifacts ?? [], cwd);

  if (verifyResult.ok && artifactResult.ok) {
    console.log(`[sdk-implement] PASS: all verify commands and artifact checks succeeded`);
    process.exit(0);
  }

  console.error(`\n[sdk-implement] GAMING DETECTED: agent claimed done but external verification failed`);
  if (!verifyResult.ok) {
    console.error(`  verify failures:`);
    for (const f of verifyResult.failures) console.error(`    ${f}`);
  }
  if (!artifactResult.ok) {
    console.error(`  missing artifacts:`);
    for (const m of artifactResult.missing) console.error(`    ${m}`);
  }
  console.error(`  audit log: ${auditPath}`);
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
