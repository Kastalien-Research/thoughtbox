# Thoughtbox Agent-Usability Feedback — Claude Code, long research session

**Session**: `f94361df-0605-4ce6-a336-7f1df00ebe12` ("Anti-correlated outcomes: individual-level inversion patterns")
**Author agent**: Claude Code, Opus 4.7 (1M context)
**Length**: 146 thoughts over ~3.5 hours; 5 evolutions; 5 new knowledge entities; 8 new relations
**Method**: feedback drafted from direct experience during the session, then verified against the catalog via `thoughtbox_search` before writing. Two of the original drafted claims were refuted by verification and removed; one new bug was found during verification and added.

---

## TL;DR

1. **`thoughtType` enum is too narrow for inquiry-shaped sessions.** 144 of 146 thoughts collapsed to `reasoning` because nothing else fit. Long sessions need richer subtypes or a free-form `subtype` field.
2. **No atomic `evolve` operation.** Five revisions had to be hand-constructed with `isRevision` + `revisesThought` + `thoughtNumber` discipline; one early miscount produced a duplicate-key error.
3. **SDK calling conventions are inconsistent across operations.** `tb.thought({...named})` works; `tb.session.export({...named})` silently coerces the named-object to `[object Object]` and fails with a UUID-syntax error. (Caught live during verification — see §3.)
4. **Mid-session metadata is locked at thought 1.** No way to update `sessionTitle` or `sessionTags` once the session evolves past the original framing.
5. **`confidence` field is documented as "for decision frames" but accepted silently on other thought types.** I added it to plain `reasoning` thoughts; no error, no recorded effect.
6. **`session.analyze` reports `hasConvergence: false` without telling the agent what convergence means or how to achieve it.** Useful metric, missing user-facing definition.
7. **`session.extractLearnings` returns session metadata as the "learning," not content.** Verified against this 146-thought session: `extractedCount: 1`, content was `thoughts: 146, linearityScore: 0.97, success` — none of the actual durable findings were extracted, `sourceThoughts: []` had no thought-level provenance. Defeats the persistence-for-retrieval value prop.
8. **No prep/companion-tools advertisement.** A fresh agent has to discover via `thoughtbox_search` that catalog discovery is JS-arrow-function-over-`catalog`, that `Task*` / `WebSearch` are deferred and need `ToolSearch` first, etc. The cold-start cost is real.

---

## What I corrected after verification

I drafted feedback from session experience and then verified each claim against the catalog before writing this doc. Two original claims were refuted:

- ❌ "Session-end has no markdown export." **Wrong.** `session.export(sessionId, "markdown")` exists and works. The session-close response only returned the JSON audit-manifest path, which is what made me think markdown wasn't available; it is, just not auto-emitted at close.
- ❌ "No `tb.thought.get(N)` shorthand makes long-session retrieval awkward." **Mostly wrong.** `session.get(sessionId)` returns full thoughts, and `session.search` exists for cross-session lookup. The shorthand still wouldn't hurt, but the underlying capability is there.

The verification step itself was useful and I'd recommend any future agent doing long-form Thoughtbox feedback do the same pass. It changed two of nine items.

---

## Tier A — clear-cut (concrete file/op suggestions)

### A1. Widen `thoughtType` enum (or add free-form `subtype`)

> **Status: SHIPPED (2026-07-09, feat/agent-user-feedback-fixes).** The minimal
> suggestion was implemented: `finding`, `synthesis`, `question`, `conclusion`
> added to the enum in `src/thought/tool.ts`, `src/thought/operations.ts`,
> `src/thought-handler.ts`, `src/persistence/types.ts`,
> `src/events/thought-emitter.ts`, `src/audit/manifest-generator.ts`,
> `src/code-mode/sdk-types.ts`, and the apps/web session-view mirrors. The
> `thoughts.thought_type` CHECK constraint is extended by migration
> `supabase/migrations/20260709120000_add_inquiry_thoughttypes.sql`. The
> free-form `subtype` variant was NOT implemented.

**Where**: `src/thought/tool.ts` (Zod schema, lines ~75-78 per the `2026-04-28-systemic-flaws-audit.md` reference) and the corresponding handler validators in `src/thought-handler.ts`.

**Current enum**: `reasoning | decision_frame | action_report | belief_snapshot | assumption_update | context_snapshot | progress`.

