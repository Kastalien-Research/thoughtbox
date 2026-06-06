#!/usr/bin/env node
// Canonical acceptance harness for SPEC-TV-REMOTE-WEDGE. The tournament gate
// re-overlays this file from main before running it, so a candidate cannot
// weaken its own ruler. Pure Node 22 (global fetch), no dependencies.
//
// Design against gaming: every phase keys off a per-run NONCE, so a candidate
// cannot hardcode the command/constraint. Phase A is a negative control (the
// action is allowed BEFORE seeding, blocked AFTER) which forces the verdict to
// depend on stored state — not a string match. Run from the repo root AFTER
// `pnpm build`. Writes the verdict to $TB_RESULT_PATH (default
// .tournament-result.json) and exits non-zero on any failure.

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";

const N = randomBytes(5).toString("hex");
const HOOK = "plugins/thoughtbox-claude-code/scripts/protocol_gate.sh";
const RESULT = process.env.TB_RESULT_PATH || ".tournament-result.json";
let BASE = "";
const ctx = {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[harness]", ...a);
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

function freePort() {
  return new Promise((res, rej) => {
    const s = createServer();
    s.on("error", rej);
    s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); });
  });
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

async function get(path) {
  const res = await fetch(BASE + path);
  return res.json().catch(() => ({}));
}

const enforceCmd = (command, extra = {}) =>
  post("/protocol/enforcement", {
    action: { tool: "Bash", command, args: { command, ...extra } },
    workspaceId: null,
    sessionId: "harness",
  });

const seed = (match, lesson) =>
  post("/protocol/constraints", { operation: "Bash", match, rung: "gate", irreversible: true, lesson });

function runHook(command, thoughtboxUrl) {
  const input = JSON.stringify({ tool_name: "Bash", tool_input: { command } });
  return spawnSync("bash", [HOOK], {
    input, encoding: "utf8", env: { ...process.env, THOUGHTBOX_URL: thoughtboxUrl },
  }).status;
}

async function tracesFor(token) {
  const r = await get("/protocol/traces?limit=100");
  return (r.traces || []).filter((t) => ((t.action && t.action.command) || "").includes(token));
}

async function waitForServer(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await enforceCmd(`probe-${N}`);
      if (r && (r.decision === "allow" || r.decision === "block")) return true;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  return false;
}

// --- phases (each keyed off the per-run nonce N) -----------------------------

async function phaseA() {
  const cmd = `danger-${N} --execute`;
  const pre = await enforceCmd(cmd);
  assert(pre.decision === "allow", `negative control failed: blocked before any constraint was seeded (got ${pre.decision})`);
  const lesson = `irreversible: do not run danger-${N}`;
  const s = await seed(`danger-${N}`, lesson);
  assert(s.constraintId, "seed returned no constraintId");
  const blk = await enforceCmd(cmd);
  assert(blk.decision === "block", `expected block after seed, got ${blk.decision}`);
  assert(blk.rung === "gate", `expected rung gate, got ${blk.rung}`);
  assert(blk.lesson && blk.lesson.includes(N), "block carried no nonce-bearing lesson (verdict not from stored state)");
  assert(blk.traceId, "block carried no traceId");
  const blocked = (await tracesFor(N)).filter((t) => t.decision === "block");
  assert(blocked.length > 0, "no blocked action-trace persisted for our command");
  assert(blocked.some((t) => t.constraintId === s.constraintId), "blocked trace not linked to the seeded constraintId");
  Object.assign(ctx, { cmd, lesson, constraintId: s.constraintId });
}

async function phaseB() {
  await seed(`unrelated-${N}`, `avoid unrelated-${N}`); // a second constraint must not bleed
  const benign = `echo benign-${N}`;
  const r = await enforceCmd(benign);
  assert(r.decision === "allow", `benign action blocked (cross-talk): ${r.decision}`);
  const allowed = (await tracesFor(`benign-${N}`)).filter((t) => t.decision === "allow");
  assert(allowed.length > 0, "no allowed action-trace persisted for the benign command");
  const d = await enforceCmd(ctx.cmd);
  assert(d.decision === "block" && d.lesson === ctx.lesson, "cross-talk: wrong constraint/lesson fired for the gated command");
}

async function phaseC() {
  const d = await enforceCmd(ctx.cmd);
  assert(d.decision === "block", "retrieval: second attempt not blocked");
  assert(d.lesson === ctx.lesson, "retrieval: lesson not stable across attempts");
}

function phaseD() {
  assert(runHook(ctx.cmd, BASE) === 2, "hook did not relay the server BLOCK for the novel seeded command");
  assert(runHook(`echo ok-${N}`, BASE) === 0, "hook blocked a benign command while the server was reachable");
  assert(runHook(ctx.cmd, "http://127.0.0.1:9") === 0, "hook did not fail open when the endpoint was unreachable");
}

async function phaseE() {
  const cmd = `priv-${N} --go`;
  await seed(`priv-${N}`, `priv-${N} needs review`);
  const r = await enforceCmd(cmd, { decision: "allow", success: true, allow: true });
  assert(r.decision === "block", "self-report bypass: caller-supplied fields overrode the server verdict");
}

// --- run ---------------------------------------------------------------------

async function main() {
  const home = mkdtempSync(join(tmpdir(), "tb-harness-"));
  const port = await freePort();
  BASE = `http://127.0.0.1:${port}`;
  const server = spawn("node", ["dist/index.js"], {
    stdio: ["ignore", "inherit", "inherit"],
    env: {
      ...process.env,
      THOUGHTBOX_STORAGE: "fs",
      THOUGHTBOX_DATA_DIR: join(home, ".thoughtbox"),
      HOME: home,
      PORT: String(port),
    },
  });
  const phases = { A: false, B: false, C: false, D: false, E: false };
  try {
    if (!(await waitForServer())) throw new Error("server did not become ready");
    for (const [k, fn] of [["A", phaseA], ["B", phaseB], ["C", phaseC], ["D", phaseD], ["E", phaseE]]) {
      try { await fn(); phases[k] = true; } catch (e) { log(`${k} failed:`, e.message); }
    }
  } finally {
    server.kill("SIGTERM");
  }
  const pass = Object.values(phases).every(Boolean);
  writeFileSync(RESULT, JSON.stringify({ pass, phases }, null, 2));
  log("result", JSON.stringify({ pass, phases }));
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  writeFileSync(RESULT, JSON.stringify({ pass: false, phases: { A: false, B: false, C: false, D: false, E: false }, fatal: String(e) }, null, 2));
  console.error("[harness] fatal", e);
  process.exit(1);
});
