## Thoughtbox benchmark design brief (conceptual)

### What you should produce (instructions to the benchmark-design model)

Design **conceptual benchmarks** for the Thoughtbox MCP server (the SUT). You **do not** need to write implementation code. Focus on: what to test, how to test it, what to measure, and how to score results.

- **Do not output executable code.** Pseudocode is allowed only to clarify sequencing or request payload shapes.
- Each benchmark design must include: **setup**, **steps**, **expected outputs/invariants**, **metrics**, **pass/fail thresholds**, and **common failure modes**.
- Provide a **tiered suite** (smoke / regression / stress) and a **scoring rubric** (multi-axis or single score).

If you need extra detail, you may reference the appendix file `BENCHMARKING_CONTEXT.md` (full implementation details).

---

## System under test (SUT): what Thoughtbox does (high-level)

Thoughtbox is an MCP server that supports:

- A **reasoning ledger**: “thoughts” form a persistent session graph with **branching** and **revisions**.
- **Session persistence**: filesystem storage by default (with an in-memory option).
- **Notebook**: headless JS/TS literate programming notebooks with code execution.
- **Mental models**: a small catalog of prompt-based reasoning frameworks.
- **Observatory** (optional): real-time UI via WebSockets + optional HTTP API.
- **Knowledge graph** (optional): feature-gated JSONL + SQLite-backed entity/relation/observation store.
- **Observability**: a gateway tool for querying health/metrics/alerts/sessions; plus an optional sidecar stack that emits Prometheus metrics.

---

## External interface (what benchmarks should drive)

### Transport modes (benchmark axis)

- **HTTP (streamable MCP over `/mcp`)**: supports multiple MCP sessions via `mcp-session-id`.
- **STDIO**: single connection over stdin/stdout (simpler for single-client correctness).

### Primary MCP tools

- `thoughtbox_gateway`: the main router tool. Most benchmarks should call this.
- `observability_gateway`: query health / Prometheus metrics / alerts / session listings (no init required).

### `thoughtbox_gateway` operation gating (conceptual)

The gateway enforces stages:

- **Stage 0**: init-style operations (`start_new`, `load_context`, etc.).
- **Stage 1**: `cipher`, `session`, `deep_analysis`.
- **Stage 2**: `thought`, `read_thoughts`, `get_structure`, `notebook`, `mental_models`, `knowledge`.

Benchmark requirement: wrong-stage calls yield structured errors; correct sequences advance stages.

---

## Core behavioral contracts worth benchmarking

### 1) Stage gating and stage advancement (gateway correctness)

- Calling a Stage 2 operation before `cipher` must return a clear error that names current vs required stage and suggests the next step.
- `start_new` / `load_context` should advance stage; `cipher` should advance stage; other operations should not.

### 2) Thought ledger semantics (the core “thought” operation)

Key invariants to test (conceptually):

- **Required fields**: `thought` (string) and `nextThoughtNeeded` (boolean).
- **Auto numbering**: if `thoughtNumber` is omitted, the server assigns the next main-chain number.
- **Branch constraint**: `branchId` requires `branchFromThought`.
- **Revision semantics**: `isRevision: true` with `revisesThought` updates the revision graph and export metadata.
- **Session lifecycle**:
  - first thought auto-creates a persistent session (unless already active/resumed)
  - setting `nextThoughtNeeded=false` attempts to auto-export and close the session (with graceful behavior if export fails)
- **Concurrency**: thought processing is serialized per server instance/connection (queueing to avoid races).
- **Sampling critique** (optional): `critique: true` triggers MCP `sampling/createMessage` if the client supports it; if unsupported, thought persistence must still succeed.

### 3) Read and topology operations (`read_thoughts`, `get_structure`)

- `read_thoughts` supports several query modes (single, last N, range, branch) and must behave sensibly with/without an active session.
- `get_structure` must reflect the topology (main chain, branches, revisions) without requiring full thought text.

### 4) Session toolhost (`session`)

Conceptually verify:

- **List/search/get** correctness under large session counts (pagination + filtering).
- **Resume** restores continuation semantics (next thought appends rather than creates a new session).
- **Export** produces consistent representations (markdown/cipher/json).
- **Analyze/extract_learnings** produce objective metrics and structured artifacts.

### 5) Notebook toolhost (`notebook`)

Conceptually verify:

- Roundtrip **load/export** is lossless.
- Execution isolation between notebooks.
- Timeout/error paths (syntax error, missing file, timeouts) are safe and informative.

### 6) Mental models toolhost (`mental_models`)

Conceptually verify:

- List/count invariants (models + tags).
- Error messaging includes valid options.
- Capability graph is complete enough to bootstrap a “server capability” knowledge graph.

### 7) Optional knowledge graph (`knowledge`)

Conceptually verify across conditions:

