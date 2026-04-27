# Validator Design — Cognitive Harness Improvements

> **Companion to**: SPEC-CHX-001 and the eleven per-feature specs in this directory.
> **Purpose**: Translate each spec's plain-English `Validation` section into deterministic,
> code-based checks that can be wired into CI. A spec is "done" iff every validator below
> passes against the impacted code.
> **Provenance**: Designed in Thoughtbox session
> `5131bd58-5d09-45ca-b2fd-6dcfa7846bdc` (16 thoughts, 1 assumption flip).

---

## 1. What counts as a validator

A validator in this catalog must be:

1. **Deterministic** — same input, same code, same answer every run. No reliance on a
   live LLM, no flaky network, no clock-of-the-wall comparisons. Time and randomness are
   injected, not observed.
2. **Mechanical** — a post-condition over an artifact (a file's AST, a Zod parse result,
   a SQL plan, a DB row, a JSON snapshot). No "agent submits 80%+ of thoughts via tb.t" —
   that's product validation, not engineering acceptance.
3. **Self-contained** — runnable from `pnpm test` (or one extra `pnpm exec` step for
   `tsd`) without manual setup beyond `docker compose up postgres`.
4. **Fails loudly on regression** — when the impacted code drifts back, the validator
   surfaces the drift with a pointer to the spec section that defined the invariant.

**The master spec's `Validation` section in `SPEC-CHX-001-cognitive-harness-improvements.md`
is intentionally behavioral** ("agent submits 100+ thoughts without dup-key errors").
Those are end-of-pipeline observations from a future reasoning session. The validators
here are the *engineering* counterparts — they prove the *mechanism* is in place that
would *cause* the behavior.

---

## 2. Validator categories

| Category | Tool | What it checks |
|----------|------|----------------|
| **TS-FIXTURE** | `tsd` for `// @ts-expect-error` blocks; `expect-type` for runtime-friendly type asserts | Compile-time invariants — `?: never`, branded types, discriminated-union narrowing |
| **ZOD** | vitest + the existing Zod schemas | Schema-level accept/reject of representative payloads |
| **HANDLER** | vitest against the in-process handler with a real Postgres test DB (`docker compose up postgres-test`) | Persisted shape, side effects, error metadata |
| **DB-PLAN** | vitest + `EXPLAIN (FORMAT JSON)` against seeded data | The intended index appears in the query plan |
| **CATALOG** | vitest snapshot over `thoughtbox_search` catalog and `TB_SDK_TYPES` string | The SDK surface and Code Mode catalog match the spec |
| **DOC-AUDIT** | `rg` invoked from a vitest test | No stale examples / no use of discouraged patterns |
| **PURE-FN** | vitest table tests | Reference functions like `getEffectiveCipherDecision` are total over their input space |

The first time a tooling choice appears (e.g. `tsd` for type fixtures), use it for every
TS-FIXTURE entry that follows. Don't relitigate per-spec.

**Recommended layout**: validators live next to their target module under
`__tests__/spec-<NN>-*.test.ts` (or `.test-d.ts` for type fixtures). Cross-cutting
validators live in `src/__tests__/cross-cutting/`.

---

## 3. Per-spec validator catalog

Each entry is shaped:

> **`Vn.k`** — *CATEGORY* — **target**: `path` — **check**: one sentence — **pass**: observable post-condition.

### Spec 01 — Auto-Numbering Surfacing

