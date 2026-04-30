# Thoughtbox Systemic Flaws Audit

**Date:** 2026-04-28
**Scope:** Triggered by an investigation into the `ThoughtType` definition; expanded into a broader audit after the original bug shape proved to be a project-wide pattern.
**Method:** Static code reading + git archaeology + 5 sub-agent surveys (`devils-advocate`, `silent-failure-hunter` × 2, `Explore`, `dependency-verifier`) + read-only queries against the production Supabase database.
**Production database:** Supabase project `Thoughtbox` (created 2026-03-13).

---

## TL;DR

1. The `ThoughtType` discriminated union is implemented as **flat optional fields with a positive-only runtime validator**. The runtime checks "type X requires payload X" but never "type X forbids payload Y". Wrong payloads ride along, get persisted to JSONB, and silently roundtrip. **14 corrupted thought rows currently in production (0.23% of 5,971 thoughts).**
2. **This is not a one-off bug. It is a project-wide architectural pattern**, codified in 8 MCP tools per the comment at `src/hub/hub-tool-schema.ts:3`: *"Follows the same pattern as thoughtbox_init, thoughtbox_session, etc.: operation enum + all per-operation fields as optional top-level params."*
3. Every MCP subsystem has **4 hand-maintained representations** of the same operations (Zod schema + handler dispatcher + operation catalog + SDK type string). 12 catalogs across 11 files = **48 potential mirror-pair drift surfaces** with no codegen or CI check.
4. Originally hypothesized to have "survived thousands of reviews"; archaeology shows it was **authored in a 6-day window in March 2026 by one author across three overlapping refactors with a destructive bot incident in the middle**, then frozen by a Code Mode rewrite that captured the divergence in amber.
5. Several **secondary findings** ranging from theoretical (Hub `TRUNCATE` granted to `anon`) to actively wrong (70% of `otel_events` lack `model` attribute, producing a giant `unknown` bucket in the cost dashboard).
6. **Tenant isolation in the knowledge graph is currently in place** (RLS + app-layer filtering + FK constraints — defense in depth). A 2-day historical RLS gap exists in the migration sequence (March 20 → 22) but is **empirically harmless** because zero KG entities existed before the backfill date.

---

## Background: What Thoughtbox Is

Thoughtbox is an MCP (Model Context Protocol) server that gives AI agents structured tools for recording reasoning. An agent calls `tb.thought({...})` with a typed payload and the server persists it to a `thoughts` table along with session, branch, and revision metadata. There are 7 (or 8 — see below) `thoughtType` discriminator values, each with its own structured payload (e.g., `decision_frame` carries `options[]`, `belief_snapshot` carries `beliefs`, `action_report` carries `actionResult`).

The server runs on Google Cloud Run. Persistence is Supabase (Postgres). The codebase is a monorepo containing the server, a web UI, the Code Mode SDK, the multi-agent hub, and various protocol implementations (Theseus for refactoring, Ulysses for surprise-gated debugging, etc.).

A second access pattern, **Code Mode**, exposes a smaller MCP surface (`thoughtbox_search` + `thoughtbox_execute`) that lets agents write JavaScript code that calls Thoughtbox operations programmatically. Code Mode generates LLM-facing TypeScript types from a hand-maintained string template (`TB_SDK_TYPES` in `src/code-mode/sdk-types.ts`). This file is one of the four representations of every operation.

---

## The Triggering Observation

Initial reconnaissance for an unrelated task found that the `ThoughtType` enum is declared in **6 places** across the codebase, with a **7-vs-8 split**:

**7 types** (omitting `action_receipt`):
- `src/thought/tool.ts:75-78` — Zod input schema
- `src/code-mode/sdk-types.ts:21` — hand-maintained TypeScript-as-text template

**8 types** (including `action_receipt`):
- `src/persistence/types.ts:129` — `ThoughtData` interface
- `src/thought-handler.ts:40` — **second `ThoughtData` interface (parallel definition)**
- `src/observatory/schemas/thought.ts:48` — Zod schema
- `src/audit/manifest-generator.ts:62-73` — const array

**At the database layer:**
- Original migration `supabase/migrations/20260320191032_remote_schema.sql:531` — CHECK constraint with 7 types
- Follow-up migration `supabase/migrations/20260323020000_add_action_receipt_thoughttype.sql:5-11` — expanded CHECK constraint to 8 types

**Net:** the database accepts `action_receipt`. The persistence interface accepts it. The audit aggregator counts it. The observatory schema validates it. But the **public-facing Zod schema rejects it**. So `action_receipt` is structurally unsubmittable through `tb.thought()`. Empirical confirmation: **0 rows of type `action_receipt` exist in the production `thoughts` table.**

Two `ThoughtData` interfaces exist in parallel:
- `src/persistence/types.ts:115-185` — `thoughtNumber` and `thoughtType` REQUIRED
- `src/thought-handler.ts:19-53` — `thoughtNumber` and `thoughtType` OPTIONAL

---

## The Original Bug: Discriminated Union as Positive-Only Validator

### What the code claims to enforce

Each `thoughtType` value has a corresponding payload field (`decision_frame` → `options`, `belief_snapshot` → `beliefs`, etc.). The intent is a discriminated union: each variant has its required payload, and other variants' payloads are forbidden.

### What the code actually enforces

The Zod schema in `src/thought/tool.ts:50-91` declares **all payload fields as independent optionals**:

