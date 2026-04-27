# Spec: Terse Shorthand: `tb.t()` and `tb.end()`

## Title
Terse Shorthand Methods for Common Thought Patterns

## Status
Draft

## Target State

### Core Shorthand Methods
The `tb` (Thoughtbox) SDK exposes two convenience methods that cover the most common thought patterns. Both return `Promise<Thought>` — the canonical server-persisted thought type defined in Spec 01 (`ThoughtInput` / `Thought` hierarchy) and Spec 03.

#### `tb.t(content: string): Promise<Thought>`
Submits a plain reasoning thought with:
- `thoughtType: "reasoning"`
- `nextThoughtNeeded: true`

Equivalent to:
```typescript
tb.thought({
  thought: content,
  thoughtType: "reasoning",
  nextThoughtNeeded: true
});
```

#### `tb.end(content: string): Promise<Thought>`
Submits a final thought that ends the current thought chain with:
- `thoughtType: "reasoning"`
- `nextThoughtNeeded: false`

Equivalent to:
```typescript
tb.thought({
  thought: content,
  thoughtType: "reasoning",
  nextThoughtNeeded: false
});
```

The `tb.t()` / `tb.end()` shorthands on the main `tb` instance and the same-named methods on `ThoughtChain` (see Chain API below) have **identical signatures, identical return types, and identical persistence semantics**. The chain-bound versions resolve `sessionId` from the chain's captured session; the `tb`-instance versions resolve it from the ambient execution context (or throw `NoActiveSessionError` if none).

### Usage Examples
```typescript
// Chain of reasoning thoughts
await tb.t("The data suggests three possible approaches.");
await tb.t("Option A is fastest but riskiest.");
await tb.end("I'll proceed with Option B as a balanced choice.");

// Short deliberation
await tb.t("Is this edge case worth handling now?");
await tb.end("Deferring to reduce scope.");
```

### Method Availability
These methods are available on:
- The main `tb` instance: `tb.t()`, `tb.end()`
- A `ThoughtChain` returned from `tb.think()` (or sibling factories `tb.decide()`, `tb.research()`, etc.): `chain.t()`, `chain.end()`, `chain.thought(...)`

---

## Chain API: `ThoughtChain` Type and Persistence Model

### Factory Methods

`tb.think()`, `tb.decide()`, and `tb.research()` are convenience wrappers over the underlying `tb.session.create()` primitive. They differ from each other only in their default `sessionType` (Spec 08); otherwise equivalent:

```typescript
// These two are equivalent:
const chain1 = await tb.think({ sessionTitle: "Analysis" });
const chain2 = await tb.session
  .create({ sessionTitle: "Analysis", sessionType: "exploration" })
  .then(session => tb.session.openChain(session.id));
```

Callers wanting a session type not covered by the named factories should use `tb.session.create({ sessionType: "..." })` directly (see Spec 08 for the full enum) and call `tb.session.openChain(sessionId)` to obtain a chain. The named factories exist purely as ergonomic shorthands for the most common cases.

The factory signatures:

```typescript
interface TB {
  /**
   * Open a thought chain bound to a new (or specified) session.
   * Default sessionType: "exploration".
   */
  think(opts?: ThinkOpts): Promise<ThoughtChain>;

  /**
   * Open a thought chain optimized for decision-making.
   * Default sessionType: "decision".
   */
  decide(opts?: ThinkOpts): Promise<ThoughtChain>;

  /**
   * Open a thought chain optimized for research.
   * Default sessionType: "research".
   */
  research(opts?: ThinkOpts): Promise<ThoughtChain>;
}

interface ThinkOpts {
  /** Resume existing session by ID. If omitted, a new session is created. */
  sessionId?: string;
  /** Title for the new session. Ignored when sessionId is provided. */
  sessionTitle?: string;
  /** Tags for the new session. Ignored when sessionId is provided. */
  sessionTags?: string[];
  /** Override the factory's default session type (Spec 08). */
  sessionType?: SessionType;
  /** Cipher mode for the new session (Spec 06). */
  cipherMode?: CipherMode;
  /** Per-session activity timeout for hook suppression (Spec 05). */
  activityTimeoutMs?: number;
}
```

### `ThoughtChain` Interface

```typescript
interface ThoughtChain {
  /** Identifier of the underlying session. Captured at chain creation. */
  readonly sessionId: string;

  /** True after end() has been called on this chain instance. */
  readonly closed: boolean;

  /** Submit a reasoning thought (thoughtType: "reasoning", nextThoughtNeeded: true).
   *  Persists immediately via per-call server roundtrip.
   *  Throws ChainClosedError if called after end(). */
  t(content: string): Promise<Thought>;

  /** Submit a final thought (thoughtType: "reasoning", nextThoughtNeeded: false)
   *  and mark the chain closed. Subsequent t/end/thought calls throw.
   *  Returns the persisted final thought. */
  end(content: string): Promise<Thought>;

  /** Submit an explicitly-typed thought. Persists immediately.
   *  Throws ChainClosedError if called after end(). */
  thought(input: ThoughtInput): Promise<Thought>;
}

/** Thrown when a chain method is called after end(). */
class ChainClosedError extends Error {
  readonly sessionId: string;
  readonly attemptedOperation: "t" | "end" | "thought";
}
```