- **`V1.1`** — TS-FIXTURE — target: `src/code-mode/__tests__/spec-01-types.test-d.ts` — check: a `ThoughtInput` literal containing `thoughtNumber: 5` has a `// @ts-expect-error` comment that `tsd` accepts — pass: `pnpm exec tsd` exits 0; the same fixture without the field type-checks clean.
- **`V1.2`** — ZOD — target: `src/thought/tool.ts` `thoughtToolInputSchema` — check: schema is `.strict()` (or `thoughtNumber` is removed from the `z.object` shape entirely) — pass: `safeParse({...thoughtNumber:5}).success === false` with `code: 'unrecognized_keys'` (strict) or the field is absent from `schema.shape`.
- **`V1.3`** — TS-FIXTURE / AST-grep — target: `src/code-mode/sdk-types.ts`, `src/persistence/types.ts` — check: no `interface ThoughtInput extends Thought` or `extends ThoughtData` declaration — pass: `ast-grep --pattern 'interface ThoughtInput extends $X' --lang ts` returns no matches in either file.
- **`V1.4`** — DOC-AUDIT — target: `src/`, `docs/`, `.claude/skills/`, `apps/`, excluding `**/__tests__/**` and `**/spec-01*` — check: no doc or example sets `thoughtNumber: 1` (or any literal) on a thought submission — pass: `rg -n 'thoughtNumber\s*:\s*\d+'` returns zero matches outside the allowlist.
- **`V1.5`** — HANDLER — target: `src/thought-handler.ts` — check: every persisted thought returned from `processThought` carries non-null `thoughtNumber: number` and `timestamp: string` regardless of input — pass: 100 randomized submissions all surface both fields populated; submissions that pass `thoughtNumber` explicitly are rejected with HTTP-400-equivalent error.

### Spec 02 — Terse Shorthand & Chain API

- **`V2.1`** — HANDLER — target: `src/code-mode/execute-tool.ts` — check: `tb.t('x')` and `tb.thought({thought:'x',thoughtType:'reasoning',nextThoughtNeeded:true})` produce byte-identical handler input — pass: spy on the handler resolves both calls with deep-equal payloads (modulo non-deterministic id/timestamp fields).
- **`V2.2`** — HANDLER — target: chain object — check: each `chain.t()` / `chain.end()` / `chain.thought()` call results in exactly one `INSERT` into `thoughts` — pass: storage spy count == call count; no client-side buffering observable.
- **`V2.3`** — HANDLER — target: chain GC behavior — check: a chain reference dropped after one `chain.t()` does not lose the persisted thought — pass: `tb.session.recent(sessionId, 1)` returns the dropped chain's thought.
- **`V2.4`** — HANDLER — target: `ChainClosedError` — check: `chain.end()` then `chain.t()` throws — pass: error `instanceof ChainClosedError`, `error.attemptedOperation === 't'`, `error.sessionId` matches.
- **`V2.5`** — HANDLER — target: server-side auto-numbering under concurrency — check: two chains writing 5 thoughts each in parallel produce 10 thoughts with strictly increasing `thought_number`, no duplicates — pass: `SELECT array_agg(thought_number ORDER BY thought_number)` returns `[1..10]` with no gaps.
- **`V2.6`** — HANDLER — target: factory defaults — check: `tb.think()` / `tb.decide()` / `tb.research()` create sessions with `sessionType` `exploration` / `decision` / `research` respectively — pass: `SELECT session_type FROM sessions WHERE id=$1` matches expected for each factory.
- **`V2.7`** — CATALOG — target: `catalog.operations.session` and `TB_SDK_TYPES` string — check: `t`, `end`, `openChain`, `think`, `decide`, `research` are advertised — pass: snapshot test of `Object.keys(catalog.operations.session)` and `TB_SDK_TYPES.includes('t(content: string)')`.

### Spec 03 — Mid-Session Recall Primitives