```ts
export const thoughtToolInputSchema = z.object({
  thought: z.string(),
  thoughtType: z.enum([
    "reasoning", "decision_frame", "action_report",
    "belief_snapshot", "assumption_update", "context_snapshot", "progress"
  ]),
  // ... base fields ...

  // Type discriminators & Metadata — all independently optional
  confidence: z.enum(["high", "medium", "low"]).optional(),
  options: z.array(OptionSchema).optional(),
  actionResult: ActionResultSchema.optional(),
  beliefs: BeliefSchema.optional(),
  assumptionChange: AssumptionChangeSchema.optional(),
  contextData: ContextDataSchema.optional(),
  progressData: ProgressDataSchema.optional(),
});
```

Zod validates each field in isolation. There is no `z.discriminatedUnion(...)`. There is no `.refine(...)` for cross-field rules. **`thoughtType: "reasoning"` with `beliefs: {entities: [...]}` populated validates clean.**

The runtime validator at `src/thought-handler.ts:431-466` does a switch on `thoughtType`:

```ts
private validateStructuredFields(thoughtType, data): void {
  switch (thoughtType) {
    case 'reasoning': break;                              // no payload required
    case 'decision_frame': this.validateDecisionFrame(data);
    case 'action_report':  this.validateActionReport(data);
    case 'belief_snapshot': this.validateBeliefSnapshot(data);
    // ... etc
  }
}

private validateDecisionFrame(data): void {
  if (!data.confidence || !valid.includes(data.confidence))
    throw "decision_frame requires confidence (...)";
  if (!data.options || data.options.length === 0)
    throw "decision_frame requires options (...)";
  if (selectedCount !== 1)
    throw "decision_frame options must have exactly one selected: true";
}
```

Each `validateX` function asserts the **positive case**: "type X requires payload X is present and well-formed". **None of them assert the negative case**: "type X forbids payload Y". So:

| Submission | Validator response |
|---|---|
| `decision_frame` + missing `options` | **REJECTED** |
| `decision_frame` + missing `confidence` | **REJECTED** |
| `reasoning` + populated `options: [...]` | **ACCEPTED** ✅ |
| `belief_snapshot` + populated `actionResult: {...}` | **ACCEPTED** ✅ |
| `decision_frame` + populated `options` AND `beliefs` AND `actionResult` | **ACCEPTED** ✅ |

### And the foreign payload gets persisted

After validation passes, the code at `src/thought-handler.ts:412-420` copies **every** payload field off the input regardless of `thoughtType`:

```ts
return {
  // ...
  thoughtType,
  confidence: data.confidence as ...,
  options: data.options as ...,
  actionResult: data.actionResult as ...,
  beliefs: data.beliefs as ...,
  assumptionChange: data.assumptionChange as ...,
  contextData: data.contextData as ...,
  progressData: data.progressData as ...,
  receiptData: data.receiptData as ...,
  // ...
};
```

The persistence layer at `src/persistence/supabase-storage.ts:227-228` writes **without checking `thoughtType`**:

```ts
beliefs: thought.beliefs ?? null,
assumption_change: thought.assumptionChange ?? null,
```

So a `reasoning` thought submitted with stray `beliefs` lands in the `thoughts` table with `thought_type = 'reasoning'` and `beliefs = {...}` populated. Reads via `supabase-storage.ts:196-197` reattach it. The observatory display layer renders whatever's there. No layer ever notices the mismatch.

### Why this isn't caught at any layer

| Layer | Why it doesn't catch this |
|---|---|
| TypeScript | Type is `{thoughtType?: ..., options?: ..., beliefs?: ...}` — flat optionals. Every combination is well-typed. No discriminated union exists for the type checker to enforce. |
| Zod | Schema is flat optionals. No `discriminatedUnion`, no `.refine` for cross-field rules. |
| Runtime validator | Positive checks only. "X requires Y" but never "X forbids Z". |
| Persistence | JSONB columns, permissive by design. |
| Tests | Negative cases not exercised. Nobody wrote "submitting `reasoning` with `beliefs` populated should be rejected". |
| Code review | Each `validateX` reads as competent at the function level. Systemic flaw is invisible at single-PR scope. |

---

## How It Happened (Git Archaeology)

The chaos is not the residue of years of drift. It is the residue of **one author moving fast across three overlapping refactors in a 6-day window in March 2026**, with a destructive bot incident in the middle.

### Phase 1 — March 2 — `fb8e478` "AUDIT-001 structured fields — discriminated union on ThoughtData"
Added the six structured-field payloads (`options`, `actionResult`, `beliefs`, `assumptionChange`, `contextData`, `progressData`) as **flat optional siblings** on `ThoughtData`. The discriminated union was implemented as imperative `validateStructuredFields(thoughtType, data)` switch in the handler — never as a `z.discriminatedUnion(...)`. **Original sin: the runtime enforces the union, the type never did.** Every later layer copied the flat-optional shape because that's what the handler exposed.

This commit is also where `assumptionChange.oldStatus: string` was authored alongside `newStatus: enum`. The asymmetry isn't a migration shim — it was sloppy at birth.

### Phase 2 — March 17 — `c221f42` "implement supabase storage and refactor gateway"
The Supabase-storage refactor needed a `ThoughtData` it could import without circular-dep-ing on `thought-handler.ts`. The author **cloned the interface into `src/persistence/types.ts`** instead of extracting it to a shared module. Same author, same week. The clone made `thoughtNumber` and `thoughtType` *required* (storage layer assumes normalized data) while the handler kept them optional (handler accepts wire input).

Same commit also created the Zod schema in `src/thought/tool.ts`, mirroring the 7-type list from the handler.