### Persistence Model

The `ThoughtChain` is a **stateless facade** over the underlying session:

1. **Per-call server roundtrip.** Every `chain.t(...)`, `chain.end(...)`, and `chain.thought(...)` is its own server write. There is no client-side buffering, no batching, no flush semantics, no transactional commit boundary.

2. **No client-side state beyond `sessionId` and `closed`.** The chain object is a thin handle. If the chain object is garbage-collected mid-session, no thoughts are lost — the session continues to exist server-side and can be resumed via `tb.think({ sessionId })`.

3. **Connection drops are recoverable.** A failed `chain.t()` returns a network error. The agent can retry the same call, or call `tb.think({ sessionId: chain.sessionId })` to obtain a fresh chain bound to the same session. Previously-persisted thoughts are unaffected.

4. **Concurrent chains on the same session are allowed but discouraged.** If two chains both write to the same session, server-side auto-numbering (Spec 01) serializes writes safely. Ordering between concurrent writers is server-receive-time, not client-issue-time. Most callers should hold a single chain per session.

5. **`end()` is one-shot per chain instance.** First call submits the final thought with `nextThoughtNeeded: false` and sets `closed: true`. Second and subsequent calls throw `ChainClosedError`. Callers wanting "submit final or no-op" should check `chain.closed` before calling.

6. **`closed: true` is per-chain-instance, not per-session.** Calling `end()` on one chain does not prevent another chain (held by another reference) from continuing to write to the same session. The session's `nextThoughtNeeded: false` flag does signal session completion server-side, but session re-opening is governed by the session API (`tb.session.resume()`), not the chain's `closed` state.

### Why Stateless

A stateless facade matches the rest of the SDK's per-call persistence model and avoids surprising failure modes:

- A long-running reasoning session may span subagent dispatches (Spec 04), retries, and even client process restarts. Per-call persistence means none of those events lose work.
- Buffering or transactional semantics would add complexity (when does a buffer flush? what if it overflows? how is ordering preserved across concurrent calls?) without clear benefit. Reasoning workloads are not latency-sensitive in the way that, say, real-time gaming is — a 400 ms server roundtrip per thought is acceptable.
- Explicit transactional shapes ("all thoughts in this chain commit atomically or none") are a different feature and should be specified separately as `tb.transaction(...)` if needed. They are out of scope for this spec.

### Usage Examples

```typescript
// Open a chain for an exploration session
const chain = await tb.think({ sessionTitle: "Refactor strategy" });

await chain.t("Three approaches: incremental, big-bang, or hybrid.");
await chain.t("Incremental is safest but slowest.");
await chain.t("Big-bang risks regressions but lands faster.");
await chain.end("Going hybrid: incremental for the data layer, big-bang for the UI.");

// Resume an existing session via a new chain
const resumed = await tb.think({ sessionId: chain.sessionId });
await resumed.t("Followup observation after sleeping on it.");

// Sibling factory for a decision-typed session
const decision = await tb.decide({ sessionTitle: "DB choice" });
await decision.thought({
  thought: "Comparing Postgres vs DynamoDB",
  thoughtType: "decision_frame",
  options: [{ label: "Postgres" }, { label: "DynamoDB" }],
  decisionState: "deliberating",
  nextThoughtNeeded: true,
});
```

---

## Design Rationale

The vast majority of thoughts in typical sessions are plain reasoning steps: brief observations, analyses, or continuations of a chain. Requiring the full `thought()` call with explicit `thoughtType` and `nextThoughtNeeded` flags adds friction without providing value in these common cases. The `tb.t()` shorthand reduces keystrokes and cognitive overhead for the 80% case.

The `tb.end()` method explicitly marks the end of a thought chain, providing a clean terminal action without requiring the user to construct a full thought object with `nextThoughtNeeded: false`.

---

## Validation

1. **Signature Correctness**: `tb.t("x")` produces identical server payload as `tb.thought({ thought: "x", thoughtType: "reasoning", nextThoughtNeeded: true })`
2. **Signature Correctness**: `tb.end("x")` produces identical server payload as `tb.thought({ thought: "x", thoughtType: "reasoning", nextThoughtNeeded: false })`
3. **Chain Integration**: `chain.t()`, `chain.end()`, `chain.thought()` are available on the value returned from `tb.think()`, `tb.decide()`, `tb.research()`
4. **Type Safety**: TypeScript infers return type as `Promise<Thought>` for `t()`, `end()`, and `thought()`
5. **Per-Call Persistence**: Each chain method call results in exactly one server-side thought write before resolving
6. **Stateless**: Garbage-collecting the `ThoughtChain` object does not affect the underlying session; thoughts already submitted remain persisted
7. **Concurrent Safety**: Two chains bound to the same session can write concurrently; server-side auto-numbering serializes them without client coordination
8. **Closed Chain Errors**: Calling `t()`, `end()`, or `thought()` after `end()` on the same chain instance throws `ChainClosedError` with `attemptedOperation` populated
9. **Session Resume**: `tb.think({ sessionId: chain.sessionId })` returns a fresh chain bound to the same session, even if the prior chain was closed
10. **Factory Defaults**: `tb.think()` defaults to `sessionType: "exploration"`, `tb.decide()` to `"decision"`, `tb.research()` to `"research"`
