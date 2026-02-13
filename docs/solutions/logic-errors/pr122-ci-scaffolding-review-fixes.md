---
title: "PR #122 Review Findings: 11 Bugs Fixed in CI Scaffolding"
date: 2026-02-12
category: logic-errors
tags:
  - ci-scaffolding
  - signal-processing
  - agent-configuration
  - type-safety
  - data-integrity
  - input-validation
  - documentation-drift
severity: P1-P2 Mixed
components:
  - agentops/signals/signal-store.ts
  - agentops/signals/emit-session-signals.mjs
  - scripts/utils/capture-handoff.mjs
  - scripts/utils/spec-index.mjs
  - scripts/agents/run-agent-util.ts
  - scripts/agents/agent-harness.ts
  - scripts/agents/devils-advocate.ts
  - scripts/agents/silent-failure-hunter.ts
  - .claude/agents/assumption-auditor.md
  - .claude/knowledge/agent-scaffolding.md
symptoms:
  - Signal consumption skipped same-millisecond events
  - JSON parsing crashes on unescaped commit subjects
  - SIGNALS_DIR resolved to wrong path when invoked from different directory
  - spec-index crashes with ENOENT on fresh clones
  - Documentation schema mismatches with actual registry.jsonl
  - Agent inventory listed incorrect models
  - Budget parameter silently becomes NaN
  - Agent models hardcoded instead of frontmatter-driven
root_cause: "Combination of: insufficient boundary testing, unsafe JSON serialization, module-load-time path resolution, missing defensive checks, documentation drift from implementation, input validation gaps"
solution_type: "Mixed (4 logic fixes, 3 schema corrections, 3 config standardization)"
verified: true
related_issues:
  - "PR #122"
  - "feat/ci-scaffolding branch"
---

# PR #122 Review Findings: 11 Bugs Fixed in CI Scaffolding

## Problem Statement

PR #122 (`feat(ci): add continual improvement system scaffolding`) received 11 review comments from 3 automated reviewers (augmentcode, chatgpt-codex, greptile). All were legitimate findings across three severity tiers:

**P1 (Critical - Data Loss & Crashes):**
- Signal timestamp cursor skipped same-millisecond signals permanently
- Unescaped git commit subjects crashed JSON.parse()
- SIGNALS_DIR resolved from wrong root directory
- spec-index.mjs crashed with ENOENT on fresh clones

**P2 (Documentation & Validation Gaps):**
- assumption-auditor.md documented wrong field names vs actual registry.jsonl
- agent-scaffolding.md listed wrong models for 4 of 6 CI agents
- Budget parameter silently forwarded NaN to the SDK

**P3 (Code Consistency):**
- devils-advocate.ts and silent-failure-hunter.ts hardcoded model strings instead of reading frontmatter

## Root Cause Analysis

**Silent Data Loss (Signal Cursor):** The cursor logic treated positions as simple timestamps and filtered with strict `>`. When multiple signals shared the same millisecond timestamp, all but the first were permanently skipped on the next consumption pass. The root cause was conflating position tracking with duplicate prevention.

**JSON Parsing Crashes:** Git log output was wrapped in JSON format using escaped quotes at the shell level. Commit messages containing `"`, `\`, or control characters broke the escaping, producing invalid JSON.

**Wrong SIGNALS_DIR Root:** The path was resolved at module load time using `process.cwd()`, which captures the shell's working directory at import time, not the `--project-root` CLI argument parsed later at runtime.

**Missing Directory Guard:** No existence check before `fs.readdir()` on a directory that may not exist in fresh clones or CI environments.

**Documentation Drift:** Schema fields and model assignments were manual copies that drifted from actual implementations as the codebase evolved without automated consistency checks.

**Budget NaN:** `Number()` on non-numeric strings silently returns NaN, which passes `typeof === 'number'` checks but corrupts downstream math.

**Model String Duplication:** Three files each hardcoded model strings independently, creating maintenance points that diverged from the canonical frontmatter source.

## Solution

### Fix 1: Signal Timestamp Cursor (P1)

Introduced a `CursorValue` type that tracks both the temporal position and IDs already consumed at the boundary timestamp. Backward-compatible with old plain-string index format.

```typescript
// New cursor type - stores position + consumed IDs at boundary
type CursorValue = string | { cursor: string; excludeIds: string[] };