- **`V3.1`** — HANDLER — target: `session_get_thought` handler — check: in-bounds returns the thought; out-of-bounds returns `null`, **never throws** — pass: `getThought(sessionId, 5)` returns the thought, `getThought(sessionId, 99)` returns `null`.
- **`V3.2`** — HANDLER — target: `session_recent_thoughts` — check: ordering is **oldest-to-newest within slice** — pass: write thoughts 1..20, `recentThoughts(5)` returns `thoughtNumber` array `[16,17,18,19,20]` in that order.
- **`V3.3`** — HANDLER — target: `session_search_within` — check: ordering is **newest-to-oldest** (intentionally opposite of recentThoughts) — pass: seed thoughts 1..20 each containing word `foo` only at positions 5, 12, 18; `searchWithin('foo')` returns `[18, 12, 5]`.
- **`V3.4`** — HANDLER — target: `searchWithin` filter — check: `thoughtTypes:['decision_frame']` only matches that type — pass: out of 20 mixed-type thoughts, only the decision_frame rows return.
- **`V3.5`** — HANDLER — target: `searchWithin` limit clamp — check: `limit: 1000` is clamped to 100 server-side — pass: query returning 200 candidates returns 100 rows.
- **`V3.6`** — TS-FIXTURE — target: `src/code-mode/__tests__/spec-03-types.test-d.ts` — check: returned arrays are `readonly Thought[]` — pass: `// @ts-expect-error` on `recent[0] = {...}` accepted by `tsd`.
- **`V3.7`** — DB-PLAN — target: Postgres FTS — check: `EXPLAIN (FORMAT JSON)` on the `searchWithin` query against a session with 1k thoughts contains a node referencing `idx_thoughts_content_fts` — pass: walk the plan JSON, assert *some* node has `Index Name === 'idx_thoughts_content_fts'`. **Don't assert node-type** (Bitmap vs Index Scan) — Postgres rewrites those across versions.
- **`V3.8`** — HANDLER — target: session-scope isolation — check: cross-session leakage is impossible — pass: insert "foo" thought into session A and B; `searchWithin` invoked with session A's id returns 1 row, not 2.
- **`V3.9`** — CATALOG — target: catalog operations — check: `session.getThought`, `session.recentThoughts`, `session.searchWithin` are present with the documented titles — pass: snapshot match.

### Spec 04 — Subagent Session Attachment

- **`V4.1`** — HANDLER — target: `tb.subagent.attach` — check: default `thoughtType` is `context_snapshot` — pass: `SELECT thought_type FROM thoughts WHERE id = $created` returns `'context_snapshot'`.
- **`V4.2`** — HANDLER — target: metadata roundtrip — check: passed `SubagentOutput` appears verbatim under `metadata.subagentOutput` JSONB — pass: `metadata->'subagentOutput'->>'content'` equals input `content`; `completedAt`, `durationMs`, `model` survive the roundtrip.
- **`V4.3`** — HANDLER — target: KG entity creation — check: when `entityName` is set, a `kg_entities` row exists with that name and an observation linking to the new thought — pass: `SELECT … FROM kg_entities WHERE name = $entityName` returns one row; an observation row exists with `source_thought = thought_number`. When `entityName` is omitted, no entity row exists.
- **`V4.4`** — HANDLER — target: visibility default — check: missing `visibility` resolves to `agent-private` — pass: created entity row's `visibility` column equals `'agent-private'`.
- **`V4.5`** — ZOD — target: `attach` input schema — check: invalid `thoughtType` rejected — pass: `safeParse({thoughtType:'not_a_real_type'}).success === false`.
- **`V4.6`** — TS-FIXTURE — target: `SubagentOutput.metadata` — check: field is `Readonly<Record<string, unknown>>` — pass: `// @ts-expect-error` on assignment compiles.

### Spec 05 — Hook Suppression During Active Sessions

- **`V5.1`** — TS-FIXTURE — target: `tb.session.isActive` signature — check: returns `Promise<boolean>` — pass: `const x: boolean = await tb.session.isActive()` compiles.
- **`V5.2`** — HANDLER — target: timeout resolution order — check: per-session > env > 300_000 default — pass: parametrized table covers all four cases with `last_thought_at` set to `effective − 1ms` and `effective + 1ms`; `isActive` returns `true` and `false` respectively.
- **`V5.3`** — HANDLER — target: edge values — check: `0` always inactive; `Number.MAX_SAFE_INTEGER` always active — pass: with mocked clock advanced 1 hour, both expectations hold.
- **`V5.4`** — HANDLER — target: explicit end — check: `tb.session.end()` makes `isActive()` return `false` regardless of timeout — pass: timestamp-immediate-after-end test.
- **`V5.5`** — HANDLER (plugin) — target: plugin SessionStart hook in `plugins/thoughtbox-claude-code/` — check: with active session, hook output line is JSON `{suppressed:true, reason:'active_session', sessionId}`; without, the nudge string is emitted — pass: spawn the hook process with mocked stdin, assert stdout shape.
- **`V5.6`** — HANDLER — target: suppression log — check: a `SuppressionLogEntry` with `hook='SessionStart'`, `event='nudge_suppressed'` is written iff suppressed — pass: log capture matches the shape exactly when and only when `isActive()` returns true.