### Phase 3 — March 18 — `9dd353c` reverted by `ba3dec9` (~1 hour later)
`google-labs-jules[bot]` deleted ~16k lines (entire `src/thought/tool.ts`, `src/init/`, `src/notebook/`, `src/sessions/`, all auth, ADRs, migrations) while ostensibly updating one spec. Restored via wholesale `git checkout` of `c221f42`'s tree. **The restore cemented the duplication** — nobody took the chance to consolidate, because everyone was now gun-shy about touching the restored tree.

### Phase 4 — March 22, 23:02 — `5dca8e6` "feat(types): add action_receipt thoughtType"
Added `action_receipt` to **5 of the 7 places** that needed it: `persistence/types.ts`, `thought-handler.ts`, `observatory/schemas/thought.ts`, `audit/manifest-generator.ts`, and a new migration. **Missed `src/thought/tool.ts`** (the public Zod schema). No ADR or spec exists for `action_receipt`; `git log -S"action_receipt" -- src/thought/tool.ts` returns empty to this day.

### Phase 5 — March 23, 12:34 — `c0037f0` "feat!: replace 9 MCP tools with Code Mode"
~13.5 hours after `action_receipt` landed, Code Mode shipped. It created `src/code-mode/sdk-types.ts` as a hand-written template-string copy of every Zod schema, with a header comment saying "this file must stay in sync with the source Zod schemas." **It snapshotted the still-stale 7-type list** — and there's no automation enforcing the sync. The drift froze in amber.

### The throughline

- One author. 6 days. Three big refactors (Supabase storage, action_receipt, Code Mode) overlapping. One destructive bot incident wedged in the middle.
- No discriminated union ever made it into Zod because the runtime validator already "worked" — so nobody noticed the type system was lying.
- No `ThoughtData` consolidation happened because the storage/handler split *looked* deliberate.
- The Code Mode SDK string was authored as hand-maintained TypeScript-as-text. There is no codegen.
- Every PR since has touched these files additively without revisiting the framework.

---

## Production Data Audit (Live DB, Read-Only Queries)

Connected to the production Supabase database via psql with `default_transaction_read_only=on`.

### Scale

| Table | Rows |
|---|---|
| `workspaces` | 16 |
| `workspace_memberships` | 12 |
| `profiles` | 12 |
| `sessions` | 237 |
| `thoughts` | 5,971 |
| `entities` (KG) | 313 |
| `relations` (KG) | 248 |
| `observations` (KG) | 106 |

Of 16 workspaces, only **2 have meaningful usage**. A third and fourth have a single thought each (likely test workspaces). The other 12 are empty.

### Mismatched-payload thoughts (the core silent-corruption question)

Query counts each `thought_type` along with rows where the wrong payload columns are non-null:

```sql
SELECT
  thought_type,
  count(*) AS rows,
  count(*) FILTER (WHERE thought_type != 'decision_frame'    AND options          IS NOT NULL) AS bad_options,
  count(*) FILTER (WHERE thought_type != 'action_report'     AND action_result    IS NOT NULL) AS bad_action_result,
  count(*) FILTER (WHERE thought_type != 'belief_snapshot'   AND beliefs          IS NOT NULL) AS bad_beliefs,
  count(*) FILTER (WHERE thought_type != 'assumption_update' AND assumption_change IS NOT NULL) AS bad_assumption,
  count(*) FILTER (WHERE thought_type != 'context_snapshot'  AND context_data     IS NOT NULL) AS bad_context,
  count(*) FILTER (WHERE thought_type != 'progress'          AND progress_data    IS NOT NULL) AS bad_progress,
  count(*) FILTER (WHERE thought_type != 'action_receipt'    AND receipt_data     IS NOT NULL) AS bad_receipt
FROM thoughts
GROUP BY thought_type
ORDER BY rows DESC;
```

Results:

| thought_type | rows | bad_options | bad_action_result | bad_beliefs | bad_assumption | bad_context | bad_progress | bad_receipt |
|---|---|---|---|---|---|---|---|---|
| `reasoning` | 5,127 | 0 | 0 | **8** | 0 | **2** | **2** | 0 |
| `decision_frame` | 213 | 0 | 0 | **2** | 0 | 0 | 0 | 0 |
| `belief_snapshot` | 195 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `assumption_update` | 126 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `progress` | 117 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `action_report` | 102 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `context_snapshot` | 91 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**Total: 14 corrupted rows out of 5,971 thoughts (0.23%).**

### `action_receipt` thoughts in production
**Zero rows.** The type is structurally unsubmittable via `tb.thought()` because the input Zod schema doesn't list it.

### Knowledge graph workspace distribution
Only 2 of 16 workspaces have any KG entities. **All 313 entities were created on or after the March 22 backfill date** — meaning the historical RLS gap (March 20 → 22) is empirically harmless. The `LIMIT 1` backfill collapse never had data to collapse.

### `protocol_sessions.workspace_id` validity (this column is `text` not `uuid`)
- 80 total rows
- 4 valid UUIDs
- 51 NULL
- **25 non-UUID strings** — actual production rows where `workspace_id` is some other text value. The `is_workspace_member()` function relies on text-to-uuid coercion which can throw at runtime.

### OAuth token volumes
- `oauth_authorization_codes`: 1 row, 1 distinct workspace_id
- `oauth_refresh_tokens`: 1 row, 1 distinct workspace_id

The storage code at `src/auth/oauth/token-storage.ts:90,106` filters only by `code`/`token_hash` — workspace_id check is missing — but at this scale there's no collision risk yet.

### FK orphans (workspace_id pointing to non-existent workspace)
**Zero on every table.** FK constraints are doing their job.