function parseCursor(value: CursorValue): { cursor: string; excludeIds: Set<string> } {
  if (typeof value === "string") return { cursor: value, excludeIds: new Set() };
  return { cursor: value.cursor, excludeIds: new Set(value.excludeIds) };
}

function signalPassesCursor(signal: Signal, cursorValue: CursorValue): boolean {
  const { cursor, excludeIds } = parseCursor(cursorValue);
  if (signal.timestamp > cursor) return true;
  if (signal.timestamp === cursor && !excludeIds.has(signal.id)) return true;
  return false;
}

// After consumption, save boundary IDs:
const lastTs = limited[limited.length - 1].timestamp;
const idsAtBoundary = limited.filter((s) => s.timestamp === lastTs).map((s) => s.id);
index[consumer] = { cursor: lastTs, excludeIds: idsAtBoundary };
```

### Fix 2: Unescaped Commit Subjects (P1)

Replaced JSON template string with null-byte delimited format. Null bytes cannot appear in git output, making this binary-safe.

```javascript
// Before: crashes on commits with quotes or backslashes
const raw = await run('git log -1 --format="{\\"sha\\":\\"%H\\",\\"message\\":\\"%s\\"}"');
const commit = JSON.parse(raw);

// After: null-byte delimited, safe for any commit message
const raw = await run('git log -1 --format="%H%x00%s%x00%cI"');
const commit = raw
  ? (() => { const [sha, message, timestamp] = raw.split("\0"); return { sha, message, timestamp }; })()
  : null;
```

### Fix 3: SIGNALS_DIR Wrong Root (P1)

Moved path resolution from module scope into `main()`, derived from the `--project-root` argument. Updated `dayPath()` to accept the directory as a parameter.

```javascript
// Before: frozen at import time
const SIGNALS_DIR = path.resolve(process.cwd(), "agentops", "signals");
function dayPath(date = new Date()) { return path.join(SIGNALS_DIR, ...); }

// After: resolved at runtime from CLI argument
async function main() {
  const projectRoot = argValue("--project-root") ?? process.cwd();
  const signalsDir = path.resolve(projectRoot, "agentops", "signals");
  // ...
  await fs.appendFile(dayPath(signalsDir), ...);
}
function dayPath(signalsDir, date = new Date()) { return path.join(signalsDir, ...); }
```

### Fix 4: spec-index ENOENT Guard (P1)

Added `fs.access()` check with graceful exit before `fs.readdir()`.

```javascript
try {
  await fs.access(SPECS_DIR);
} catch {
  process.stdout.write(`No specs directory found at ${SPECS_DIR} — skipping.\n`);
  return;
}
const entries = await fs.readdir(SPECS_DIR, { withFileTypes: true });
```

### Fix 5-6: Documentation Alignment (P2)

**assumption-auditor.md:** Updated field references to match actual `.assumptions/registry.jsonl` schema:

| Documented (wrong) | Actual (correct) |
|---|---|
| `assumption` | `claim` |
| `criticality: HIGH\|MEDIUM\|LOW` | `confidence: 0.0-1.0` |
| `verification_evidence` | `verification_method` |
| `status: verified\|failed\|stale` | `status: active\|suspect` |

Added missing fields: `evidence`, `created`, `failure_history`, `blast_radius`.

**agent-scaffolding.md:** Corrected model inventory for 4 agents:

| Agent | Was | Actually |
|---|---|---|
| hook-health | haiku | sonnet |
| assumption-auditor | haiku | sonnet |
| regression-sentinel | haiku | sonnet |
| silent-failure-hunter | opus | sonnet |

### Fix 7: Budget NaN Validation (P2)

Added validation in all 4 files that accept `--budget`:

```typescript
const budget = budgetRaw ? Number(budgetRaw) : undefined;
if (budget !== undefined && isNaN(budget)) {
  console.error("Error: --budget must be a number");
  process.exit(1);
}
```

### Fix 8-10: Frontmatter Model Consistency (P3)

Exported `parseFrontmatter()` from `run-agent-util.ts` and imported it in `devils-advocate.ts` and `silent-failure-hunter.ts`. Replaced hardcoded model strings with `fm.model` from parsed frontmatter.

```typescript
// run-agent-util.ts — now exported
export function parseFrontmatter(raw: string): { fm: ParsedFrontmatter; body: string } { ... }