### Spec 06 — Cipher Mode Toggle

- **`V6.1`** — PURE-FN — target: `getEffectiveCipherDecision` — check: full enumeration of `(cipherMode ∈ {auto,manual,off}) × (flag ∈ {undefined,false,true})` — pass: 9-row table-driven test, every row's `(decision, reason)` matches the spec table verbatim.
- **`V6.2`** — HANDLER — target: server-side enforcement — check: `cipherMode='off'` + `cipher:true` payload persists with `metadata.cipherDecision = {decision:'skip', reason:'mode_off'}` — pass: SQL select on the resulting row.
- **`V6.3`** — HANDLER — target: default mode — check: `tb.session.create()` with no `cipherMode` produces `cipher_mode='auto'` — pass: column value asserted.
- **`V6.4`** — TS-FIXTURE — target: `CipherMode` union — check: invalid literal rejected — pass: `// @ts-expect-error` on `const m: CipherMode = 'invalid'`.
- **`V6.5`** — HANDLER — target: contradiction non-throw — check: spec explicitly says flag-vs-mode contradiction is **silently ignored, not an error** — pass: `cipherMode='off'` + `cipher:true` returns 200; structured log line at `debug` level recording the ignore; *not* an error response.

### Spec 07 — Deliberation Without Commitment

- **`V7.1`** — TS-FIXTURE — target: `DecisionOption` union — check: per-element structural typing — pass: `{label:'A',selected:'yes'}` and `{selected:true}` (no label) both fail `tsd`; `{label:'A',selected:true,reason:'r'}` compiles.
- **`V7.2`** — ZOD — target: cross-element invariant — check: `options=[{label:'A',selected:true},{label:'B',selected:true}]` rejected at parse time by the `.refine` step — pass: `safeParse` returns `success:false` with message containing `'At most one option may have selected: true'`.
- **`V7.3`** — ZOD — target: cross-field invariant — check: `decisionState='committed'` with zero selections rejected — pass: parse error message contains `'Committed decision must have exactly one selected option'`.
- **`V7.4`** — HANDLER — target: legitimate deliberation — check: `options=[]` + `decisionState='deliberating'` is valid — pass: thought persists; row exists with empty options jsonb array.
- **`V7.5`** — TS-FIXTURE — target: narrowing — check: `if (option.selected) { option.reason; }` compiles — pass: `tsd` accepts; the same access without the `if` errors.
- **`V7.6`** — HANDLER — target: backward compat — check: a thought row with no `decisionState` and `options[0].selected===true` is read back as `decisionState='committed'`; with no selections, `'deliberating'` — pass: insert raw row, fetch via `session.get`, assert derived field.
- **`V7.7`** — HANDLER — target: audit ignores deliberating — check: `generateAuditData` produces no `decision_without_action` gap for a `deliberating` decision_frame — pass: feed the aggregator a fixture session with one `deliberating` decision frame and zero following action_reports; resulting `gaps.length === 0`. *Pre-spec this test would fail with one gap.*

### Spec 08 — Per-Session-Type Audit