### `thoughts.critique` populated
**0 of 5,971 rows.** The permissive write path at `src/persistence/supabase-storage.ts:546-557` exists but has never been used.

### `protocol_sessions.state_json` shape consistency
- 32 Theseus sessions: all have `B` field, none have `S` field, none are empty
- 48 Ulysses sessions: all have `S` field, none have `B` field, none are empty
- **Zero cross-protocol shape contamination.** The unsafe `as { B: number }` cast at `src/protocol/in-memory-handler.ts:224` is latent — only fires if cross-protocol routing ever breaks.

### `otel_events` model attribute coverage
- ~82,000 total events
- ~25,000 with `model` populated (claude-opus-4-7, claude-opus-4-6, claude-haiku-4-5, etc.)
- **57,735 (~70%) with no `model` attribute**

The cost aggregation code at `src/otel/otel-storage.ts:233` has a fallback: `const model = typeof attrs.model === 'string' ? attrs.model : 'unknown';`. So missing-model events bucket to a labeled `unknown` row in the cost dashboard — not a silent phantom bucket. **The cost dashboard isn't lying — it has an honest "unknown" bucket containing 70% of events.** Whether the parser is failing to extract `model` for spans that should have one is a separate investigation.

---

## Five-Agent Systemic Audit

Five independent audits dispatched in parallel after the initial bug was characterized.

### Audit 1: RLS Coverage Gaps (`devils-advocate`)

Walked every table in `supabase/migrations/`. Findings:

**Per-table RLS coverage:**

| Table | Tenant column | RLS on? | Active policy | App-layer filter | Status |
|---|---|---|---|---|---|
| `workspaces` | (self) `owner_user_id` | yes | `workspaces_*` member/owner | n/a | ISOLATED |
| `workspace_memberships` | `user_id` | yes | `memberships_select_own` (SELECT only) | n/a | RLS_ONLY |
| `profiles` | `user_id` | yes | `profiles_own` | n/a | ISOLATED |
| `api_keys` | `workspace_id` | yes | `api_keys_member_access` + service_role | yes | ISOLATED |
| `sessions` | `workspace_id` | yes | `sessions_member_access` + service_role | yes | ISOLATED |
| `thoughts` | `workspace_id` | yes | `thoughts_member_access` + service_role | yes | ISOLATED |
| `entities` | `workspace_id` (added 03-22) | yes | `workspace_member_access` (added 03-22) | yes | ISOLATED (post-gap) |
| `relations` | `workspace_id` (added 03-22) | yes | `workspace_member_access` (added 03-22) | yes | ISOLATED (post-gap) |
| `observations` | `workspace_id` (added 03-22) | yes | `workspace_member_access` (added 03-22) | yes | ISOLATED (post-gap) |
| `protocol_sessions` | `workspace_id` **TEXT** | yes | `service_role_all` only | yes | RLS_ONLY (no authenticated policy; type mismatch) |
| `protocol_audits/history/scope/visas` | none | yes | `service_role_all` only | no | NO_TENANT (questionable) |
| `otel_events` | `workspace_id` | yes | `workspace_member_read` + service_role | yes | ISOLATED |
| `runs` | `workspace_id` | yes | `workspace_member_read_runs` + service_role | yes | ISOLATED |
| `oauth_clients` | none (global) | yes | none beyond ENABLE | n/a | NO_TENANT |
| `oauth_authorization_codes` | `workspace_id` NOT NULL | yes | **none** (only ENABLE RLS) | **no** | RLS_ONLY (defense-in-depth missing in app) |
| `oauth_refresh_tokens` | `workspace_id` NOT NULL | yes | **none** (only ENABLE RLS) | **no** | RLS_ONLY (defense-in-depth missing in app) |
| `branches` | `workspace_id` NOT NULL | yes | `service_role_full_access` only | none in code | RLS_ONLY |
| `hub_events/tasks/workers` | `workspace_id` | yes | `tenant_member_read` (SELECT) + service_role | not directly checked | RLS_ONLY (+ grant mismatch) |

**Key findings:**

1. **The KG triplet (entities/relations/observations) is the only set of tables with the historical RLS gap shape.** The drop migration (`20260320200448_drop_project_columns.sql`) removed `project_isolation` before the columns existed; the add migration (`20260322153858_add_workspace_id_to_knowledge_tables.sql`) brought back both columns and policies 2 days later, with a backfill that assigned all pre-existing rows to one arbitrary workspace via `(SELECT id FROM workspaces LIMIT 1)`. **Empirically harmless** because no entities existed in that window.

2. **`protocol_sessions.workspace_id` is `TEXT`, not `UUID`** (`20260320191032_remote_schema.sql:467`). Cannot be used by `is_workspace_member(uuid)`, no FK to `workspaces.id`, silently accepts arbitrary strings. The function in `20260320202228:17` does `workspace_id = ws_id` against a `uuid` argument — relies on implicit text/uuid coercion, which can throw at runtime if the text isn't a valid UUID. **25 of 80 rows in production are non-UUID strings.**

3. **OAuth token lookups bypass workspace check** (`src/auth/oauth/token-storage.ts:90,106,150,172`). Both `oauth_authorization_codes` and `oauth_refresh_tokens` have `workspace_id NOT NULL` but the storage layer filters only by `code`/`token_hash`/`client_id`. There is no RLS policy on these tables either (only `ENABLE RLS`), so service_role bypass is the only gate. A token-hash collision or leaked code value is workspace-blind.

