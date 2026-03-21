---
name: test-suite
description: Run behavioral tests against all Thoughtbox MCP tools in order. Guides you through each test file, tracking pass/fail state. Use when verifying Thoughtbox server functionality after changes, deployments, or as a smoke test.
---

# Thoughtbox Behavioral Test Suite

Run behavioral tests against a live Thoughtbox MCP server, tool by tool, in progressive disclosure order.

## Test Files

Tests are numbered to match the server's progressive disclosure stages:

| # | File | Tool | Stage | Tests |
|---|------|------|-------|-------|
| 01 | `tests/01-init.md` | `thoughtbox_init` | STAGE_0 | 8 |
| 02 | `tests/02-operations.md` | `thoughtbox_operations` | STAGE_0 | 6 |
| 03 | `tests/03-session.md` | `thoughtbox_session` | STAGE_1 | 10 |
| 04 | `tests/04-knowledge.md` | `thoughtbox_knowledge` | STAGE_1 | 12 |
| 05 | `tests/05-thought.md` | `thoughtbox_thought` | STAGE_2 | 14 |
| 06 | `tests/06-notebook.md` | `thoughtbox_notebook` | STAGE_2 | 8 |
| 07 | `tests/07-hub.md` | `thoughtbox_hub` | always-on | 15 |
| 08 | `tests/08-theseus.md` | `thoughtbox_theseus` | STAGE_2 | 8 |
| 09 | `tests/09-ulysses.md` | `thoughtbox_ulysses` | STAGE_2 | 11 |

**Total: 92 tests across 9 tools**

## How to Run

### Step 1: Verify server is running

Check that the Thoughtbox MCP server is connected:
```
Read resource: thoughtbox://init
```
If this fails, the server isn't running. Start it with `pnpm start` or check `.mcp.json`.

### Step 2: Initialize state tracker

Create a state object to track results:

```json
{
  "started": "<timestamp>",
  "currentFile": 1,
  "currentTest": 1,
  "results": {},
  "summary": { "pass": 0, "fail": 0, "skip": 0 }
}
```

### Step 3: Execute tests in order

For each test file (01 through 09):

1. **Read the test file** from `.claude/skills/test-suite/tests/NN-<tool>.md`
2. **Execute each test** by calling the MCP tools as described
3. **Record the result** for each test:
   - `pass` — tool returned expected results
   - `fail` — tool returned unexpected results or errored
   - `skip` — test cannot run (e.g., missing prerequisites)
4. **Report progress** after each file completes:
   ```
   [03/09] thoughtbox_session: 9/10 pass, 1 fail (Test 7: cipher export requires cipher loaded)
   ```

### Step 4: Progressive disclosure gate

Tests are ordered so that earlier tests unlock later stages:

- **01-init** includes `start_new` (unlocks STAGE_1) and `cipher` (unlocks STAGE_2)
- **02-operations** can run at any stage
- **03-04** require STAGE_1 (init must pass first)
- **05-09** require STAGE_2 (cipher must load first)

If init tests fail, stop and report — later tests cannot run.

### Step 5: Final report

After all files complete, produce a summary:

```
Thoughtbox Behavioral Test Suite — Results
==========================================
01-init:        8/8  pass
02-operations:  6/6  pass
03-session:     9/10 pass (1 fail)
04-knowledge:   12/12 pass
05-thought:     14/14 pass
06-notebook:    7/8  pass (1 skip)
07-hub:         15/15 pass
08-theseus:     8/8  pass
09-ulysses:     11/11 pass
------------------------------------------
Total: 90/92 pass, 1 fail, 1 skip

Failed:
- 03-session Test 7: Export cipher format — "cipher not loaded" error

Skipped:
- 06-notebook Test 7: Dependency installation — no network in test env
```

## Important Notes

- Tests are **behavioral**, not unit tests. They call live MCP tools and verify responses.
- Each test is independent within its file, but files must run in order (progressive disclosure).
- The hub tool requires `hubStorage` — if not configured, skip 07-hub entirely.
- Theseus and Ulysses use in-memory handlers if Supabase is not configured — tests still work.
- Some tests create persistent state (sessions, entities). Run against a test data directory if you want isolation.