- **`V8.1`** — TS-FIXTURE — target: closed `SessionType` union — check: typo rejected — pass: `// @ts-expect-error` on `'reseach'`.
- **`V8.2`** — HANDLER — target: research routing — check: `sessionType='research'` with 0 belief_snapshots emits `insufficient_belief_snapshots` warning — pass: aggregator output gap matches.
- **`V8.3`** — HANDLER — target: decision routing — check: `sessionType='decision'` with no committed decision_frame emits `no_committed_decision` error — pass: gap matches.
- **`V8.4`** — HANDLER — target: implementation routing — check: `sessionType='implementation'` containing belief_snapshot emits `unexpected_belief_snapshots` warning — pass: gap matches.
- **`V8.5`** — HANDLER — target: debugging routing — check: `sessionType='debugging'` lacking `action_report` whose content matches `/root cause/i` emits `no_root_cause_identified` error — pass: gap matches; same session with one matching action_report passes clean.
- **`V8.6`** — HANDLER — target: exploration silence — check: `sessionType='exploration'` always produces `gaps: []` regardless of contents — pass: even an empty session yields no gap.
- **`V8.7`** — HANDLER — target: regression-prevention — check: the legacy 5-thought decision_without_action rule is suppressed for `research` and `exploration` — pass: pre-spec session fixture (research with decision_frame, no action) yielded 1 gap; post-spec yields 0. **Snapshot-test the gap-count delta** so a future refactor that re-introduces the rule fails loudly.
- **`V8.8`** — HANDLER — target: type update — check: `tb.session.update({sessionType:'debugging'})` updates the column and changes the audit rules used on the next `generateAuditData` — pass: same session re-aggregated produces a different gaps shape.
- **`V8.9`** — HANDLER — target: non-blocking — check: a session whose audit yields `severity:'error'` still allows `processThought` to return success — pass: gap is in the manifest, response status is 200.

### Spec 09 — Named Checkpoints

- **`V9.1`** — ZOD/PURE-FN — target: `createCheckpointLabel` — check: regex enforcement — pass: parametrized table; spec's negative cases (`''`, `'Has Spaces'`, `'has/slashes'`, `'UPPERCASE'`, `'_starts'`) all throw with message containing `/^[a-z0-9][a-z0-9_-]*$/`; positive cases resolve.
- **`V9.2`** — TS-FIXTURE — target: branded `CheckpointLabel` — check: cannot assign raw string — pass: `// @ts-expect-error` on `const l: CheckpointLabel = 'foo'`; `createCheckpointLabel('foo')` compiles.
- **`V9.3`** — HANDLER — target: persisted checkpoint shape — check: `tb.session.checkpoint('foo','bar')` produces a `progress` thought with `metadata.checkpoint = {label:'foo', summary:'bar', createdAt:<iso>}` — pass: SQL `metadata->'checkpoint'` deep-equal expected; `Date.parse(createdAt)` is finite.
- **`V9.4`** — DB-PLAN — target: partial GIN — check: `EXPLAIN (FORMAT JSON)` on `WHERE session_id=$1 AND metadata ? 'checkpoint'` plan references `idx_thoughts_checkpoint`; same for label-equality query — pass: index name appears in the plan tree.
- **`V9.5`** — HANDLER — target: `checkpointsByLabel` multiple matches — check: 3 checkpoints with label `'init'` returned oldest-first — pass: result `thought_number` array is monotonic ascending.
- **`V9.6`** — HANDLER — target: `getCheckpoint` first-match — check: oldest match returned, `null` for missing — pass: returned row's `thought_number === MIN(thought_number)`; `getCheckpoint('does-not-exist')` is `null`.
- **`V9.7`** — TS-FIXTURE — target: `isCheckpointThought` predicate — check: narrows `Thought` to `CheckpointThought` — pass: inside the `if` branch, `t.metadata.checkpoint.label` access compiles without optional chaining.
- **`V9.8`** — DOC-AUDIT — target: any `*.test.ts` and `docs/` — check: discouragement of `searchWithin('Checkpoint:')` — pass: `rg -n "searchWithin\\(['\"]Checkpoint:" tests/ docs/` returns zero matches *after* the spec lands.

### Spec 10 — Knowledge Graph Persistence Shortcut