4. **`hub_events`/`hub_tasks`/`hub_workers` grant write privileges to `anon` with no write policy** (`20260409232440_remote_schema.sql:89-213`). `GRANT insert/update/delete/truncate` to `anon` and `authenticated`, but only `tenant_member_read` (SELECT) policy exists. RLS denies these writes (failsafe), but the `GRANT TRUNCATE TO anon` is a footgun — if anyone later adds a permissive ALL policy, anon can truncate.

5. **`protocol_audits/history/scope/visas` have no tenant column at all** (`20260320191032_remote_schema.sql:425-494`). Scoped only via `session_id` → `protocol_sessions`. RLS is service-role-only, so authenticated users can't reach them — but a service_role bug that forgets the join chain leaks across workspaces with zero database-level guardrail.

### Audit 2: Other Discriminated Unions Implemented as Flat Optionals (`silent-failure-hunter`)

**The bug class is project-wide.** Per the comment at the top of `src/hub/hub-tool-schema.ts:3-6`: *"Follows the same pattern as thoughtbox_init, thoughtbox_session, etc.: operation enum + all per-operation fields as optional top-level params."*

Confirmed instances:

1. **Observatory `ThoughtSchema` (`src/observatory/schemas/thought.ts:48-64`)** — mirrors the production bug shape on the *read* side. Used for WebSocket emission of `thought:added` events. Corrupted thoughts already in the database flow through to observatory clients with no rejection. The display layer renders whatever's there. Detection time: never.

2. **Hub tool (`src/hub/hub-tool-schema.ts:26-113` + `src/hub/hub-handler.ts:163-321`)** — `operation` is a discriminator over **28 operations**, all with flat optional sibling params. Every dispatch site uses `(args as any)` casts. Wrong-operation+wrong-payload combinations either silently drop fields (e.g., `post_message` ignores `verdict`/`reasoning`) or throw deep manager errors with no schema context.

3. **Knowledge tool (`src/knowledge/tool.ts:6-9, 20`)** — `relation_type` is a discriminator over 9 relation types (`BUILDS_ON`, `CONTRADICTS`, etc.). The `properties: z.record(z.any()).optional()` field accepts any shape for any relation type. A `CONTRADICTS` relation with `properties: { buildsDependency: true }` (semantically a `DEPENDS_ON` field) validates and persists.

4. **Theseus and Ulysses (`src/protocol/theseus-tool.ts:152`, `src/protocol/ulysses-tool.ts:214`)** — `bridgeThought()` writes thoughts with `thoughtType: 'decision_frame'` but constructs only a content string with no `options` payload. `validateDecisionFrame` throws because options is missing. The surrounding `catch {}` blocks at line 164 (theseus) and 228 (ulysses) **swallow the error silently**. **Protocol bridge thoughts are silently dropped from the audit chain with no log.**

### Audit 3: Permissive JSONB Columns (`silent-failure-hunter`)

Walked every JSONB column in the schema. Findings beyond the known thought payload issue:

1. **`otel_events.event_attrs`** — written from raw protobuf at `src/otel/parser.ts:72,116`, read with direct cast at `src/otel/otel-storage.ts:232`, drives cost aggregation. Per the empirical query above, 70% of events have no `model` attribute. The fallback at line 233 buckets them as `'unknown'` (honest, not silent corruption).

2. **`protocol_sessions.state_json`** — Theseus and Ulysses share this table. The reader at `src/protocol/in-memory-handler.ts:224` does `session.state_json as { B: number }` with no validation. Live data shows the shapes are correctly distinct today (Theseus has B-only, Ulysses has S-only, no contamination), but the unsafe cast is a latent footgun.

3. **`thoughts.critique`** — separate write path `updateCritique` at `src/persistence/supabase-storage.ts:546-557` bypasses the main thought-handler validation gate. Any caller with storage access can write any object to `critique` on any thought regardless of `thoughtType`. Empirically: 0 rows have critique populated. The bug is in the code, but unused.

### Audit 4: Duplicate Type Definitions (`Explore`)

Found **9 type names defined in 2+ files**, **5 truly diverged shapes**:

1. **`ThoughtData`** (already known) — `src/persistence/types.ts:115-185` (required fields) vs `src/thought-handler.ts:19-53` (optional fields). Circular-dep dodge that should have been an extraction.
2. **`Session`** — `src/persistence/types.ts:46-64` has 10 fields; `src/observatory/schemas/thought.ts:78-98` has 6. Observatory missing `thoughtCount`, `branchCount`, `lastAccessedAt`, `updatedAt`, `partitionPath`. `title` REQUIRED in one, OPTIONAL in the other.
3. **`ThoughtNode`** — `src/persistence/types.ts:212-236` has `revisionMetadata?`; `src/resources/server-architecture-content.ts:184-192` lacks it. Architecture docs lag implementation.
4. **`RevisionMetadata`** — **duplicated within the SAME FILE.** `src/persistence/types.ts:241-259` (with comments) and `:275-282` (identical without comments). Copy-paste left in.
5. **`ThoughtboxStorage`** — `src/persistence/types.ts:552+` has 30+ methods; `src/resources/server-architecture-content.ts:130-150` has 8 methods (in markdown). Documentation lags implementation. Developers reading docs will implement against a missing surface.

Three more (`SessionStatus`, `AgentRole`, `AuditManifest`) are mirrored as Zod-vs-TS pairs with the same shape — different representation, low risk.

### Audit 5: Hand-Maintained Mirror Drift (Done in main thread; the dispatched agent failed twice)

**The mirror landscape is much larger than the known case.** Every MCP subsystem has 4 parallel hand-maintained representations of the same operations:

1. **Zod schema** in `*/tool.ts` — validates input
2. **Handler dispatcher** in `*-handler.ts` — routes operation to implementation
3. **OperationDefinition[] catalog** in `*/operations.ts` — describes operations to the LLM via `thoughtbox_search`
4. **SDK type string** in `src/code-mode/sdk-types.ts` — TypeScript types embedded as text for Code Mode

**12 operation catalogs found** in 11 files:

- `THOUGHT_OPERATIONS` (`src/thought/operations.ts:10`)
- `HUB_OPERATIONS` (`src/hub/operations.ts:660`)
- `OBSERVABILITY_OPERATIONS` (`src/observability/operations.ts:10`)
- `SESSION_OPERATIONS` (`src/sessions/operations.ts:43`)
- `KNOWLEDGE_OPERATIONS` (`src/knowledge/operations.ts:17`)
- `NOTEBOOK_OPERATIONS` (`src/notebook/operations.ts:17`)
- `THESEUS_OPERATIONS` (`src/protocol/operations.ts:10`)
- `ULYSSES_OPERATIONS` (`src/protocol/operations.ts:167`)
- `INIT_OPERATIONS` (`src/init/operations.ts:17`)
- `BRANCH_OPERATIONS` (`src/branch/operations.ts:45`)
- `STAGE_OPERATIONS` (`src/hub/hub-types.ts:201`)

12 catalogs × 4 representations = **48 potential mirror-pair drift surfaces.** None have codegen. None have CI checks. The cross-cutting validator that would catch this — `CC.1` from the project's own `.specs/cognitive-harness-improvements/VALIDATORS.md` — was specified but never built. Until it exists, drift is unflagged.

The `action_receipt` story is one instance of this class.

---

## Severity Classification

### Currently corrupting data or producing wrong output in production

- **14 thought rows with mismatched payloads** (0.23% of 5,971). The bug is real, the scale is small.
- **Theseus/Ulysses bridge thoughts silently dropping into a `catch {}`** — gap in the protocol audit chain, no log. Not yet measured how many bridge calls have actually fired and silently failed.
- **70% of `otel_events` lack `model` attribute** — cost dashboard has an honest `unknown` bucket of ~57k events. Why the parser isn't extracting `model` is unknown.

### Real bugs in production code with trivial current data exposure

- **OAuth token storage missing workspace_id filter** — 1 token of each type in production
- **`protocol_sessions.workspace_id` TEXT-not-UUID** — 25 non-UUID values exist
- **`action_receipt` unsubmittable through public API** — 0 rows; type is dead

### Latent (correct shape today, wrong invariants — fires when usage changes)

- Hub `TRUNCATE` grant to `anon`
- `thoughts.critique` permissive write path
- Protocol state cast (`as { B: number }`)
- KG historical isolation gap (data already backfilled, no exposure)
- `protocol_audits/history/scope/visas` missing tenant column

### Architectural pattern bugs (fixing requires reconsidering the framework, not patching one schema)

- **Flat-optional discriminators across 8 MCP tools** — the structural cause of the original bug. Not fixable per-tool without a coordinated migration.
- **4-way hand-maintained mirrors across 12 operation catalogs** — drift is the default state. Fix is codegen or schema-driven assertion, applied uniformly.
- **9 type names duplicated across files**, 5 with diverged shapes — circular-dep dodges that should have been extractions.

---

## Why This Survived Review

The original bug was authored on March 2 and replicated outward over 6 days. Subsequent PRs touched these files **additively** — adding new validators, new payloads, new types — without revisiting the framework. Every reviewer saw a competent-looking new `validateX` function and approved it.

Reasons review systematically misses this class:

1. **Reviews scope to the diff.** A PR adding `progressData` validation doesn't prompt anyone to ask "does this validator framework also fail to enforce the negative case?"
2. **Each `validateX` looks thorough.** Local competence masks systemic absence. Asking "what does this NOT check?" is harder than asking "does this check correctly?"
3. **Tests passed.** Negative cases weren't tested because nobody thought to write them. Green CI is a powerful "looks fine" signal even when the wrong things are being tested.
4. **Duplication looked deliberate.** Two `ThoughtData` interfaces in different files with different shapes look like "different concerns, different shapes" — reviewers rationalize.
5. **The 7-vs-8 enum split is invisible without aggregation.** Each individual file has one consistent enum. Cross-file audits don't happen in normal PR review.
6. **Code Mode froze the bug.** Once `sdk-types.ts` was authored as TypeScript-as-text, every PR adding a `thoughtType` was supposed to update *both* the Zod schema AND the SDK string. That's a process expectation buried in a header comment with no CI check. Forgetting it produces zero CI failures.
7. **Nobody had a reason to look until today.** The bug produces invalid-shaped JSONB silently persisted into a permissive column. It doesn't crash anything. It doesn't surface in any UI. The only way to notice is to read the data with the right question in mind.

---

## What Was Not Audited

