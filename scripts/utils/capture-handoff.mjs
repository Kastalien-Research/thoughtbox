#!/usr/bin/env node
import { exec as _exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const exec = promisify(_exec);
const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, ".claude", "session-handoff.json");

async function run(command) {
  try {
    const { stdout } = await exec(command, { cwd: ROOT });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function main() {
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });

  const branch = await run("git branch --show-current");
  const status = await run("git status --porcelain");
  const stashCount = await run("git stash list | wc -l");
  const lastCommitRaw = await run('git log -1 --format="{\\"sha\\":\\"%H\\",\\"message\\":\\"%s\\",\\"timestamp\\":\\"%cI\\"}"');
  const lastCommit = lastCommitRaw ? JSON.parse(lastCommitRaw) : null;

  const openIssuesRaw = await run("bd list --json --status open");
  let openIssues = [];
  if (openIssuesRaw) {
    try {
      openIssues = JSON.parse(openIssuesRaw);
    } catch {
      openIssues = [];
    }
  }

  const payload = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    sessionId: null,
    git: {
      branch,
      uncommittedFiles: status ? status.split("\n").filter(Boolean).length : 0,
      stagedFiles: status
        ? status.split("\n").filter((l) => /^[AMDR]\s/.test(l)).length
        : 0,
      stashCount: stashCount ? Number(stashCount) : 0,
      lastCommit,
    },
    beads: {
      openIssues,
      inProgress: [],
      recentlyClosed: [],
    },
  };

  await fs.writeFile(OUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  process.stdout.write(`Wrote ${OUT_PATH}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