**Symptom**: 144/146 thoughts in this session went under `reasoning` because no other type fit. The most common shapes I actually had were:
- *finding* (post-search integration of new evidence)
- *synthesis* (cross-thought consolidation, e.g., the 5-family map)
- *question* (next-step framing for the next search)
- *conclusion* (final integrative thought)

**Suggestion (minimal)**: add `synthesis`, `finding`, `question`, `conclusion` to the enum. These cover ~95% of inquiry-session shapes and don't break any existing handler logic (they need no payload validation beyond the base `thought` field, like `reasoning`).

**Suggestion (better)**: keep the current closed enum for shapes that have payload semantics, but add a free-form `subtype: string` field that's queryable but unconstrained, so future shapes don't require schema migrations. Pair with a `tb.session.search({ subtype: "finding" })` filter.

**Cost**: schema migration + Zod update + one handler arm per added type. Low.

**Priority**: high — every long session hits this on the first day.

---

### A2. Atomic `tb.thought.evolve()` operation

**Where**: new operation alongside `thoughtbox_thought` in `src/thought/`.

**Current friction**: the `thoughtbox-evolution` skill is one of Thoughtbox's most distinctive features, and it requires the agent to:
1. Pick which prior thoughts to revise (correct).
2. Construct N revision thoughts manually, each with `isRevision: true`, `revisesThought: <N>`, `thoughtNumber: <running>`, `totalThoughts`, `nextThoughtNeeded`.
3. Track the running counter across the revisions to avoid duplicate-key errors. **In this session, I miscounted once (thought 28 → 28 collision) and had to retry with thought 29.**

**Suggestion**:

```ts
tb.thought.evolve({
  revisesThought: number,
  content: string,
  reason?: string  // why this evolution was triggered
})
```

The runtime auto-handles `thoughtNumber` (next-in-sequence), `isRevision: true`, and the totals. Agent supplies only the substance.

**Bonus**: `tb.session.evolveMany([{revisesThought, content}, ...])` for the common case where one major insight triggers multiple revisions (which was my exact pattern after the codebase pass at thought 78).

**Priority**: high — evolution is a flagship feature; current ergonomics make it underused.

---

### A3. Inconsistent SDK calling conventions — UUID-string-coercion bug

**Found during verification.** I called:

```js
await tb.session.export({
  sessionId: "f94361df-...",
  format: "markdown",
  includeMetadata: true
});
```

Got:

```
"Failed to get session: invalid input syntax for type uuid: \"[object Object]\""
```

The named-object form was coerced to a string `[object Object]` and passed as the positional `sessionId` argument. Switching to positional `tb.session.export("f94361df-...", "markdown", true)` worked.

**This is a real bug**: most other ops (e.g. `tb.thought({...})`) take a named object and behave correctly. Mixing positional and object-named conventions across the SDK is a footgun, and silent coercion to `[object Object]` is the worst possible failure mode — it produces a wrong-looking type error instead of "you passed an object where a UUID was expected."

**Suggestion**:
1. Decide on one convention SDK-wide. Named-object is more agent-friendly (self-documenting at call site).
2. Add a runtime check at the start of each operation: if the first argument is an object and the operation expects a string, throw a clear error like `"tb.session.export expects positional (sessionId, format) or named ({ sessionId, format }) — received object passed as positional sessionId"`.

**Where**: SDK wrappers in `src/code-mode/sdk-types.ts` and the corresponding runtime in `src/code-mode/`.

**Priority**: high — silent string coercion of objects is the kind of bug that wastes long-session debugging time.

---

### A4. Mid-session metadata is locked at thought 1

**Current**: `sessionTitle` and `sessionTags` are settable only on the first thought.

**Symptom**: by thought 78 my session had moved past its original framing (the codebase pass changed the inquiry character substantially). I would have liked to update `sessionTags` to add `codebase-evidence` or extend the title. There's no operation to do this.

**Suggestion**:

```ts
tb.session.updateMeta({
  sessionId?: string,  // defaults to active
  title?: string,
  addTags?: string[],
  removeTags?: string[]
})
```

**Priority**: medium — works around easily by leaving stale metadata; affects retrievability of long sessions.

---

### A5. `confidence` field semantics inconsistency

**Documented**: `"Confidence level for decision frames"` — explicitly tied to `decision_frame` type.

**Observed**: I added `confidence: "high"` to many plain `reasoning` thoughts during this session. The schema accepted them silently. The audit manifest's `decisions.byConfidence` only counts `decision_frame` thoughts with confidence (which is consistent with the docs), so my `reasoning`-thought confidences are inert.