- **Frontend code** in `apps/web/` — was not surveyed. May have its own type duplications and validation gaps.
- **`src/multi-agent/`** — referenced in project memory as having content-addressable thought hashing and conflict detection. Hash-chain integrity could be affected by the underlying `ThoughtData` divergence; not investigated.
- **`src/notebook/`** — has its own MCP surface; pattern-checked at high level (one of the 8 flat-optional tools), but specific failure modes not enumerated.
- **Why 70% of `otel_events` lack `model`** — empirical fact established, root cause not traced.
- **Whether Theseus/Ulysses bridge `catch {}` is actually firing in production** — code path identified, but not measured against `protocol_history` or thought-number gaps.
- **Cross-environment consistency** — only the production database was audited. Local-dev and staging databases were not compared.
- **Migration ordering on staging** — assumed lexicographic order matches Supabase replay order. Not verified.
- **`is_workspace_member()` runtime behavior** when `protocol_sessions.workspace_id` text doesn't parse as UUID — not directly tested. Mentioned by the RLS audit as a runtime-coercion risk.
- **Whether any of the 14 corrupted thought rows have caused user-visible weirdness** — not investigated beyond confirming they exist.

---

## Appendix A: File / Line Reference Index

| File:Line | Significance |
|---|---|
| `src/thought/tool.ts:50-91` | Zod schema for thought submission. 7-type enum at L75-78. Flat optional payloads at L80-86. |
| `src/thought/tool.ts:75-78` | The 7-type enum (omits `action_receipt`). |
| `src/thought-handler.ts:19-53` | **Parallel `ThoughtData` interface** — fork from `persistence/types.ts`. |
| `src/thought-handler.ts:40` | 8-type union (includes `action_receipt`). |
| `src/thought-handler.ts:335-425` | `validateThoughtData` — copies all payloads regardless of type at L412-420. |
| `src/thought-handler.ts:431-466` | `validateStructuredFields` — switch on type, positive-only checks. |
| `src/thought-handler.ts:468-488` | `validateDecisionFrame` — example of positive-only pattern. |
| `src/persistence/types.ts:115-185` | Canonical `ThoughtData` interface. |
| `src/persistence/types.ts:129` | 8-type union. |
| `src/persistence/types.ts:241-259` | `RevisionMetadata` — first declaration. |
| `src/persistence/types.ts:275-282` | **`RevisionMetadata` — duplicate within same file.** |
| `src/persistence/supabase-storage.ts:227-228` | Permissive write of `beliefs`/`assumption_change`. |
| `src/persistence/supabase-storage.ts:546-557` | `updateCritique` — permissive write path bypassing main validation. |
| `src/code-mode/sdk-types.ts:6` | "must stay in sync" comment. |
| `src/code-mode/sdk-types.ts:16` | `TB_SDK_TYPES` template string starts. |
| `src/code-mode/sdk-types.ts:21` | 7-type enum (still stale relative to persistence). |
| `src/observatory/schemas/thought.ts:13-67` | Observatory mirror of thought schema — same flat-optional pattern. |
| `src/observatory/schemas/thought.ts:48` | 8-type enum. |
| `src/audit/manifest-generator.ts:62-73` | Audit aggregator's `THOUGHT_TYPES` (8 types). |
| `src/hub/hub-tool-schema.ts:3-6` | The comment that codifies the project-wide flat-optional pattern. |
| `src/hub/hub-tool-schema.ts:26-113` | Hub tool input schema — 28 operations, flat optionals. |
| `src/hub/hub-handler.ts:163-321` | Hub dispatch — `(args as any)` casts everywhere. |
| `src/knowledge/tool.ts:6-9, 20` | Knowledge tool — `relation_type` discriminator + `properties: z.record(z.any())`. |
| `src/protocol/theseus-tool.ts:152, 164` | `bridgeThought` + `catch {}` swallowing decision_frame validation errors. |
| `src/protocol/ulysses-tool.ts:214, 228` | Same pattern in Ulysses. |
| `src/protocol/in-memory-handler.ts:224` | Unsafe `as { B: number }` cast on protocol state. |
| `src/otel/otel-storage.ts:232-235` | Cost aggregation reads `event_attrs.model` with `'unknown'` fallback. |
| `src/auth/oauth/token-storage.ts:90,106,150,172` | OAuth token lookups missing workspace_id filter. |
| `supabase/migrations/20260320191032_remote_schema.sql` | Original schema. `protocol_sessions.workspace_id text` at L467. |
| `supabase/migrations/20260320200448_drop_project_columns.sql` | Drops `project_isolation` policy on entities/relations/observations. |
| `supabase/migrations/20260320202228_fix_protocol_enforcement_and_knowledge_rls.sql` | Notes that KG RLS can't be added until columns exist. |
| `supabase/migrations/20260322153858_add_workspace_id_to_knowledge_tables.sql` | Adds workspace_id to KG tables, backfills via `LIMIT 1`, adds RLS. |
| `supabase/migrations/20260323020000_add_action_receipt_thoughttype.sql` | Adds `action_receipt` to DB CHECK. SDK schema never updated. |
| `supabase/migrations/20260409232440_remote_schema.sql` | Hub tables — grants `TRUNCATE` to `anon`. |
| `.specs/cognitive-harness-improvements/VALIDATORS.md` | The specification for the cross-cutting validator (`CC.1`) that would have caught the SDK-vs-Zod drift. Specified, not built. |

### Key commits

| SHA | Date | Significance |
|---|---|---|
| `fb8e478` | 2026-03-02 | "AUDIT-001 structured fields — discriminated union on ThoughtData". Original sin: positive-only runtime validator, no Zod discriminated union. |
| `c221f42` | 2026-03-17 | "implement supabase storage and refactor gateway". Forked `ThoughtData` into `persistence/types.ts`. Created the Zod schema in `thought/tool.ts` with the 7-type list. |
| `9dd353c` | 2026-03-18 | google-labs-jules[bot] deleted ~16k lines. Reverted ~1 hour later by `ba3dec9`. |
| `5dca8e6` | 2026-03-22 23:02 | "feat(types): add action_receipt thoughtType". Updated 5 of 7 sites; missed Zod schema. |
| `c0037f0` | 2026-03-23 12:34 | "feat!: replace 9 MCP tools with Code Mode". Created `sdk-types.ts` with the still-stale 7-type list. Drift frozen in amber. |

