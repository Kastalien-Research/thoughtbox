---
title: Reasoning Channels — Streaming Thoughtbox Sessions to External Watchers
status: draft
date: 2026-04-28
---

# Reasoning Channels

A proposal for emitting Thoughtbox session events as a stream that external agents and processes can subscribe to via the Claude Code `claude/channel` capability.

## Summary

Today, a Thoughtbox session is a private artifact: an agent reasons by calling `thought()`, the result is persisted server-side, and nothing else in the agent's environment sees the reasoning until the agent itself reports back. This proposal makes session events public-by-default within a session: each thought, branch, revision, decision, and lifecycle transition is emitted as a structured event on a `claude/channel` that a second agent or process can subscribe to and react to in real time.

The result is a new class of capabilities — citation auditors, validator binders, branch dispatchers, knowledge-graph maintainers — that operate on reasoning *as it is produced*, not after the fact. The architectural shift is from "reasoning as a private monologue" to "reasoning as a typed event stream."

## Motivation

### The current cost of careful reasoning

In a single-agent Thoughtbox session, every claim the agent makes carries a verification debt. If the agent cites `McpHub.ts:65-79`, the right thing to do is to fetch those exact lines and confirm the claim before the next thought builds on it. In practice, this happens rarely: the verification work consumes context window space, interrupts reasoning flow, and competes with the next thought for the agent's attention.

The result is a well-known failure mode: agents produce confident reasoning chains that compound on unverified premises. The error often becomes visible only at review time, after a chain of dependent thoughts has been built on top of it.

### The structural cause

The single-agent architecture forces *generation* and *verification* into the same context window. These are different cognitive shapes:

- **Generation** wants long uninterrupted runs, freedom to explore, high token throughput
- **Verification** wants tight observe-act loops, short reactive cycles, strict pass/fail discipline

When the same context handles both, neither gets done well. The agent either over-verifies (slow, distracted) or under-verifies (fast, error-prone).

### The structural opportunity

Thoughtbox already produces structured events internally. Each `thought()` call has a type (`reasoning`, `decision_frame`, `belief_snapshot`, etc.), a session ID, optional branch metadata, and timestamped persistence. The session export at terminal state already serializes the full chain. **The events exist; they are just not addressable from outside the producing agent's session.**