**Two reasonable fixes**:
1. **Strict**: reject `confidence` on non-decision thoughts at the schema level. Forces agents to use the right type.
2. **Liberal**: extend `confidence` semantically to all thought types and have `analyze` report confidence histograms across all thoughts. More expressive but more interpretation work downstream.

**Priority**: low — silent acceptance is the worst of both, but the field is rarely consulted, so this is a polish item.

---

### A6. `session.analyze` reports `hasConvergence: false` without definition

**Observed**: `session.analyze` returned this for my completed session:

```json
{
  "structure": { "linearityScore": 0.97, "revisionRate": 0.03, "maxDepth": 0, "thoughtDensity": 0.66 },
  "quality": { "critiqueRequests": 0, "hasConvergence": false, "isComplete": true }
}
```

`hasConvergence: false` despite `isComplete: true` and a deliberate final synthesis thought. I have no idea what the system means by "convergence" or how I would have produced it. The metric is potentially useful — agents could optimize for it — but only if its definition is exposed.

**Suggestion**: in the `session.analyze` response, include a `definitions` object that explains each metric, or document them in `thoughtbox://session-analysis-guide`. If `hasConvergence` requires (e.g.) at least one `decision_frame` with high confidence, or branching with merge, say so.

**Priority**: medium — affects the observability of the system to its own agent users.

---

## Tier B — softer / discoverability

### B1. Cold-start agent cost: catalog discovery via JS arrow function

`thoughtbox_search` takes a JS arrow function that gets executed against `catalog`. That's powerful (flexible filtering, computation over the result set) but the discovery path is itself a small puzzle for a fresh agent. Skill content helps. The actual time cost is one extra round-trip when you want the schema for an operation you haven't used before.

**Suggestion**: a lightweight `thoughtbox://operations-cheatsheet` resource that lists every operation's input schema in a flat, paste-into-prompt-able format. Pairs with the existing patterns cookbook.

### B2. The Code Mode framing requires JS-clean thought content

Hit once during this session: drafting deliverable text inside `tb.thought({thought: \`...\`})` failed when the content included `if: false` (parse error from the `if` reserved-word adjacency in template literal context). Took a retry to spot.

**Suggestion**: document this gotcha prominently in the `code-mode` skill, OR have a non-Code-Mode entrypoint where the `thought` content is passed as a pre-quoted string parameter (avoiding any chance of JS-context evaluation).

### B3. "One state-mutating operation per call" is too strict for tightly-coupled writes

The rule (in the `thoughtbox_execute` description) says only one `tb.thought` / `tb.ulysses` / `tb.theseus` per call, with read-only ops freely chainable. The rationale (response carries guidance for the next call) is good for thought-after-thought. But several times I had a thought + a `tb.knowledge.addObservation` that were one logical unit. Two calls = two round-trips and a window for orphan state.

**Suggestion**: allow `tb.thought({ ...thoughtFields, alsoObserve: [{ entity_id, content }, ...] })` as syntactic sugar that's atomic (single transaction, one network call). Keeps the one-thought-per-call rule but acknowledges that knowledge-graph updates are often the corollary, not a separate reasoning step.

### B4 (now A7). `session_extract_learnings` extracts metadata-as-signal, not content-as-learning

**Promoted to Tier A after direct verification.** I called `tb.session.extractLearnings("f94361df-...")` against this 146-thought session expecting it to surface content-level patterns. What it returned:

```json
{
  "sessionId": "f94361df-0605-4ce6-a336-7f1df00ebe12",
  "extractedCount": 1,
  "learnings": [{
    "type": "signal",
    "content": "{\"timestamp\":\"2026-04-30T07:33:47.408Z\",\"session\":\"f94361df-...\",\"signal\":\"success\",\"metrics\":{\"thoughts\":146,\"branches\":0,\"revisions\":5,\"duration\":13245695,\"linearityScore\":0.97,\"critiqueUsage\":0}}",
    "targetPath": ".claude/rules/evolution/signals.jsonl",
    "metadata": { "sourceSession": "...", "sourceThoughts": [], "extractedAt": "..." }
  }]
}
```

Three concrete defects:

1. **`extractedCount: 1` for a 146-thought research session.** The session contained named, durable findings (the layered-priors model, the substitution-of-understanding-for-commitment claim, the agent-fakery principal-agent reframe). None were extracted as learnings. Only a session-level success signal was.
2. **The "learning" is session metadata, not learning content.** The signal payload is `thoughts: 146, linearityScore: 0.97, success` — useful for fitness tracking, but no one would look at this and say "that's the session's takeaway."
3. **`sourceThoughts: []` — empty array, no thought-level provenance.** Even the metadata-signal "learning" doesn't link back to specific thoughts. So a future session can't trace which moments produced the signal.

This confirms and sharpens `claude-chrome-001.md`'s "raw JSON blobs, not human-readable prose" complaint. It's not just about formatting — the extraction is operating on session metadata, not on the actual reasoning content.

**Suggestion**:

1. Rename or split: the current behavior is `tb.session.extractFitnessSignal()`. Promote a separate `tb.session.extractLearnings()` that operates on content (thoughts, evolutions, knowledge entities created during the session) and produces human-readable prose paragraphs with thought-number citations.
2. The content-extracting version should at minimum populate `sourceThoughts` with the thought numbers each learning is derived from.
3. For inquiry-shaped sessions specifically, the right output is something close to: 3-7 sentence summaries of distinct findings, each with `[thought N, thought M]` source attribution. The session's existing `synthesis`/`integration` thoughts (or `reasoning` thoughts containing the word "synthesis", per the workaround for A1) are the natural input.

**Priority**: high. The whole point of structured reasoning persistence is to make the reasoning retrievable later. Returning only session metadata as the "learning" defeats that purpose for inquiry sessions, which are the long-tail use case.

---

## Tier C — design-conversation items (not bugs)

### C1. `thoughtbox_search` over `catalog` is genuinely good

Counterweight to the friction list: writing JavaScript that filters/maps the catalog is more powerful than a typed query DSL, especially when you don't yet know the shape of what you're looking for. The discovery cost is paid once per agent; the flexibility is permanent. Don't simplify this away.

### C2. The `evolution` skill pattern is ahead of its tooling

The A-Mem-style "check which prior thoughts should evolve when a new insight lands" is exactly the kind of thing knowledge graphs can't do without it. The skill's pattern is right; the operation surface (manual revision construction) is what makes it costly. A2 addresses this.

### C3. Audit manifest at session close is good and useful, but the JSON path alone is the wrong handoff

When the session closed (`nextThoughtNeeded: false`), the response gave me an `exportPath` to a JSON audit manifest. For machine-to-machine handoff that's right. For agent-to-user handoff (where the agent presents the session result to the human), markdown would be the better default. Right now the markdown export requires a separate `session.export` call that the agent has to know to make.

**Suggestion**: at session close, also auto-emit a markdown export to a parallel path, OR include `markdownPath` in the close response. This is essentially what was wrong with my original "no markdown export" claim — the capability is there, but it's not the default close-time artifact, and nothing in the close response advertises it.

---

## Top three to ship first

1. **A7 — fix `extractLearnings` to operate on content, not session metadata.** The whole reasoning-persistence value prop is broken if the only thing extracted from a 146-thought session is `linearityScore: 0.97`. Either rename the current behavior (it's a fitness signal, not a learning) and ship a new extractor, or rewrite the existing one to read thought content + knowledge entities and produce prose summaries with thought-number citations.

2. **A1 — widen the `thoughtType` enum or add `subtype`.** Every long session hits this on the first day, and the workaround (collapsing everything to `reasoning`) actively undermines the audit and analyze layers below it. The structural-analysis ratios reported by `session.analyze` are computed against thought types, and when 99% of thoughts are one type, the ratios are uninformative. (A7 also benefits — content extraction is much easier when synthesis-type thoughts are typed as such.)

3. **A3 — fix the named-vs-positional argument coercion bug.** Silent `[object Object]` coercion is the kind of bug that wastes hours of agent-debugging time when it hits.

A1 + A7 are mutually reinforcing: better thought typing makes content extraction tractable; content extraction gives the typing payoff downstream.

---

## Process meta-note

This document was drafted from session experience and then verified against the catalog before writing. Two claims were refuted in verification (markdown export exists; thought retrieval is mostly available via `session.get`). One new bug was caught during verification (A3, the calling-convention coercion). I'd recommend the same draft-then-verify process for any future agent-feedback document — the verification step caught material errors that would have been embarrassing in a final delivery.

The exploratory verification was 4 calls totaling ~10 seconds. Cheap relative to the cost of getting the feedback wrong.