---

## Appendix B: SQL Queries Used

All queries run with `PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=20000'` to enforce read-only at the protocol level.

```sql
-- Q1: Table sizes
SELECT 'workspaces' AS t, count(*) FROM workspaces
UNION ALL SELECT 'workspace_memberships', count(*) FROM workspace_memberships
UNION ALL SELECT 'profiles', count(*) FROM profiles
UNION ALL SELECT 'sessions', count(*) FROM sessions
UNION ALL SELECT 'thoughts', count(*) FROM thoughts
UNION ALL SELECT 'entities', count(*) FROM entities
UNION ALL SELECT 'relations', count(*) FROM relations
UNION ALL SELECT 'observations', count(*) FROM observations;

-- Q2: KG entity workspace distribution + age
SELECT
  e.workspace_id::text AS ws,
  count(*) AS entities,
  min(e.created_at)::date AS oldest,
  max(e.created_at)::date AS newest
FROM entities e
GROUP BY e.workspace_id
ORDER BY entities DESC;

-- Q3: Pre/post-backfill split
SELECT
  CASE WHEN created_at < '2026-03-22' THEN 'pre-backfill' ELSE 'post-backfill' END AS era,
  workspace_id::text AS ws,
  count(*) AS entities
FROM entities
GROUP BY era, workspace_id;

-- Q4: Mismatched-payload thoughts
SELECT
  thought_type,
  count(*) AS rows,
  count(*) FILTER (WHERE thought_type != 'decision_frame'    AND options          IS NOT NULL) AS bad_options,
  count(*) FILTER (WHERE thought_type != 'action_report'     AND action_result    IS NOT NULL) AS bad_action_result,
  count(*) FILTER (WHERE thought_type != 'belief_snapshot'   AND beliefs          IS NOT NULL) AS bad_beliefs,
  count(*) FILTER (WHERE thought_type != 'assumption_update' AND assumption_change IS NOT NULL) AS bad_assumption,
  count(*) FILTER (WHERE thought_type != 'context_snapshot'  AND context_data     IS NOT NULL) AS bad_context,
  count(*) FILTER (WHERE thought_type != 'progress'          AND progress_data    IS NOT NULL) AS bad_progress,
  count(*) FILTER (WHERE thought_type != 'action_receipt'    AND receipt_data     IS NOT NULL) AS bad_receipt
FROM thoughts
GROUP BY thought_type
ORDER BY rows DESC;

-- Q5: action_receipt presence
SELECT thought_type, count(*), min(timestamp), max(timestamp)
FROM thoughts WHERE thought_type = 'action_receipt' GROUP BY thought_type;

-- Q7: protocol_sessions.workspace_id UUID validity
SELECT
  count(*) AS total,
  count(*) FILTER (WHERE workspace_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') AS valid_uuid,
  count(*) FILTER (WHERE workspace_id IS NULL) AS null_ws,
  count(*) FILTER (WHERE workspace_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND workspace_id IS NOT NULL) AS non_uuid
FROM protocol_sessions;

-- Q9: FK orphans
SELECT 'orphan entities', count(*) FROM entities e LEFT JOIN workspaces w ON w.id = e.workspace_id WHERE w.id IS NULL
UNION ALL SELECT 'orphan relations',     count(*) FROM relations     r LEFT JOIN workspaces w ON w.id = r.workspace_id WHERE w.id IS NULL
UNION ALL SELECT 'orphan observations',  count(*) FROM observations  o LEFT JOIN workspaces w ON w.id = o.workspace_id WHERE w.id IS NULL
UNION ALL SELECT 'orphan sessions',      count(*) FROM sessions      s LEFT JOIN workspaces w ON w.id = s.workspace_id WHERE w.id IS NULL
UNION ALL SELECT 'orphan thoughts',      count(*) FROM thoughts      t LEFT JOIN workspaces w ON w.id = t.workspace_id WHERE w.id IS NULL;

-- Q11: otel_events model attribute distribution
SELECT
  COALESCE(event_attrs->>'model', '<<MISSING>>') AS model_value,
  count(*) AS events
FROM otel_events
GROUP BY model_value
ORDER BY events DESC;

-- Q12: critique populated rows
SELECT
  count(*) FILTER (WHERE critique IS NOT NULL) AS with_critique,
  count(*) FILTER (WHERE critique IS NULL)     AS without_critique
FROM thoughts;

-- Q13: protocol_sessions state_json shape by protocol
SELECT
  protocol,
  count(*) AS rows,
  count(*) FILTER (WHERE state_json ? 'B') AS has_B_field,
  count(*) FILTER (WHERE state_json ? 'S') AS has_S_field,
  count(*) FILTER (WHERE state_json ? 'B' AND state_json ? 'S') AS has_both
FROM protocol_sessions
GROUP BY protocol;
```

---

## Closing Note

The shape of the codebase has serious systemic issues, but the running-data damage is small. The architectural patterns that produced the original bug are deeply embedded — flat-optional discriminators in 8 MCP tools, 4-way hand-maintained mirrors across 12 catalogs, parallel type definitions that should have been extractions. Fixing any of these "properly" is not a one-PR refactor; it's a reconsideration of how the codebase encodes semantic constraints across the MCP boundary.

What is and isn't a fire is empirically grounded above. What to do about it is the next conversation.
