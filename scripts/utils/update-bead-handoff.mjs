#!/usr/bin/env node
/**
 * update-bead-handoff.mjs
 *
 * Updates .claude/session-handoff.json with bead progress.
 * Called after each bead close to maintain cross-session continuity.
 *
 * Usage: node update-bead-handoff.mjs --closed="thoughtbox-0ya.1,thoughtbox-0ya.2"
 *
 * Preserves all existing handoff fields. Only updates:
 * - bead_progress.completed (appends)
 * - bead_progress.remaining (from bd ready)
 * - bead_progress.blocked (from bd blocked)
 * - bead_progress.surprise_counts (per-bead failure tracking)
 * - bead_progress.last_updated
 * - git (automatic capture)
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const HANDOFF_PATH = join(ROOT, ".claude", "session-handoff.json");
const EXEC_OPTS = {
  cwd: ROOT,
  timeout: 10000,
  encoding: "utf8",
  stdio: "pipe",
};

function exec(cmd) {
  try {
    return execSync(cmd, EXEC_OPTS).trim();
  } catch {
    return "";
  }
}

function parseArgs() {
  const closed = [];
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--closed=(.+)$/);
    if (match) {
      closed.push(
        ...match[1].split(",").map((s) => s.trim()).filter(Boolean)
      );
    }
  }
  return { closed };
}

function captureGitState() {
  try {
    const branch =
      exec("git rev-parse --abbrev-ref HEAD") || "unknown";
    const porcelain = exec("git status --porcelain");
    const lines = porcelain ? porcelain.split("\n") : [];
    const logOutput = exec("git log -1 --format=%H%n%s%n%aI");
    let lastCommit = null;
    if (logOutput) {
      const [sha, message, timestamp] = logOutput.split("\n");
      lastCommit = { sha, message, timestamp };
    }
    return {
      branch,
      uncommittedFiles: lines.length,
      stagedFiles: lines.filter((l) => /^[MADRC]/.test(l)).length,
      stashCount: (exec("git stash list") || "")
        .split("\n")
        .filter(Boolean).length,
      lastCommit,
    };
  } catch {
    return { branch: "unknown" };
  }
}

function getBeadState() {
  const ready = [];
  const blocked = [];

  const readyOutput = exec("bd ready --json 2>/dev/null") || "[]";
  try {
    const items = JSON.parse(readyOutput);
    if (Array.isArray(items)) {
      for (const item of items) {
        ready.push({
          id: item.id,
          title: item.title,
          priority: item.priority,
        });
      }
    }
  } catch {
    // parse failure — leave empty
  }

  const blockedOutput = exec("bd blocked --json 2>/dev/null") || "[]";
  try {
    const items = JSON.parse(blockedOutput);
    if (Array.isArray(items)) {
      for (const item of items) {
        blocked.push({
          id: item.id,
          title: item.title,
          blocked_by: item.dependencies
            ?.filter((d) => d.type === "blocks")
            ?.map((d) => d.target) || [],
        });
      }
    }
  } catch {
    // parse failure — leave empty
  }

  return { ready, blocked };
}

function main() {
  const { closed } = parseArgs();

  let existing = {};
  try {
    existing = JSON.parse(readFileSync(HANDOFF_PATH, "utf8")) || {};
  } catch {
    // start fresh
  }

  const prev = existing.bead_progress || {};
  const prevCompleted = prev.completed || [];
  const prevSurprises = prev.surprise_counts || {};

  const newCompleted = [
    ...prevCompleted,
    ...closed.filter((id) => !prevCompleted.includes(id)),
  ];

  const { ready, blocked } = getBeadState();

  const handoff = {
    ...existing,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    session_id: process.env.CLAUDE_SESSION_ID || "unknown",
    git: captureGitState(),
    bead_progress: {
      epic: "thoughtbox-0ya",
      completed: newCompleted,
      remaining: ready,
      blocked,
      surprise_counts: prevSurprises,
      last_updated: new Date().toISOString(),
    },
  };

  try {
    mkdirSync(join(ROOT, ".claude"), { recursive: true });
  } catch {
    // exists
  }

  writeFileSync(
    HANDOFF_PATH,
    JSON.stringify(handoff, null, 2) + "\n",
    "utf8"
  );

  const total =
    newCompleted.length + ready.length + blocked.length;
  console.log(
    `[handoff] Updated: ${newCompleted.length}/${total} beads complete. ${blocked.length} blocked. ${ready.length} ready.`
  );
}

try {
  main();
} catch (e) {
  console.error("[update-bead-handoff]", e?.message || e);
  process.exit(0);
}
