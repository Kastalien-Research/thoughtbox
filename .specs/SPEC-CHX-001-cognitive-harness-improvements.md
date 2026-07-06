# SPEC-CHX-001: Cognitive Harness Usability Improvements

> **Status**: Draft
> **Priority**: High (#1, #2, #3 are quick wins; #4 unlocks new patterns)
> **Phase**: Enhancement
> **Estimated Effort**: 12-20 hours across 11 items, deliverable as separate PRs
> **Source**: Thoughtbox session `0eb05082-4b22-42ab-ba9c-923c6d6dacb7` (146-thought sequential research run on orbital data center economics, 2026-04-26 → 2026-04-27). Recommendations derived from observed friction during the session.

## Summary

A long-form sequential reasoning run (146 thoughts, 9 branches, 3 subagent dispatches, 25+ Exa grounding rounds) surfaced concrete friction points in Thoughtbox-as-cognitive-harness. The MCP round-trip latency, branching, and seven-type thought taxonomy all worked well. The friction lives in: (a) per-call ergonomics that increase token cost without information value, (b) absence of mid-session recall primitives, (c) unidirectional subagent integration that forces manual fact re-recording, (d) operational-task-biased audit framework, and (e) hooks that compete with Thoughtbox's own progress tracking.

This spec proposes 11 improvements ranked by impact-to-effort. Each is grounded in observed behavior and references the relevant source files.

## Problem Statement

The fundamental cost of an external reasoning harness is that **structured thought is more expensive to write than unstructured thought**. The agent trades native-context speed for persistent structure + cross-session recall + cryptographic audit. The trade is real and worth paying — the analysis at T100+ in the source session was substantively sharper than at T20.

But some of that cost is removable without losing the structural benefits. Specifically:

- The agent paid a token tax on every call for parameters that should be optional or defaulted (`thoughtNumber`, `totalThoughts`, `nextThoughtNeeded` in 90% of cases).
- The agent had no mid-session recall: when it wanted to remember what it concluded at thought N, it had to hold the conclusion in working memory or skim the chat scrollback.
- Subagent outputs landed as monolithic prose blocks in tool results; the agent then re-extracted facts and copied them into a fresh `context_snapshot` thought, paying the same token cost twice.
- The session-end audit manifest flagged 12 "decision-without-action" gaps in a research session where the entire point was to defer action until synthesis. The audit framework assumes operational tasks.
- The harness fired SessionStart task-tracking nudges 11 times during the run, each suggesting `TaskCreate` even though Thoughtbox itself was the structured tracker.

## Scope

### In Scope (this spec)

11 distinct improvements organized into four buckets:

- **Bucket A — Per-call ergonomics**: #1 auto-numbering surface, #2 terse default API, #6 cipher mode toggle.
- **Bucket B — Mid-session recall**: #3 `getThought` / `recent` / `searchWithin`, #9 named checkpoints.
- **Bucket C — Subagent integration**: #4 `subagent.attach`, #11 structured-return schemas.
- **Bucket D — Audit + harness coordination**: #5 hook suppression during active sessions, #7 deliberation-without-commitment decision frames, #8 per-session-type audit, #10 knowledge-graph persistence shortcut.

### Out of Scope

- Changes to the seven thought types (taxonomy is right).
- Changes to MCP transport / latency optimization (round-trip cost is acceptable).
- New thought types beyond what already exists.
- Web UI for live session viewing (orthogonal product surface).
- Cipher vocabulary changes (`src/resources/thoughtbox-cipher-content.ts (multi-agent section)` is fine as-is).

## Recommendations

### #1 — Surface auto-numbering in the SDK type description

**Status today**: Server-side auto-assignment **already works** (`src/thought-handler.ts:364-377`, marked `// SIL-102`). When `thoughtNumber` is undefined the handler computes it from the main-chain max.

**Why it still creates friction**:
- The Code Mode SDK type at `src/code-mode/sdk-types.ts:23` shows `thoughtNumber?: number` — technically correct (optional) but co-listed with required `nextThoughtNeeded` and `thoughtType`. The agent reads "passed in every example, listed in the type, must be tracked."
- Onboarding doc `.claude/skills/thoughtbox-onboard/SKILL.md` and the operation example at `src/thought/operations.ts:92-101` both pass `thoughtNumber: 1` in the canonical example.
- The "Gotchas" section in onboarding states: "Thought numbers must be unique per session+branch — can't reuse a number." This nudges the agent toward defensive manual tracking.

**Observed failure**: At T80 in the source session, the agent reused `thoughtNumber: 80` for a revision and got `duplicate key value violates unique constraint "thoughts_session_id_thought_number_branch_id_key"`. Lost ~30 seconds + a thought slot.

**Proposed change**:
1. Update `src/code-mode/sdk-types.ts` to comment-annotate the optional `thoughtNumber` with explicit "(server auto-assigns; only pass to revise/restart)".
2. Remove `thoughtNumber: 1` from the canonical example in `src/thought/operations.ts:92-101`. Keep `sessionTitle` to demonstrate session creation.
3. Update `thoughtbox-onboard` skill (located at `.claude/skills/thoughtbox-onboard/SKILL.md` per session reminder) Quick Start section to show calls without `thoughtNumber`.
4. Keep the gotchas warning, but reframe: "Thought numbers are server-assigned and unique per session+branch. Pass an explicit number only to restart (1) or revise."

**Effort**: 1 hour. Pure documentation/example surface.

---

### #2 — Terse default-case shorthand `tb.t(content)`

**Status today**: All thought submission goes through `tb.thought({thought, thoughtType, nextThoughtNeeded, ...})` — see `src/code-mode/sdk-types.ts:18-44`. ~85% of thoughts in the source session were `thoughtType: "reasoning"` with `nextThoughtNeeded: true` and no other typed metadata. The full envelope adds ~120 tokens per call to a string that may itself be only 200-400 tokens of actual content.

**Why it creates friction**: The agent writes the same boilerplate envelope hundreds of times per session. Token tax compounds: at 146 thoughts × ~120 boilerplate tokens = ~17,500 tokens of pure ceremony. That is roughly 5% of a 400k context window.

**Proposed change**:
Add a thin shorthand to the `tb` SDK in `src/code-mode/sdk-types.ts` and the Code Mode runtime:

```ts
interface TB {
  /** Shorthand for plain reasoning thought. Equivalent to:
   *  thought({thought: content, thoughtType: "reasoning", nextThoughtNeeded: true})
   *  Server auto-assigns thoughtNumber.
   */
  t(content: string, opts?: { sessionTitle?: string; sessionTags?: string[]; nextThoughtNeeded?: boolean }): Promise<unknown>;

  /** Shorthand for ending a reasoning chain. */
  end(content: string): Promise<unknown>; // sets nextThoughtNeeded: false

  /** Existing full-form thought() unchanged. */
  thought(input: { ... }): Promise<unknown>;
}
```

Implementation: ~20 lines added to `src/code-mode/execute-tool.ts` to expand `tb.t(...)` into the full handler call before delegating to the existing `ThoughtHandler`. No schema changes — purely a Code Mode SDK convenience.

Reserve the full-form `tb.thought({...})` for typed thoughts (`decision_frame`, `belief_snapshot`, `assumption_update`, `context_snapshot`, `progress`, `action_report`) where the metadata is the point.

**Effort**: 3-4 hours. Code Mode SDK only; no protocol or storage changes.

---

### #3 — Mid-session recall: `getThought(N)`, `recent(n)`, `searchWithin(query)`

**Status today**: `src/sessions/operations.ts:43+` defines `session_list`, `session_get`, `session_search`, `session_resume`, `session_export`, `session_analyze`, `session_extract_learnings`. Per-thought retrieval requires `session_get(sessionId)` which returns the full session blob — wasteful when the agent wants thought N from the *current* session.

**Storage layer already supports it**: `src/sessions/handlers.ts:184` uses `this.storage.getThoughts(args.sessionId)` to fetch thoughts from a session. A single-thought variant is a thin filter on top.

**Why it creates friction**: At several points in the source session (notably T70, T85, T138) the agent paused to mentally inventory what it had already concluded. Without a cheap recall primitive, the agent either holds state in working memory (lossy) or skips the recall entirely (loses signal).

**Proposed change**: Add three operations to `src/sessions/operations.ts` and corresponding handlers in `src/sessions/handlers.ts`:

1. `session_get_thought` — fetch thought by `sessionId` + `thoughtNumber` (+ optional `branchId`). Returns single thought.
2. `session_recent_thoughts` — fetch last N thoughts in the active session. Convenience over `session_get` filtering.
3. `session_search_within` — full-text search over thoughts in a *single* session, distinct from `session_search` which searches across sessions by metadata.

SDK exposure in `src/code-mode/sdk-types.ts`:

```ts
session: {
  // ... existing
  getThought(sessionId: string, thoughtNumber: number, branchId?: string): Promise<unknown>;
  recent(sessionId: string, n?: number): Promise<unknown>;
  searchWithin(sessionId: string, query: string, limit?: number): Promise<unknown>;
};
```

For Code Mode convenience, also accept *no* sessionId and operate on the current execution-context session if one is active.

**Effort**: 4-6 hours. Three handlers + storage filters + SDK type updates + tests.

---

### #4 — Subagent → parent session attachment

**Status today**: When a subagent dispatch completes, its output lands as a tool result in the parent's chat. The parent agent must then manually copy salient facts into a fresh `context_snapshot` thought (see source session T21, T24, T30, T38-39, T67 — all manual re-recordings). Agent and subagent operate on completely disjoint Thoughtbox state.

**Why it creates friction**: The parent pays the token cost twice — once to read the subagent's prose, once to re-extract structured facts. In the source session this consumed ~3,000 tokens of the parent's context for each of 3 subagent dispatches.

**Proposed change**:

1. **Pass parent session ID into subagent context**. When a parent calls the `Agent` tool with Thoughtbox context, propagate the active `sessionId` as an environment variable or initial system prompt addendum. The subagent can then optionally write to the parent's session as a special "subagent contribution" thought type or branch.

2. **Add `tb.subagent.attach` to the Code Mode SDK**:

   ```ts
   subagent: {
     /** Attach a completed subagent's structured output as a context_snapshot
      *  thought in the parent session. Caller provides the agent's task ID
      *  and a path/key into the structured return. */
     attach(args: {
       agentId: string;          // subagent task ID from Agent tool result
       asThoughtType?: 'context_snapshot' | 'belief_snapshot' | 'reasoning';
       summary?: string;         // optional condensed summary
       extractedFacts?: object;  // structured facts the subagent returned
     }): Promise<unknown>;
   };
   ```

3. **Subagent return schema**: When dispatching a subagent for Thoughtbox-aware work, the dispatcher can pass an expected structured return schema (JSON Schema). The subagent's runtime validates the return; the parent's `tb.subagent.attach` receives the validated structure and stores it directly without re-parsing prose.

This recommendation pairs with #11 (structured returns).

**Effort**: 8-12 hours. Cross-cuts Code Mode SDK + multi-agent module + Agent tool runtime contract. Highest-impact item but largest effort.

---

### #5 — Suppress task-tracking hooks during active Thoughtbox sessions

**Status today**: The harness fires SessionStart-style nudges suggesting `TaskCreate` use. In the source session this fired ~11 times across 146 thoughts, each suggesting that progress tracking might benefit from external task management.

**Why it creates friction**: Thoughtbox itself provides progress tracking via the `progress` thought type (`src/thought/tool.ts:44-48` defines `ProgressDataSchema` with `task`, `status`, `note`). The TaskCreate nudge is redundant when Thoughtbox is the active structured tracker. Each nudge consumes ~100-150 tokens and breaks reasoning rhythm.

**Proposed change**:
- Hooks that fire SessionStart-class reminders should check for an active Thoughtbox session via the OTLP/observability layer (`src/observability/`). If a session is active and has had a thought submitted in the last N minutes (e.g., 15), suppress the nudge.
- Specifically: `src/otel/` or hook configuration should expose `THOUGHTBOX_ACTIVE_SESSION_ID` as an environment hint that hooks can read.
- This is a harness/plugin change, not a Thoughtbox-server change, but it should be specified here because it affects the agent's experience using Thoughtbox.

**Effort**: 2-3 hours. Hook config + small observability hint API.

---

### #6 — Cipher mode as explicit toggle

**Status today**: Cipher notation exists (`src/resources/thoughtbox-cipher-content.ts (multi-agent section)`, exported via `session_export({format: "cipher"})` per `src/code-mode/sdk-types.ts:52`). The onboarding docs recommend switching to cipher around thought 20 for compression. **In practice, the source session never switched.** At T1 the agent planned to: "Switch to cipher notation around T30 to compress." The switch never happened across 146 thoughts.

**Why it creates friction**: Mid-flow notation switching breaks reasoning rhythm. Choosing per-thought to write in cipher vs prose is itself a cognitive cost. Without an explicit mode toggle that wraps cipher-formatting around plain content, the agent defaults to prose.

**Proposed change**: Add a `cipher: true` flag to thought submission OR a session-level `cipherMode: "auto" | "manual" | "off"` setting:

- `auto`: server detects when to compress (e.g., session > 30 thoughts) and auto-formats stored thought.
- `manual`: agent explicitly passes `cipher: true` per thought.
- `off`: prose only (current default).

Implementation in `src/thought/tool.ts` adds a `cipher` boolean. The `ThoughtHandler` either:
1. Accepts cipher-formatted content directly (server stores as-is, marks metadata `cipher: true`).
2. Auto-encodes prose into cipher if the agent passes a structured shorthand: `tb.cipher({type: "H", refs: [5, 6], content: "API latency ↑ bc db query regression"})` produces `S7|H|S5-S6|...`.

**Effort**: 4-5 hours. Mostly schema + serialization; cipher format already defined.

---

### #7 — Deliberation without commitment

**Status today**: `decision_frame` requires `options` with **exactly one** `selected: true` (validated in `src/thought/tool.ts:5-9` and in handler validation). The schema does not accept all-`selected: false`.

**Why it creates friction**: At several points in the source session (notably T13, T20, T34) the agent wanted to record "considering these options, evidence is X, leaning toward Y but not yet committed." The current schema forces premature commitment OR recasts deliberation as plain `reasoning`, losing the structural benefit of the decision_frame type.

**Proposed change**:

Option A: Relax the constraint. Allow `options` with zero or one selected. Store metadata field `decisionState: "deliberating" | "committed"`.

Option B: New thought type `deliberation` separate from `decision_frame`. Same `options[]` field, no selection requirement.

Recommend **Option A** — cleaner extension of existing type. Add `decisionState` to `OptionSchema`-adjacent metadata; downstream audit (`src/audit/manifest-generator.ts`) treats `committed` decisions as today, ignores `deliberating` ones in the gap detector.

**Effort**: 2-3 hours. Schema relaxation + audit update + tests.

---

### #8 — Per-session-type audit framework

**Status today**: `src/audit/manifest-generator.ts:178-196` (`detectGaps`) hardcodes the rule: any `decision_frame` without a following `action_report` within 5 thoughts is a gap. In the source session — explicitly a research session where action is deferred to a synthesis phase ~100 thoughts later — this fired 12 false positives.

**Why it creates friction**: The session-close manifest flags spurious gaps that an agent reading their own audit will either learn to ignore (losing signal) or chase down (wasting time).

**Proposed change**:

1. Add `sessionType` metadata at session creation: `"research" | "decision" | "implementation" | "debugging" | "exploration"`. Default to `"reasoning"` (current behavior).
2. Make `detectGaps` in `src/audit/manifest-generator.ts` route on `sessionType`:
   - `implementation` and `debugging`: keep current 5-thought decision-without-action rule.
   - `research` and `exploration`: skip the rule. Replace with research-appropriate audits:
     - Prior-revision rate (number of `assumption_update` thoughts / total).
     - Branch-merge ratio (branches created vs merged back into main).
     - Evidence citation density (`context_snapshot` thoughts with `dataSourcesAccessed` populated / total).
     - Subagent-dispatch utilization.
3. Manifest output structure adapts to session type.

The audit framework is already pluggable enough to extend (`src/audit/index.ts`, `manifest-generator.ts`).

**Effort**: 4-6 hours. Schema addition + handler routing + new gap detectors + tests + manifest format update.

---

### #9 — Named checkpoints

**Status today**: No explicit checkpoint mechanism. The source session improvised checkpoints at T13, T20, T26, T46, T70, T85, T100, T138 — manual self-reflection thoughts that read "where am I in the analysis."

**Why it would help**: A named checkpoint creates a navigable summary structure. Useful for: (a) the agent recalling its own progress mid-session, (b) export tooling rendering a session table-of-contents, (c) selective re-export of just the checkpoints as a high-signal summary.

**Proposed change**: Add `tb.session.checkpoint(label, summary?)` to the SDK. Stored as a special `progress`-type thought with metadata `{checkpoint: true, label, summary}`. Existing `progress` schema already supports the `task` + `status` + `note` triad — minimal extension.

Export tooling (`session_export`) gets a new format `"checkpoints-only"` that returns just the checkpoint summary chain.

**Effort**: 2-3 hours. SDK convenience + export filter.

---

### #10 — Knowledge-graph persistence shortcut

**Status today**: `tb.knowledge.createEntity`, `addObservation`, `createRelation` all exist (`src/code-mode/sdk-types.ts:58-65`). They are full operations requiring separate calls.

**Why it creates friction**: At T143 of the source session, the agent enumerated entities and relations that would form a useful knowledge-graph encoding of the analysis. Persisting them required a separate sequence of `tb.knowledge.*` calls — never executed because the agent was about to close the session and didn't want to add boilerplate.

**Proposed change**: Add `persistAs` field to `ThoughtData` for `belief_snapshot` and `assumption_update` types:

```ts
beliefs?: BeliefSchema;
persistAs?: {
  entity?: { name: string; type: KnowledgeEntityType; label: string };
  observations?: string[];
  relations?: Array<{ to_id: string; relation_type: KnowledgeRelationType }>;
};
```

When `persistAs` is set, `ThoughtHandler` after persisting the thought also calls into `KnowledgeHandler` to create the entity / observations / relations. Atomic transaction: if knowledge persistence fails, thought still persists with a flag indicating the knowledge persist was skipped.

**Effort**: 3-4 hours. Cross-module integration + transaction handling + tests.

---

### #11 — Structured-return schemas for subagent dispatch

**Status today**: Subagents return prose. Parent agents extract structure manually. (See #4.)

**Proposed change**: When dispatching a subagent intended to feed Thoughtbox, allow the dispatcher to pass an expected JSON Schema:

```ts
subagent.dispatch({
  prompt: "Verify three claims about JWCC Next, Anduril valuation, Lonestar funding",
  expectedReturn: {
    type: "object",
    properties: {
      claim1: { type: "object", properties: { verdict: { enum: ["VERIFIED", "PARTIALLY_VERIFIED", "REFUTED"] }, evidence: { type: "array" }, citations: { type: "array" } } },
      // ... claim2, claim3
    }
  }
});
```

The subagent's runtime validates its return against the schema before completing. Parent's `tb.subagent.attach` (#4) ingests the validated structure as typed metadata in the resulting `context_snapshot`.

**Effort**: 6-8 hours. Cross-cuts Agent runtime, multi-agent contract, Code Mode SDK. Pairs naturally with #4 and is partially covered there.

---

## Implementation Order (Suggested PRs)

| PR | Items | Effort | Dependency |
|----|-------|--------|------------|
| 1 | #1 (auto-numbering surfacing) | 1h | None — pure docs |
| 2 | #2 (`tb.t` shorthand) | 3-4h | None — Code Mode only |
| 3 | #3 (mid-session recall) | 4-6h | None — additive ops |
| 4 | #5 (hook suppression) | 2-3h | None — harness config |
| 5 | #7 (deliberation) + #9 (checkpoints) | 4-6h | None — schema additions |
| 6 | #6 (cipher mode) | 4-5h | None — cipher already exists |
| 7 | #8 (per-session-type audit) | 4-6h | None — extends audit |
| 8 | #10 (knowledge persistence shortcut) | 3-4h | None — cross-module |
| 9 | #4 + #11 (subagent attach + structured returns) | 14-20h | Last; largest scope; depends on multi-agent contract review |

PRs 1-5 are independent and can ship in parallel. PR 9 is the highest-impact item but largest effort and should land last.

Total: 39-55 hours across 9 PRs.

## Out of Scope for This Spec

- **Latency optimization**. MCP round-trip cost (~400-700ms per call) was acceptable in the source session.
- **New thought types**. The seven types are right.
- **Branch merge semantics**. Branches today are documentation; a future spec could add explicit merge-back operations, but the source session did not surface friction here.
- **Session resumption flow**. Worked seamlessly after subagent dispatches.
- **Cipher vocabulary**. The notation in `src/resources/thoughtbox-cipher-content.ts (multi-agent section)` is fine; problem is mode toggle (#6), not vocabulary.

## Validation

For each item, the validation criterion is observable in a follow-up sequential reasoning session of similar length and structure to `0eb05082-4b22-42ab-ba9c-923c6d6dacb7`:

- #1: Agent submits 100+ thoughts without ever passing `thoughtNumber` and without dup-key errors.
- #2: Agent submits 80%+ of plain reasoning thoughts via `tb.t(...)` shorthand. Token cost of boilerplate drops measurably.
- #3: Agent calls `session.getThought` or `session.recent` at least 5 times in a 100+ thought session for self-recall.
- #4: Agent dispatches a subagent and the subagent's structured output appears in the parent session as a `context_snapshot` thought without manual re-recording.
- #5: SessionStart task-tracking hooks fire ≤1 time during a multi-hour Thoughtbox session.
- #6: Agent submits 30+ thoughts in cipher mode without breaking flow.
- #7: Agent submits at least one `decision_frame` with no committed selection and the audit doesn't flag it.
- #8: Audit manifest for a research session contains research-appropriate metrics (revision rate, citation density) and zero spurious "decision-without-action" gaps.
- #9: Session export includes a checkpoint-only format with named summary points.
- #10: A `belief_snapshot` thought with `persistAs` populated produces a corresponding entity in the knowledge graph in the same transaction.
- #11: A subagent dispatched with `expectedReturn` schema produces a validated structured response that ingests cleanly via `tb.subagent.attach`.

## Provenance

This spec was authored by the agent immediately after running session `0eb05082-4b22-42ab-ba9c-923c6d6dacb7` (146 thoughts, 9 branches, 3 subagent dispatches, 25+ Exa grounding rounds, ~6 hours of structured reasoning on orbital data center economics). Every recommendation is grounded in observed friction during that session, not theoretical concerns.

The session export is at `/root/.thoughtbox/exports/0eb05082-4b22-42ab-ba9c-923c6d6dacb7-2026-04-27T02-50-02-994Z.json` for reference.

Recommendations #1, #2, #3, #4 were the agent's verbal prioritization at session end before this spec was written. #5-#11 were elaborated during spec authoring with codebase grounding.