The Claude Code `claude/channel` capability ([docs](https://code.claude.com/docs/en/channels.md), v2.1.80+) provides exactly the missing primitive: an MCP server can push notifications into a Claude session and receive replies, giving us bidirectional event streaming between an agent and an external process.

## Proposal

### The two-agent pattern

A Thoughtbox-using session contains two agents:

- **Thinker (T)** — has Thoughtbox tools. Reasons normally; produces thoughts, branches, decisions, ulysses sessions, notebook cells. T does not need to know W exists.
- **Watcher (W)** — has a channel-aware MCP that subscribes to T's session events. W consumes events as they are emitted, runs each through a configurable policy, and acts: posts an observation back into the conversation, runs a tool, writes a file, dispatches a subagent, updates a knowledge graph.

The asymmetry is essential. T is generative; W is reactive. They are independently paced. T is not blocked on W; W is not blocked on T. The coupling is event-based, not call-based.

### Event types to emit

Each Thoughtbox state-mutating operation should produce an event:

| Event | When | Payload |
|---|---|---|
| `thought.created` | After `thought()` succeeds | `{ sessionId, thoughtNumber, type, content, branchId?, isRevision?, revisesThought?, confidence?, agentId? }` |
| `thought.revised` | After a revision | `{ sessionId, thoughtNumber, revisesThought, oldContent, newContent }` |
| `branch.created` | First thought with new `branchId` | `{ sessionId, branchId, branchFromThought }` |
| `session.opened` | First thought of new session | `{ sessionId, title, tags, agentId? }` |
| `session.closed` | Terminal state reached | `{ sessionId, terminalState?, exportPath, auditManifest }` |
| `notebook.cell_validated` | After `notebook.validate()` | `{ notebookId, cellId, snapshotHash, verdict, evidence }` |
| `ulysses.outcome` | After `ulysses.outcome()` | `{ sessionId, observed, validatorVerdict, sStateTransition }` |
| `theseus.checkpoint` | After `theseus.checkpoint()` | `{ sessionId, diffHash, approved, feedback? }` |

Events are append-only and ordered per-session. A subscriber is guaranteed event ordering within a session but not across sessions.

### The channel contract

Thoughtbox declares the `claude/channel` capability and exposes a single channel: `thoughtbox/events`. Subscribers receive every event from any session active in the current Claude Code conversation.

Reply tools — for two-way coupling — let a subscriber influence T's environment without speaking to T directly:

- `post_observation(sessionId, thoughtNumber, content, severity)` — adds a structured note that T can choose to read at thought boundaries (delivered as a tool result, not as an interjection mid-thought)
- `request_pause(sessionId, reason)` — flags a session as "needs review"; T's next `thought()` call returns a notice
- `attach_evidence(sessionId, thoughtNumber, evidence)` — adds machine-readable evidence that T's later thoughts can reference

Subscribers without reply tool privileges are read-only watchers (auditors, loggers, knowledge-graph maintainers). Subscribers with reply tool privileges are gated by an explicit `subscribers.allow` list in the Thoughtbox config.

### MVP: the citation auditor

The first concrete implementation. ~100 LOC of code; demonstrates the entire pattern.

**The watcher policy**:

```
on event(thought.created):
  for each (file_path, line_range) cited in thought.content:
    if file does not exist or line range out of bounds:
      post_observation(sessionId, thoughtNumber, "BAD CITATION: <details>", severity="error")
    else if line_range content doesn't structurally support the claim:
      post_observation(sessionId, thoughtNumber, "WEAK CITATION: <details>", severity="warning")
    else:
      remain silent
```

The "structurally support" check is intentionally simple: does the claim mention an identifier that appears in the cited lines, or a string match? More sophisticated semantic verification can be added later. The MVP catches the most common failure (file:line numbers that no longer point to the claimed thing) which is the failure that compounds the worst.

**Success criterion for the MVP**: in a real reasoning session of >20 thoughts with >10 citations, the auditor catches at least one incorrect citation that the producing agent would have built on. If true, the architecture's value case is established and the watcher pattern can be extended to other policies.

## What this enables

Beyond the MVP, the same channel contract supports a family of watchers, each unlocking capabilities not accessible from any current architecture:

1. **Real-time epistemic auditing** (the MVP, generalized) — watchers that verify any claim the agent makes against an external source of truth: file:line citations, API documentation, prior session conclusions, knowledge-graph entries.

2. **Concurrent execution offload** — T writes "I should run the validator with this candidate." W detects the candidate is well-formed, runs the validator, posts the result. T's next thought references the result without ever stopping reasoning.

3. **Speculative pre-fetching** — T's reasoning signals what it's about to want ("the next step is examining how X interacts with Y"). W detects this mid-thought, pre-reads the file, attaches evidence so T's next thought has the result already available.

4. **Branch in parallel** — T writes a `branchFromThought`. W detects the branch and dispatches a fresh subagent to explore the alternate branch in its own context. T continues the main branch. Both branches converge back into T's view via `attach_evidence`.

5. **Live invariant enforcement** — T runs a Ulysses session with a planned action. W binds the validator cell automatically and runs candidates through it as T produces them. `ulysses.outcome` events feed back into the gating loop without T manually invoking outcome each time.

6. **Knowledge graph maintenance** — As T reasons across multiple sessions, W populates a graph of entities, relations, claims, and evidence. Future T sessions query the graph instead of re-deriving. Compounding without summarization loss.

The common thread: T's context stays high-density. W absorbs the noise of file lookups, tool invocations, validation runs, and side-effects, feeding back only what's relevant.

## Economic argument

In a single-agent session, a 30-thought chain that touches 50 file:line citations costs ~50 file reads × ~5–50 lines each in T's context window. The reasoning-to-noise ratio degrades fast. Half of T's context is verification artifacts, not reasoning.

With a citation auditor watcher, T cites a file:line, W reads it, and if correct, W stays silent. T's window sees the 30 thoughts plus only the rebuttals — the cases where T was wrong. **The reasoning density of T's context goes up by an order of magnitude.**

This changes what is tractable:

- A chain that today fits T's 1M context as "reasoning + verification + tool noise" becomes "reasoning only" — the same window holds 5–10× more pure reasoning
- Multi-day investigations that today require summarization (with information loss) can become continuous chains because W maintains a knowledge-graph sidecar T queries on demand
- Off-track reasoning costs drop sharply: today T can spend 20 thoughts building on a wrong premise; W can flag it on thought 3

The cost of W is the cost of an additional MCP server and (optionally) an additional model context. W's context is short and structured — it processes one event at a time, doesn't carry the reasoning history, and can be a smaller/cheaper model or even a deterministic checker for bounded cases. The economics favor offloading verification to W for any non-trivial reasoning task.

## Risks

Six failure modes the contract between T and W must be designed around:

1. **Distillation drift** — If W summarizes T's thoughts and feeds the summary back, the summary becomes operational truth. *Mitigation*: W never summarizes T's reasoning back to T; W only adds NEW information (verifications, results, rebuttals). T's record of its own thinking stays canonical.

2. **Race conditions** — W's reactions arrive mid-thought, T's reasoning chain references events out of order. *Mitigation*: W's reply-tool outputs are queued and delivered to T at thought boundaries (between `thought()` calls), not mid-stream.

3. **Manipulation surface** — A malicious W could steer T's reasoning by selectively posting observations. *Mitigation*: privilege levels — read-only watchers (audit, log) versus read-write watchers (citation, validator), the latter requiring explicit allowlist in Thoughtbox config.

4. **Attribution blur** — When W triggers an action based on T's thought, audit trail is unclear about who decided. *Mitigation*: action logs include both T's triggering thought and W's policy that fired, so the chain is traceable.

5. **Premature convergence** — T learns to write thoughts that survive W's checks rather than thoughts that explore. *Mitigation*: W's interjections are non-blocking and dismissable, so T can ignore W when exploring versus heed W when committing.

6. **Cognitive externalization debt** — T relies on W to verify, T atrophies the verification habit, T is worse than baseline when W is unavailable. *Mitigation*: W helps T build verification primitives that survive the channel — validator notebooks, knowledge-graph entries, pinned predicates — so the value compounds even when W is offline.

## Alternatives considered

**Hooks.** Claude Code already supports `PostToolUse` hooks that fire on tool calls. A hook could fire on every Thoughtbox call, parse the result, and act. *Why insufficient*: hooks see only the tool's input/output, fire once per tool call (no streaming), and cannot use other MCP tools in their reaction (only shell commands). They are too thin a primitive for the watcher patterns described here.

**Subagent dispatch.** T could fire off a subagent at key moments to verify or explore. *Why insufficient*: dispatch is request-response. The subagent runs to completion and returns; it cannot observe T's reasoning as it forms. The verification is post-hoc, not real-time.

**Polling wrapper.** A wrapper MCP could poll Thoughtbox for new thoughts and forward them. *Why partial*: works today without changes to Thoughtbox, but is chattier than necessary, has higher latency than push events, and doesn't formalize the protocol. Acceptable as an interim implementation while the native channel is being built; not the long-term shape.

**One-way emission only (no reply tools).** Emit events but provide no way for W to influence T. *Why partial*: useful for logging and auditing only. Loses the highest-value capabilities (concurrent execution offload, speculative pre-fetch, branch dispatch) which all require W to feed information back into T's environment.

## Open questions

1. **Reply-tool delivery shape.** Should W's `post_observation` calls appear to T as: (a) a tool result inline in the chat, (b) an injection into T's next `thought()` call's response payload, or (c) a separate "watcher channel" T queries on demand? Each has different attention dynamics.

2. **Trust model.** When third-party watchers gain action capability, what's the consent model? Per-session opt-in? Manifest-declared scopes? Cryptographic signatures on watcher policies?

3. **Watcher composition.** Multiple watchers will subscribe to the same channel. How are conflicting observations resolved? First-write-wins? Aggregator coalescer? Priority ordering?

4. **Cross-session vs intra-session events.** Should a watcher see events only from sessions in the current Claude Code conversation, or from all of T's sessions historically? The latter enables cross-session compounding but expands the trust surface.

5. **Backpressure.** If T produces thoughts faster than W can process events, what happens? Drop events? Block T? Buffer with a bounded queue? The right answer depends on whether watchers are doing latency-sensitive work (citation verification: drop is bad) or compounding work (knowledge-graph population: drop is fine if persisted).

## Path to adoption

**Phase 1 — Wrapper proof-of-concept.** A standalone MCP that fronts Thoughtbox, forwards every operation, and broadcasts events on its own channel. Two agents in one Claude Code session: one with the wrapper MCP, one with the citation-auditor watcher policy. ~100 LOC total. Validates the architecture without requiring changes to Thoughtbox.

**Phase 2 — Native channel capability in Thoughtbox.** Thoughtbox declares `claude/channel`, emits events directly, eliminates the wrapper. The protocol stabilizes based on lessons from Phase 1.

**Phase 3 — Watcher ecosystem.** Multiple watchers ship as installable policies: citation auditor, validator binder, knowledge-graph maintainer, branch dispatcher, ulysses-outcome enforcer. Each is a thin MCP server that subscribes to the Thoughtbox channel and implements one policy. Users compose the watcher set their work calls for.

## The deeper shift

This proposal stops treating agent context as private. Once reasoning is a structured stream, anything that subscribes can be a participant. The architecture stops being "agent + tools" and becomes **"reasoning core + composable watchers."** The agent-tool dichotomy dissolves; the smart monolith becomes a thinking process surrounded by listeners, each handling a slice of "what the thinking process needs."

That shift is the agentic equivalent of the move from `printf` debugging to structured logging. Today's reasoning is `printf` — emitted to its own private context, consumed only by its producer. The streaming-channel architecture is `structlog` — emitted to a typed bus, consumed by anything that subscribes. The downstream ecosystem is built incrementally because the producer doesn't have to know about the consumers.

Thoughtbox is uniquely positioned to be the first reasoning system built around this shape. The events are already structured. The persistence already exists. The missing piece is the channel.
