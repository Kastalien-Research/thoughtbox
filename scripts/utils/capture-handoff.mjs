#!/usr/bin/env node
/**
 * capture-handoff.mjs
 *
 * Automatically captures git state and writes .claude/session-handoff.json.
 * Called by PreCompact and Stop hooks.
 *
 * Design:
 * - .mjs (not .ts) to avoid tsx dependency in hook path
 * - Every exec wrapped in try/catch — must never throw
 * - Reads existing handoff first; spreads existing fields, then overwrites
 *   only the automatic captures (git). All agent-cooperative fields
 *   (summary, hypotheses, next_priorities, etc.) are preserved as-is.
 * - Uses snake_case to match session-review skill schema.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const HANDOFF_PATH = join(ROOT, ".claude", "session-handoff.json");
const EXEC_OPTS = { cwd: ROOT, timeout: 5000, encoding: "utf8", stdio: "pipe" };

// --- Helpers ---

function exec(cmd) {
  try {
    return execSync(cmd, EXEC_OPTS).trim();
  } catch {
    return "";
  }
}

// --- Git State (automatic) ---

function captureGitState() {
  try {
    const branch = exec("git rev-parse --abbrev-ref HEAD") || "unknown";

    const porcelain = exec("git status --porcelain");
    const lines = porcelain ? porcelain.split("\n") : [];
    const uncommittedFiles = lines.length;
    const stagedFiles = lines.filter((l) => /^[MADRC]/.test(l)).length;

    const stashList = exec("git stash list");
    const stashCount = stashList ? stashList.split("\n").length : 0;

    // Parse last commit using newline-separated format to avoid JSON escaping issues
    const logOutput = exec("git log -1 --format=%H%n%s%n%aI");
    let lastCommit = null;
    if (logOutput) {
      const [sha, message, timestamp] = logOutput.split("\n");
      lastCommit = { sha: sha || "", message: message || "", timestamp: timestamp || "" };
    }

    return { branch, uncommittedFiles, stagedFiles, stashCount, lastCommit };
  } catch {
    return { branch: "unknown", uncommittedFiles: 0, stagedFiles: 0, stashCount: 0, lastCommit: null };
  }
}

// --- Main ---

function main() {
  // Read existing handoff to preserve agent-cooperative fields
  let existing = {};
  try {
    const raw = readFileSync(HANDOFF_PATH, "utf8");
    existing = JSON.parse(raw) || {};
  } catch {
    // No existing file or invalid JSON — start fresh
  }

  const git = captureGitState();

  // Spread-merge: preserve ALL existing fields, override only automatic captures
  const handoff = {
    ...existing,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    session_id: process.env.CLAUDE_SESSION_ID || "unknown",
    git,
  };

  // Remove legacy camelCase keys if present
  delete handoff.sessionId;
  delete handoff.filesChanged;
  delete handoff.failedApproaches;
  delete handoff.recommendedNextAction;
  delete handoff.mcpToolsUsed;
  delete handoff.beads;

  // Ensure .claude/ directory exists
  try {
    mkdirSync(join(ROOT, ".claude"), { recursive: true });
  } catch {
    // Already exists
  }

  writeFileSync(HANDOFF_PATH, JSON.stringify(handoff, null, 2) + "\n", "utf8");
}

try {
  main();
} catch (e) {
  console.error("[capture-handoff]", e?.message || e);
  process.exit(0); // don't fail the hook
}