- When disabled: calls should fail with a clear “not enabled” error.
- When enabled but dependency missing: server should degrade gracefully (knowledge remains unavailable).
- When enabled and available: CRUD + traversal + stats behave consistently; entity uniqueness rules are stable.

---

## Benchmark design matrix (recommended axes)

For each benchmark suite below, define variants across these axes:

- **Transport**: HTTP vs STDIO
- **Storage**: filesystem vs memory
- **Observatory**: enabled vs disabled
- **Knowledge**: enabled vs disabled (and “enabled but unavailable”)
- **Sampling**: supported vs unsupported by client

---

## Suggested benchmark suites (design-level)

### Suite A — Protocol + stage gating (smoke/regression)

- **A1 Wrong-stage errors**: invoke representative Stage 2 ops before `cipher`; assert structured error + suggestion.
- **A2 Correct advancement**: `start_new` → `cipher` → Stage 2 op; assert stage advancement semantics.
- **A3 Session isolation (HTTP)**: two concurrent `mcp-session-id`s should not leak stage or active session state.

### Suite B — Thought ledger semantics (regression)

- **B1 Auto numbering**: omit `thoughtNumber` across multiple thoughts; validate assigned numbers are sequential on main chain.
- **B2 Backward numbering**: explicitly send decreasing `thoughtNumber`s; validate topology + export semantics remain coherent.
- **B3 Branching**: create multiple branches from one fork; validate `get_structure` branch counts and ranges.
- **B4 Revisions**: revise earlier thought; validate export metadata indicates revision chains.
- **B5 read_thoughts modes**: last N, range, branch retrieval; validate returned ordering and counts.

### Suite C — Durability + integrity (regression/stress)

- **C1 Persistence across restart (filesystem)**: write a session, restart server, verify session listing and exports remain accessible.
- **C2 Integrity failure handling**: simulate missing/corrupt session files and ensure the server blocks load with actionable guidance.
- **C3 Export reliability**: ensure `nextThoughtNeeded=false` triggers export and “close” semantics; ensure failure does not lose session state.

### Suite D — Sampling critique (regression)

- **D1 Sampling supported**: ensure critique is returned/persisted and does not change core thought fields.
- **D2 Sampling unsupported**: ensure no failure and consistent core behavior.
- **D3 Performance impact**: measure incremental latency overhead of critique-enabled calls vs baseline.

### Suite E — Notebook (smoke/regression/perf)

- **E1 Roundtrip**: create → add cells → export → load → compare structure/content equivalence.
- **E2 Execution**: run simple JS/TS cells and verify stdout/stderr/exit code semantics.
- **E3 Isolation**: two notebooks executing similarly named files should not collide.
- **E4 Timeout**: enforce timeouts and verify safe termination and error reporting.

### Suite F — Observatory + eventing (perf)

- **F1 Overhead**: measure throughput/latency impact of observatory enabled during heavy thought throughput.
- **F2 Fan-out**: many WS clients subscribed to a session; measure broadcast latency and max-connection handling.

### Suite G — Observability + PII safety (perf/security)

- **G1 Metrics presence**: verify key protocol/tool-call metrics exist and are label-consistent.
- **G2 Latency SLOs**: define p95/p99 request and tool-call latency thresholds under load.
- **G3 PII redaction**: ensure telemetry sanitization prevents sensitive strings from appearing in exported logs/metrics.

### Suite H — Optional knowledge graph (conditional)

- **H1 Availability matrix**: disabled/enabled-but-unavailable/enabled-and-available behavior.
- **H2 Correctness**: entity creation uniqueness, relation creation, traversal depth limits, stats correctness.
- **H3 Startup cost**: measure index rebuild time as JSONL grows (scale test).

---

## Signals and measurement (design-level)

Define how each benchmark will collect evidence:

- **From tool responses**: specific response fields (e.g., `thoughtNumber`, `sessionId`, error payload keys).
- **From storage artifacts** (filesystem mode): exported session JSON presence and structure; session listings.
- **From topology queries**: `get_structure` output correctness independent of full text.
- **From Prometheus (optional)**: request rate, error rate, and latency percentiles (especially if driving traffic via the sidecar).

---

## Scoring rubric (design-level)

Recommend a scorecard with separate axes:

- **Correctness** (0–1): % of functional invariants satisfied.
- **Robustness** (0–1): % of failure-mode tests handled gracefully.
- **Performance** (0–1): normalized against SLO thresholds (p95/p99 latency, throughput).
- **Observability** (0–1): completeness of required metrics and alertability.
- **Security/Privacy** (0–1): PII safety checks pass.

Aggregate either as a weighted sum or report as a multi-axis radar chart for clarity.

---

## Appendix pointer

Use `BENCHMARKING_CONTEXT.md` only if you need implementation-level details such as:

- exact env var names/defaults, ports, and URLs
- detailed persistence layout, atomic write semantics, and resource URI catalogs
- sidecar instrumentation metric names and PromQL query examples

