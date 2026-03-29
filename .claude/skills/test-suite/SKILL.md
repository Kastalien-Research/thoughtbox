---
name: test-suite
description: Run behavioral smoke tests against the live Thoughtbox Code Mode MCP server. Verifies the public `/mcp` surface (`thoughtbox_search` + `thoughtbox_execute`) plus the main execution paths behind it.
---

# Thoughtbox Code Mode Behavioral Test Suite

Run behavioral tests against a live Thoughtbox MCP server whose public surface is Code Mode.

The authoritative hosted contract is:

- `thoughtbox_search`
- `thoughtbox_execute`

The legacy progressive-disclosure suite (`thoughtbox_init`, `thoughtbox_operations`, raw per-domain tools) is no longer the primary behavioral contract for `/mcp`. Treat the old `01-09` markdown files in this folder as historical reference only unless you are explicitly auditing legacy behavior.

## Test Files

| # | File | Focus | Tests |
|---|------|-------|-------|
| 01 | `tests/01-codemode-surface.md` | Public MCP surface and instructions | 4 |
| 02 | `tests/02-codemode-search.md` | Search catalog discovery | 5 |
| 03 | `tests/03-codemode-thought.md` | Thought workflows: all types, branching, revision, agents | 15 |
| 04 | `tests/04-codemode-sessions.md` | Session CRUD, search, resume, export, analysis | 8 |
| 05 | `tests/05-codemode-knowledge.md` | Knowledge graph: entities, relations, traversal | 5 |
| 06 | `tests/06-codemode-protocols.md` | Theseus, Ulysses, and observability lifecycles | 8 |

**Total: 45 behavioral tests across the 2-tool Code Mode surface**

Every test creates real data in Supabase and verifies it through retrieval. The suite should leave named sessions visible in the web app's Runs view.

## How to Run

### Step 1: Verify the server is running

Confirm the live MCP server is reachable and using the Code Mode surface:

1. Connect to the server.
2. Call `tools/list`.
3. Verify the tool list is exactly:
   - `thoughtbox_search`
   - `thoughtbox_execute`

If raw tools like `thoughtbox_init`, `thoughtbox_session`, or `thoughtbox_hub` appear in `tools/list`, the behavioral suite should fail immediately because the hosted surface is not the intended Code Mode contract.

### Step 2: Initialize a test state tracker

Track results in a state object:

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

For each test file (`01` through `04`):

1. Read the file from `.claude/skills/test-suite/tests/NN-codemode-*.md`
2. Execute each test using the live `thoughtbox_search` and `thoughtbox_execute` tools
3. Record `pass`, `fail`, or `skip`
4. Report progress after each file

Example:

```text
[02/04] thoughtbox_search: 5/5 pass
```

### Step 4: Final report

Produce a concise summary:

```text
Thoughtbox Code Mode Behavioral Suite — Results
==============================================
01-codemode-surface:                  4/4 pass
02-codemode-search:                   5/5 pass
03-codemode-execute:                  6/6 pass
04-codemode-protocols-observability:  5/5 pass
----------------------------------------------
Total: 20/20 pass
```

If anything fails, list the exact test and the observed discrepancy.

## Verification Discipline

**A test is not PASS unless the response proves the claim.**

### Rule 1: Verify the public surface, not internal implementation details

The first check is always `tools/list`. The hosted contract is the public surface. Internal handlers or historical resources do not count as proof.

### Rule 2: Search tests must prove discovery fidelity

When `thoughtbox_search` returns a module, operation, prompt, resource, or resource template, verify the returned names/URIs/descriptions match the intended query. "It returned something relevant" is not enough.

### Rule 3: Execute tests must prove real behavior

For `thoughtbox_execute`, verify both:

- the returned value
- the side effect or follow-up state when applicable

Examples:

- After `tb.thought(...)`, verify the resulting session is visible through `tb.session.list()` or `tb.session.get(...)`
- After a protocol `init`, verify `status` reports the active session
- After `console.log(...)`, verify logs were captured

### Rule 4: Legacy namespaces must fail cleanly

If the suite checks `tb.hub` or `tb.init`, the expected result is absence (`undefined`), not graceful fallback behavior.

### Rule 5: Never rationalize mismatches

If the server exposes more than the intended two tools, or if search/execute exposes an out-of-scope namespace for this release, that is a failure against the current Code Mode contract.
