#!/usr/bin/env node
import { exec as _exec } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const exec = promisify(_exec);

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function dayPath(signalsDir, date = new Date()) {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return path.join(signalsDir, `${y}-${m}-${d}.jsonl`);
}

async function run(command, cwd) {
  try {
    const { stdout } = await exec(command, { cwd });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function main() {
  const sessionId = argValue("--session-id") ?? "fast-session";
  const projectRoot = argValue("--project-root") ?? process.cwd();
  const signalsDir = path.resolve(projectRoot, "agentops", "signals");
  await fs.mkdir(signalsDir, { recursive: true });

  const names = await run("git diff --name-only", projectRoot);
  const changed = names ? names.split("\n").filter(Boolean) : [];
  if (changed.length === 0) {
    process.stdout.write("No changed files detected; no signal emitted.\n");
    return;
  }

  const signal = {
    id: randomUUID(),
    source_loop: sessionId,
    source_type: "fast",
    timestamp: new Date().toISOString(),
    category: "implementation",
    payload: {
      session_id: sessionId,
      changed_files: changed,
    },
    consumed_by: [],
    fitness_tag: "HOT",
    ttl_days: 7,
  };

  await fs.appendFile(dayPath(signalsDir), `${JSON.stringify(signal)}\n`, "utf8");
  process.stdout.write(`Emitted signal with ${changed.length} changed files.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