- **`V10.1`** — HANDLER — target: belief-snapshot path — check: `belief_snapshot` + `persistAs={name:'X', visibility:'team-private'}` creates `kg_entities` row with `type='Concept'` and `visibility='team-private'`, plus an observation linking back to `thought_number`, plus thought row's `metadata->'kgPersistSuccess'` populated — pass: all four assertions hold in one transaction.
- **`V10.2`** — HANDLER — target: refuted → Decision typing — check: `assumption_update` with `assumptionChange.newStatus='refuted'` produces `type='Decision'` — pass: SQL select.
- **`V10.3`** — HANDLER — target: non-refuted → Concept typing — check: `believed → uncertain` (no committed decision dependency) produces `type='Concept'` — pass: SQL select.
- **`V10.4`** — HANDLER — target: downstream → Decision typing — check: prior committed `decision_frame` in same session, then `assumption_update` with `downstream:[<that thoughtNumber>]` produces `type='Decision'` — pass: SQL select.
- **`V10.5`** — HANDLER — target: `relationTo` — check: `BUILDS_ON` relation row exists from new entity to specified target — pass: `SELECT * FROM kg_relations WHERE from_id=$new AND to_id=$existing AND relation_type='BUILDS_ON'` returns 1 row.
- **`V10.6`** — HANDLER — target: failure atomicity — check: provoke `ENTITY_NAME_CONFLICT` (pre-insert clashing entity); thought still persists; `metadata.kgPersistError = {code:'ENTITY_NAME_CONFLICT', details:{existingEntityId,…}}`; **no** new entity row — pass: row counts pre and post differ by exactly 1 thought, 0 entities; metadata shape matches.
- **`V10.7`** — ZOD — target: structural scoping — check: `persistAs` on a `reasoning` (or any non-belief/assumption) thought is rejected — pass: parse error mentions `persistAs` not allowed on this thoughtType.
- **`V10.8`** — HANDLER — target: `RELATION_TARGET_NOT_FOUND` — check: `relationTo='non-existent-id'` produces that error code with `attemptedRelationTo` in details — pass: metadata shape match.
- **`V10.9`** — HANDLER — target: visibility default — check: omitted `visibility` resolves to `agent-private` on the persisted entity — pass: SQL select.

### Spec 11 — Structured Return Schemas

- **`V11.1`** — HANDLER — target: schema-pass path — check: subagent dispatched with `expectedReturn.schema` and a return matching it produces `ValidatedOutput<T>` with `success:true` and typed `data` — pass: result deep-equals expected; type-fixture asserts `data` typed as the schema's TS shape.
- **`V11.2`** — HANDLER — target: schema-fail path — check: invalid return throws `StructuredOutputError` with `type==='structured_output_error'` and `validationErrors[0]` populated with `path`, `expected`, `received` — pass: thrown error matches Zod parse of `StructuredOutputErrorSchema`.
- **`V11.3`** — HANDLER — target: parse-fail path — check: subagent returns non-JSON; resulting error has `parsingError.offset >= 0` — pass: error matches; `validationErrors` is empty.
- **`V11.4`** — HANDLER — target: no-attach on fail — check: validation failure means no thought row inserted in parent session — pass: `SELECT COUNT(*) FROM thoughts WHERE session_id=$parent` unchanged across the failed dispatch.
- **`V11.5`** — TS-FIXTURE — target: discriminant narrowing — check: `if (e.type==='structured_output_error') { e.validationErrors.length }` compiles without `as` — pass: `tsd` accepts.
- **`V11.6`** — TS-FIXTURE — target: `ValidatedOutput<T>` carries typed `data` — check: with schema `{x:string,y:number}` the result type is `{x:string,y:number}` — pass: `expectType<{x:string,y:number}>(result.data)`.

---

## 4. Cross-cutting validators

These don't belong to any single spec; they catch failure modes across the suite.