// devils-advocate.ts, silent-failure-hunter.ts — import and use
import { parseFrontmatter } from "./run-agent-util.js";
const { fm, body } = parseFrontmatter(raw);
// ...
model: fm.model,  // was: "claude-opus-4-6" or "claude-sonnet-4-5-20250929"
```

## Commits

| Commit | Fixes | Files |
|--------|-------|-------|
| `fix(signals): resolve timestamp cursor and path resolution bugs` | 1, 3 | signal-store.ts, emit-session-signals.mjs |
| `fix(scripts): escape commit subjects and guard missing directories` | 2, 4 | capture-handoff.mjs, spec-index.mjs |
| `docs(agents): align assumption-auditor schema and model inventory` | 5, 6 | assumption-auditor.md, agent-scaffolding.md |
| `fix(scripts): validate budget parsing and use frontmatter models` | 7-10 | run-agent-util.ts, agent-harness.ts, devils-advocate.ts, silent-failure-hunter.ts |

## Verification

- `npx tsc --noEmit` passes clean
- `node scripts/utils/capture-handoff.mjs` parses commits with special characters
- `node scripts/utils/spec-index.mjs` handles existing/missing directories gracefully
- assumption-auditor.md schema verified against first 5 records in registry.jsonl
- agent-scaffolding.md models verified against all 6 agent frontmatter files

## Prevention Strategies

### 1. Cursor/Pagination Boundaries

Never use bare `>` for cursor-based consumption. Track both position and identity at the boundary. Test with:
- Multiple items sharing the same timestamp
- Cursor pointing at first, middle, and last items
- Empty result sets at boundaries

### 2. Shell Output into Structured Formats

Never interpolate untrusted strings into JSON templates. Use binary-safe delimiters (`%x00`) or construct objects programmatically after splitting. Test with commit messages containing `"`, `\`, newlines, and Unicode.

### 3. Module-Scope Path Resolution

Defer all path resolution to function scope when CLI arguments are involved. `process.cwd()` captures import-time state, not runtime intent. Pass resolved paths as parameters.

### 4. Filesystem Guards

Always check existence before `readdir()` on directories that may not exist (generated artifacts, optional configs, CI environments). Use `fs.access()` and provide informative messages on absence.

### 5. Documentation-Code Consistency

Treat documentation field names and enum values as testable assertions. When schema fields or configuration values change, automated auditing should catch drift. The assumption-auditor agent exists for this purpose.

### 6. Input Validation at Boundaries

Always validate after `Number()` conversion. `isNaN()` checks are cheap and prevent silent corruption. Validate at system boundaries (CLI args, environment variables, file input).

### 7. Single Source of Truth

Extract shared utilities (`parseFrontmatter()`) rather than duplicating logic. When the same value appears in 2+ places, one should be the source and others should import from it.

## Related Documentation

- [Signals README](../../agentops/signals/README.md) — Signal store architecture, JSONL structure, consumer cursors
- [ADR-001: System Overview](../../docs/ADR/001-System-Overview.md) — Gateway pattern, storage layer abstraction
- [ADR-003: Observability](../../docs/ADR/003-Observability.md) — Observatory, event emission
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Commit conventions, testing practices
- [Knowledge Graph Session Extraction](../integration-issues/knowledge-graph-session-extraction-workflow.md) — Related JSONL + cursor patterns

## Patterns Identified

| Pattern | Category | Applies To |
|---------|----------|------------|
| Timestamp cursor with ID tracking | Exact-once delivery | Any event source with millisecond timestamps |
| Null-byte delimited shell parsing | Safe serialization | Any subprocess output embedded in structured data |
| Runtime path resolution | Configuration safety | Any CLI tool with path arguments |
| Existence guards before readdir | Defensive filesystem | Optional/generated directories |
| Schema field validation against source | Documentation currency | Any config-based system with external docs |
| Post-conversion NaN checks | Input validation | Any numeric CLI parameter |
| Shared frontmatter parser | DRY configuration | Any multi-file agent system |
