#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { exec as _exec } from "child_process";
import { promisify } from "util";

const exec = promisify(_exec);
const ROOT = process.cwd();
const HANDOFF_PATH = path.join(ROOT, ".claude", "session-handoff.json");

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function isCommitAncestor(sha) {
  if (!sha) return true;
  try {
    await exec(`git merge-base --is-ancestor ${sha} HEAD`, { cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let raw;
  try {
    raw = await fs.readFile(HANDOFF_PATH, "utf8");
  } catch {
    console.error("handoff file missing");
    process.exit(1);
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("handoff file is not valid JSON");
    process.exit(1);
  }

  const errors = [];
  if (json.version !== "1.0.0") errors.push("version must be 1.0.0");
  if (!json.timestamp) errors.push("timestamp missing");
  if (!isObject(json.git)) errors.push("git missing");
  if (!isObject(json.beads)) errors.push("beads missing");

  const sha = json?.git?.lastCommit?.sha;
  if (sha && !(await isCommitAncestor(sha))) {
    errors.push("lastCommit.sha is not ancestor of HEAD (handoff may be stale)");
  }

  if (errors.length) {
    console.error(`invalid handoff: ${errors.join("; ")}`);
    process.exit(1);
  }

  console.log("handoff valid");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
