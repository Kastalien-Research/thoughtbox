---
name: assumptions
description: Manage the assumption registry — track, verify, and query assumptions about external dependencies and system behavior. Prevents costly rediscovery of known failures.
argument-hint: <list|add|verify|stale> [args]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, WebSearch, WebFetch
---

Manage assumptions: $ARGUMENTS

## Commands

Parse the first word of $ARGUMENTS to determine the command:

### `list` — Show all tracked assumptions
1. Read all `.assumptions/*.jsonl` files
2. Parse each line as a JSON record
3. Display sorted by confidence (lowest first) or staleness (oldest verification first)
4. Format as a table: ID | Category | Claim | Confidence | Last Verified | Status

### `add` — Register a new assumption
Parse remaining arguments for: `--category`, `--claim`, `--evidence`, `--source`

Create a new assumption record in `.assumptions/registry.jsonl`:

```json
{
  "id": "<category>-<short-slug>",
  "category": "<api|dependency|behavior|environment|tooling>",
  "claim": "<what we assume to be true>",
  "evidence": "<what supports this assumption>",
  "source": "<where this was discovered>",
  "confidence": 0.8,
  "created": "<ISO 8601>",
  "last_verified": "<ISO 8601>",
  "verification_method": "<how to test this>",
  "failure_history": [],
  "status": "active",
  "blast_radius": "<what breaks if this assumption is wrong>"
}
```

### `verify` — Re-verify an assumption
1. Read the assumption record by ID
2. Execute the verification method (may involve web search, API calls, or code checks)
3. Update `last_verified` timestamp and `confidence` score
4. If verification fails, add to `failure_history` and reduce confidence
5. If confidence drops below 0.3, mark status as `suspect` and warn

### `stale` — Show assumptions that need re-verification
1. Read all assumption records
2. Filter to those where `last_verified` is more than 14 days ago
3. Sort by blast_radius (highest first)
4. Display with suggested verification actions

### `seed` — Seed registry from MEMORY.md gotchas
1. Read MEMORY.md
2. Extract entries from "Gotchas", "Known Bugs", and "MCP Knowledge API Gotchas" sections
3. For each entry, create an assumption record with:
   - category: inferred from content (api, dependency, behavior, etc.)
   - claim: the gotcha statement
   - evidence: "Discovered empirically" + date from MEMORY.md
   - confidence: 0.9 (verified by experience)
   - verification_method: suggested test

## Schema

Each assumption record:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique identifier (category-slug format) |
| category | enum | yes | api, dependency, behavior, environment, tooling |
| claim | string | yes | What we assume to be true |
| evidence | string | yes | What supports this claim |
| source | string | yes | Where this was discovered (session, test, docs) |
| confidence | float | yes | 0.0 to 1.0 confidence score |
| created | string | yes | ISO 8601 creation timestamp |
| last_verified | string | yes | ISO 8601 last verification timestamp |
| verification_method | string | no | How to re-test this assumption |
| failure_history | array | no | Past verification failures with timestamps and details |
| status | enum | yes | active, suspect, retired, verified |
| blast_radius | string | no | What breaks if this assumption is wrong |
| dependencies | array | no | Other assumptions this depends on |

## Output

Always end with a summary:

```
## Assumption Registry Status

Total: {N} assumptions
Active: {N} | Suspect: {N} | Retired: {N}
Stale (>14 days): {N}
Highest blast radius unverified: {assumption_id}
```