- **`CC.1`** — HANDLER — target: `src/code-mode/sdk-types.ts` ↔ Zod schemas — check: every operation declared in `TB_SDK_TYPES` has a matching exported Zod schema, and vice versa — pass: a vitest test imports both, computes the symmetric difference of operation names, asserts it is empty. Catches the failure mode where `tb.t` lands in the SDK string but the Code Mode runtime never wires it.
- **`CC.2`** — CATALOG — target: `catalog.operations.session` returned by `thoughtbox_search` — check: includes `getThought`, `recentThoughts`, `searchWithin`, `checkpoint`, `checkpoints`, `getCheckpoint`, `checkpointsByLabel`, `isActive`, `update`, `openChain` — pass: snapshot of the keys array equals expected.
- **`CC.3`** — TS-FIXTURE / AST-grep — target: `src/thought/tool.ts` `thoughtType` `z.enum` — check: the seven canonical types are unchanged: `reasoning | decision_frame | action_report | belief_snapshot | assumption_update | context_snapshot | progress` — pass: AST-grep confirms the literal union; if a future PR adds `'deliberation'` or similar, this fails. **Note**: `src/audit/manifest-generator.ts` contains an 8-element list including `'action_receipt'` — that is the audit aggregator's internal counter, not a thought-tool type. The Zod tool schema is the ground truth; CC.3 watches that one.
- **`CC.4`** — DOC-AUDIT — target: `db/migrations/` (or `supabase/migrations/`) — check: each schema-touching spec has a corresponding migration file — pass: filename pattern check, e.g. `rg -l 'spec0(3|6|8|9|10)' db/migrations/` returns at least 5 paths. Fail message points at the missing spec number.

---

## 5. Caveats and tooling notes

1. **TS-FIXTURE tooling.** Use `tsd` for `// @ts-expect-error` block validation and
   `expect-type` for runtime-friendly type asserts inside vitest. Pick once; don't mix
   both styles within one fixture file.
2. **EXPLAIN-plan brittleness.** Postgres major versions can rearrange plan-node types
   (Bitmap vs Index Scan vs Index-Only Scan). Assert *index-name presence* in the plan
   tree, not node-type structure. Pin `enable_seqscan=off` only inside the test
   transaction so production cost-based regressions still surface.
3. **ThoughtType list discrepancy.** `src/thought/tool.ts` has 7 types; the audit
   aggregator at `src/audit/manifest-generator.ts:64-73` enumerates 8 (includes
   `'action_receipt'`). The specs uniformly say 7 — the audit aggregator's 8th is an
   internal counter for a separate concept, not a submitted thought type. **Validators
   anchor to `thoughtToolInputSchema` in `src/thought/tool.ts`**, not the audit list.
   Flag the divergence in a separate cleanup task; do not silently widen the canonical
   union to 8.
4. **Deterministic vs behavioral.** Each spec's own `Validation` section retains
   behavioral acceptance ("agent does X over a 100-thought session"). Those are useful
   product checks, but they are **not** part of this catalog. If a behavioral check
   regresses while the deterministic catalog passes, that is a bug in the catalog —
   raise an issue and add a deterministic counterpart.
5. **Session fixtures.** Handler tests need a small library of session fixtures
   (research-no-beliefs, decision-with-deliberating-frame, debugging-with-root-cause,
   etc.). House them under `src/__tests__/fixtures/sessions/` so multiple spec
   validators reuse the same JSON without per-test setup drift.

---

## 6. How to run all of it

Once implemented, the full catalog runs via:

```bash
docker compose up -d postgres-test
pnpm test                          # Zod, HANDLER, DB-PLAN, CATALOG, PURE-FN
pnpm exec tsd                      # TS-FIXTURE
pnpm exec vitest run cross-cutting # CC.*
```

A single `pnpm validate:specs` script that wraps these three commands is the right
target once the catalog stabilizes.

---

## 7. Validator count summary

| Spec | # validators |
|------|--------------|
| 01 — Auto-numbering surfacing | 5 |
| 02 — Terse shorthand & chain | 7 |
| 03 — Mid-session recall | 9 |
| 04 — Subagent attach | 6 |
| 05 — Hook suppression | 6 |
| 06 — Cipher mode toggle | 5 |
| 07 — Deliberation without commitment | 7 |
| 08 — Per-session-type audit | 9 |
| 09 — Named checkpoints | 8 |
| 10 — Knowledge-graph persistence | 9 |
| 11 — Structured return schemas | 6 |
| Cross-cutting | 4 |
| **Total** | **81** |

Implementation sequencing: TS-FIXTURE and Zod first (cheap, ~25 validators), HANDLER and
DB-PLAN second (require test Postgres, ~45 validators), CATALOG / DOC-AUDIT / cross-cutting
last (~10 validators, mostly drift detectors that benefit from running in CI on every PR).
