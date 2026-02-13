#!/usr/bin/env node
/**
 * capture-handoff.mjs
 *
 * Automatically captures git + beads state and writes .claude/session-handoff.json.
 * Called by pre_compact.sh hook before compaction.
 *
 * Design:
 * - .mjs (not .ts) to avoid tsx dependency in hook path
 * - Every exec wrapped in try/catch — must never throw
 * - Reads existing handoff first; overwrites git/beads, preserves agent data
 *   (summary, hypotheses, failedApproaches, trajectory, ooda, recommendedNextAction)
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

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
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
      lastCommit = { sha: sha?.slice(0, 7) || "", message: message || "", timestamp: timestamp || "" };
    }

    return { branch, uncommittedFiles, stagedFiles, stashCount, lastCommit };
  } catch {
    return { branch: "unknown", uncommittedFiles: 0, stagedFiles: 0, stashCount: 0, lastCommit: null };
  }
}

// --- Beads State (automatic) ---

function captureBeadsState() {
  try {
    if (!exec("command -v bd")) {
      return { openIssues: [], inProgress: [], recentlyClosed: [] };
    }

    const openRaw = exec("bd list --json --status=open");
    const inProgressRaw = exec("bd list --json --status=in_progress");

    const openIssues = safeJsonParse(openRaw) || [];
    const inProgress = safeJsonParse(inProgressRaw) || [];

    // Map to lightweight format
    const mapIssue = (i) => ({
      id: i.id || "",
      title: i.title || "",
      priority: i.priority || "",
      status: i.status || "",
    });

    return {
      openIssues: openIssues.map(mapIssue),
      inProgress: inProgress.map(mapIssue),
      recentlyClosed: [],
    };
  } catch {
    return { openIssues: [], inProgress: [], recentlyClosed: [] };
  }
}

// --- Files Changed (automatic) ---

function captureFilesChanged() {
  try {
    const diff = exec("git diff --name-only HEAD~1 2>/dev/null || git diff --name-only");
    const staged = exec("git diff --cached --name-only");
    const all = new Set([
      ...(diff ? diff.split("\n") : []),
      ...(staged ? staged.split("\n") : []),
    ]);
    return [...all].filter(Boolean);
  } catch {
    return [];
  }
}

// --- Main ---

function main() {
  // Read existing handoff to preserve agent-cooperative fields
  let existing = null;
  try {
    const raw = readFileSync(HANDOFF_PATH, "utf8");
    existing = JSON.parse(raw);
  } catch {
    // No existing file or invalid JSON — start fresh
  }

  const git = captureGitState();
  const beads = captureBeadsState();
  const filesChanged = captureFilesChanged();

  const handoff = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    sessionId: process.env.CLAUDE_SESSION_ID || "unknown",

    // Automatic captures (always overwritten)
    git,
    beads,
    filesChanged,

    // Agent-cooperative fields (preserved from existing if present)
    summary: existing?.summary || null,
    ooda: existing?.ooda || null,
    hypotheses: existing?.hypotheses || [],
    trajectory: existing?.trajectory || null,
    failedApproaches: existing?.failedApproaches || [],
    recommendedNextAction: existing?.recommendedNextAction || null,
    mcpToolsUsed: existing?.mcpToolsUsed || [],
  };

  // Ensure .claude/ directory exists
  try {
    mkdirSync(join(ROOT, ".claude"), { recursive: true });
  } catch {
    // Already exists
  }

  writeFileSync(HANDOFF_PATH, JSON.stringify(handoff, null, 2) + "\n", "utf8");
}

main();
