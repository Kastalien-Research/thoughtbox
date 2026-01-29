## Thoughtbox benchmarking context (LLM input)

> **Note:** If you want a shorter, design-only prompt for an expensive reasoning model, use `BENCHMARKING_CONTEXT_CONCEPTUAL.md`.
>
> This file is the **detailed appendix** (implementation-level context) that you can provide only when needed.

### What this document is

This file is a **ground-truth, code-derived briefing** of the Thoughtbox server so that an advanced reasoning model can generate a **benchmark suite** (correctness + robustness + performance + observability) for evaluating Thoughtbox.

### How to use this document (instructions to the benchmark-writing model)

You are designing **benchmarks** for the Thoughtbox MCP server (the “SUT”). You do **not** need to generate full benchmark code; focus on **conceptual benchmark designs** that are grounded in the server’s behavior and interfaces described below.

**Do not output executable code.** Pseudocode is allowed only when it clarifies sequencing or payload shapes.

Produce a benchmark plan that is:

- **Actionable**: every benchmark has a concrete procedure, required environment, and expected outputs or pass criteria.
- **Measurable**: define metrics, how to collect them, and acceptance thresholds.
- **Reproducible**: deterministic harness where possible; document seeds, dataset sizes, and concurrency settings.
- **Tiered**: include smoke/regression/stress tiers (and include early-exit logic where sensible).
- **Security/Privacy aware**: do not require real secrets; include PII/redaction checks where relevant.

Your output must include:

- **Benchmark suite overview** (tables): name, purpose, tier, and what it measures.
- **Benchmark specs** (design-level): for each benchmark: setup → steps (as descriptions and sample request payload shapes) → expected outputs/invariants → metrics → pass/fail thresholds → common failure modes.
- **Fixtures (design-level)**: describe minimal “golden” sequences (forward/backward/branch/revision), notebook fixtures, optional knowledge fixtures—no code required.
- **Collection plan (design-level)**: what signals to collect (e.g., response fields, filesystem artifacts, Prometheus queries via sidecar), without implementing collectors.
- **Scoring / rubric**: how to aggregate results into a single score (or multi-axis scorecard).

### Safety note (secrets)

This repository contains a local MCP config file `.mcp.json` that includes API keys/tokens. **Do not copy those values into any benchmark artifacts or documentation.** Benchmarks should run without any third-party keys.

---

## SUT overview

### What Thoughtbox is

Thoughtbox is an **MCP server** that provides tools/resources/prompts for:

- **Structured reasoning** as a persistent “reasoning ledger” (thought chains with branching and revisions).
- **Session persistence** to local storage (filesystem by default).
- **Notebook** execution for literate programming (JS/TS).
- **Mental models**: a small registry of structured reasoning prompts.
- **Observatory**: a real-time UI via WebSockets + an optional HTTP API for watching sessions.
- **(Optional) Knowledge graph** memory: JSONL + SQLite index (feature-gated).
- **Observability gateway** for querying Prometheus/Grafana/health.

### Primary external interface

The primary tool surface (as currently implemented) is **two MCP tools**:

- `thoughtbox_gateway`: the **always-available** router; most benchmarks should call this.
- `observability_gateway`: query observability data (metrics, alerts, health, sessions).

Prompts and resources are also registered (see below).

---

## Deployment and runtime configuration (verified env vars)

### Transport modes

Thoughtbox can run over:

- **Streamable HTTP** (default): Express server with `/mcp`.
- **STDIO**: MCP over stdin/stdout.

Verified env vars:

- `THOUGHTBOX_TRANSPORT`: `"http"` (default) or `"stdio"`.
- `HOST`: bind host for HTTP server (default `"0.0.0.0"`).
- `PORT`: HTTP port (default `1731`).

### Storage backends

Verified env vars:

- `THOUGHTBOX_STORAGE`: `"fs"` (default) or `"memory"`.
- `THOUGHTBOX_DATA_DIR`: data directory (if unset, server chooses a writable candidate; in Docker it prefers `/data/thoughtbox`).
- `THOUGHTBOX_PROJECT`: project namespace for storage isolation (default `"_default"`).

### Thought logging

Verified env var:

- `DISABLE_THOUGHT_LOGGING`: if `"true"`, suppresses formatted thought output to stderr.

### Observatory (real-time UI + WebSocket server)

Verified env vars:

- `THOUGHTBOX_OBSERVATORY_ENABLED`: `"true"` enables observatory; otherwise disabled.
- `THOUGHTBOX_OBSERVATORY_PORT`: numeric (default `1729`).
- `THOUGHTBOX_OBSERVATORY_CORS`: comma-separated origins (default `*`).
- `THOUGHTBOX_OBSERVATORY_PATH`: WebSocket path (default `"/ws"`).
- `THOUGHTBOX_OBSERVATORY_MAX_CONN`: numeric (default `100`).
- `THOUGHTBOX_OBSERVATORY_HTTP_API`: set to `"false"` to disable observatory HTTP API; otherwise enabled.

### Optional subsystems

Verified env vars:

- `THOUGHTBOX_EVENTS_ENABLED`: `"true"` enables external JSONL event emission.
- `THOUGHTBOX_EVENTS_DEST`: `"stderr" | "stdout" | <filepath>` destination for events (default `"stderr"`).
- `THOUGHTBOX_KNOWLEDGE_ENABLED`: `"true"` attempts to initialize the knowledge graph storage; failures are logged and the server continues without it.

### Observability gateway configuration

Verified env vars:

- `PROMETHEUS_URL`: Prometheus base URL (default `http://prometheus:9090`).
- `GRAFANA_URL`: Grafana base URL (default `http://localhost:3001`).

---

## MCP transport details (for harness design)

### Streamable HTTP `/mcp` session behavior

Thoughtbox runs an Express app that forwards requests to a `StreamableHTTPServerTransport`. It tracks a map of session entries keyed by the `mcp-session-id` header.

Benchmark implications:

- A **new MCP session** is created when the request does not provide an existing `mcp-session-id`. A UUID is generated and used as the session identifier.
- Requests with an existing `mcp-session-id` are routed to the existing transport.
- `DELETE /mcp` will close the transport and remove it from the map for that `mcp-session-id`.

From the MCP SDK (2026 docs excerpt): `StreamableHTTPServerTransport` supports stateful mode by providing `sessionIdGenerator` and using `mcp-session-id` header routing.

### STDIO behavior

STDIO mode runs a single server connected to `StdioServerTransport`. This is simplest for single-client correctness benchmarks; HTTP is better for concurrency/throughput benchmarks.

---

## Tool surface (what benchmarks should exercise)

### Tool: `thoughtbox_gateway` (router + stage enforcement)

#### Input schema

`thoughtbox_gateway` takes:

- `operation`: one of:
  - Stage 0: `get_state`, `list_sessions`, `navigate`, `load_context`, `start_new`, `list_roots`, `bind_root`
  - Stage 1→2 unlock: `cipher`
  - Stage 2: `thought`, `read_thoughts`, `get_structure`, `notebook`, `mental_models`, `knowledge`
  - Stage 1: `session`, `deep_analysis`
- `args` (optional): record/object forwarded to the underlying handler.

#### Stage model (internal)

Stages are:

- `entry`
- `init_complete`
- `cipher_loaded`
- `domain_active` (present in registry; most gating for the gateway uses up to `cipher_loaded`)

Required stage per operation:

- Requires `entry`: init operations (listed above)
- Requires `init_complete`: `cipher`, `session`, `deep_analysis`
- Requires `cipher_loaded`: `thought`, `read_thoughts`, `get_structure`, `notebook`, `mental_models`, `knowledge`

Stage advancement rules (when the operation succeeds):

- `load_context` and `start_new` advance to `init_complete`
- `cipher` advances to `cipher_loaded`
- other operations do not advance stage

#### Benchmarks should verify these invariants

- **Wrong-stage calls** return a JSON error payload (as text) including `currentStage`, `requiredStage`, and a `suggestion`.
- **Stage advancement** occurs only on successful operations.

---

### Operation: `thoughtbox_gateway` → `thought`

This is the core reasoning operation (implemented by `ThoughtHandler.processThought`).

#### Required args

- `thought`: string
- `nextThoughtNeeded`: boolean

#### Optional args (verified)

- `thoughtNumber?: number` (if omitted, server auto-assigns based on the max main-chain thought number + 1; starts at 1)
- `totalThoughts?: number` (if omitted, defaults to `thoughtNumber`; also coerced upward if `< thoughtNumber`)
- `branchId?: string`
- `branchFromThought?: number` (**required if `branchId` is present**)
- `isRevision?: boolean`
- `revisesThought?: number`
- `needsMoreThoughts?: boolean`
- `includeGuide?: boolean`
- `sessionTitle?: string` (used when the first thought auto-creates a session)
- `sessionTags?: string[]`
- `critique?: boolean` (triggers MCP sampling critique request if supported)
- `verbose?: boolean` (defaults to false; affects response verbosity)

#### Response shape (important for benchmark assertions)

The tool returns MCP content blocks with `type: "text"` (JSON string). In non-verbose mode (the default), it returns only:

- `thoughtNumber`
- `sessionId` (the persistent reasoning session id)

When `verbose: true`, it returns additional fields (e.g., `branches`, `thoughtHistoryLength`, `nextThoughtNeeded`, etc.) and may include an embedded `resource` block:

- It embeds `thoughtbox://patterns-cookbook` at:
  - `thoughtNumber === 1`, or
  - `thoughtNumber === totalThoughts`, or
  - when `includeGuide === true`

#### Session lifecycle behavior

- If there is **no active reasoning session**, the first `thought` call auto-creates a new session via the storage layer and resets in-memory state.
- When `nextThoughtNeeded` becomes `false`, Thoughtbox attempts to **auto-export** the session as linked JSON to `~/.thoughtbox/exports/` (via `storage.toLinkedExport` + `SessionExporter`).
  - If export succeeds: session is closed (`sessionId` becomes null in response, and `closedSessionId` is included).
  - If export fails: session remains open and response includes a warning.

#### Concurrency behavior

Thought processing is **serialized** using an internal `processingQueue` promise chain to avoid race conditions. Benchmarks should assume:

- high concurrency tool calls on one MCP connection will be processed sequentially
- multiple MCP connections (HTTP sessions) can run concurrently

#### Branching behavior

- `branchId` requires `branchFromThought` (server error otherwise).
- Branch thoughts are persisted under `branches/<branchId>/` in filesystem storage and are stored with unique node IDs that include the branch id.

#### Revision behavior

Revisions set `isRevision: true` and `revisesThought: <number>`. Export includes computed revision metadata (SPEC-002) and revision analysis metrics.

#### Sampling critique behavior

If `critique: true` and sampling is supported by the MCP client:

- Server issues `sampling/createMessage` with a system prompt and a “last 5 thoughts” context window.
- If sampling is not supported, clients typically return JSON-RPC `-32601` (method not found); Thoughtbox treats this as a non-fatal condition.
- Critique persistence happens asynchronously via `storage.updateThoughtCritique(...)`.

Benchmark implications:

- Critique must never prevent thought persistence.
- Evaluate both “sampling supported” and “sampling absent” modes.

---

### Operation: `thoughtbox_gateway` → `read_thoughts`

Reads prior thoughts from storage mid-session. It supports:

- `{ thoughtNumber: N }`: fetch a single thought
- `{ last: N }`: fetch last N thoughts
- `{ range: [start, end] }`: inclusive range
- `{ branchId: "name" }`: all thoughts from a branch
- `sessionId` can be provided; otherwise it uses the current active session id
- with no args: returns the last 5 thoughts

Benchmarks should validate:

- correct default behavior (last 5)
- correct range filtering
- error shape when there is no active session and no explicit sessionId

---

### Operation: `thoughtbox_gateway` → `get_structure`

Returns a topology-only representation (no full thought text), including:

- main chain: `length`, `head`, `tail`
- branches: per `branchId` → `{ forks, range, length }`
- revisions: list of `[revisionThoughtNumber, revisesThoughtNumber]`

Benchmarks should validate topology correctness across:

- backward thinking (non-monotonic thought numbers)
- multiple branches from the same fork point
- revisions that occur late but reference earlier thoughts

---

### Operation: `thoughtbox_gateway` → `session` (toolhost)

The gateway’s `session` operation expects:

- `args.operation`: `"list" | "get" | "search" | "resume" | "export" | "analyze" | "extract_learnings" | "discovery"`
- `args.args`: operation-specific arguments

Key behaviors worth benchmarking:

- **list** pagination, tag filtering
- **get** returns session + main thread + a `branches` map
- **resume** loads a session into the active ThoughtHandler (continuation)
- **export** supports `"markdown" | "cipher" | "json"`
  - JSON export uses linked nodes and can resolve cross-session anchors (SPEC-003) if enabled
- **analyze** computes objective metrics (duration, linearityScore, revisionRate, branch depth, thoughtDensity, completion)
- **extract_learnings** emits “pattern/anti-pattern/signal” artifacts suitable for downstream evolution systems

---

### Operation: `thoughtbox_gateway` → `notebook` (toolhost)

Notebook operations include (verified catalog):

- `create`, `list`, `load`, `add_cell`, `update_cell`, `list_cells`, `get_cell`, `run_cell`, `install_deps`, `export`

Execution behaviors relevant to benchmarking:

- Code execution uses `spawn()` with a timeout (default 30s).
- TypeScript execution uses `npx tsx <file>`.
- Filename validation rejects path traversal (`/`, `\\`, `..`).

Benchmarks should include:

- sandbox correctness and isolation between notebooks
- dependency install and execution latency (controlled and cached vs cold)
- failure modes: timeouts, syntax errors, missing files

---

### Operation: `thoughtbox_gateway` → `mental_models` (toolhost)

Mental model operations:

- `get_model`, `list_models`, `list_tags`, `get_capability_graph`

Verified facts useful for benchmark assertions:

- There are **15** mental models.
- There are **9** tags (debugging, planning, decision-making, risk-analysis, estimation, prioritization, communication, architecture, validation).

Benchmarks should validate:

- exact counts (models and tags)
- error messaging includes valid options
- capability graph completeness (used for bootstrapping a knowledge graph)

---

### Operation: `thoughtbox_gateway` → `knowledge` (optional)

Knowledge operations are **feature-gated**:

- Server attempts to initialize knowledge only when `THOUGHTBOX_KNOWLEDGE_ENABLED=true`.
- Storage uses **JSONL + SQLite** (via a runtime import of `better-sqlite3`).
- If `better-sqlite3` cannot be imported, initialization fails and the server continues without knowledge.

Verified storage layout (project-scoped):

- `projects/<project>/memory/graph.jsonl` (append-only source of truth)
- `projects/<project>/memory/memory.db` (SQLite query index, rebuilt from JSONL on startup)

Benchmarks should cover:

- behavior when knowledge is disabled
- behavior when enabled but `better-sqlite3` is missing
- correctness under enabled mode: entity uniqueness (name+type), graph traversal depth, stats reporting

---

## Prompts and resources (benchmarks may exercise indirectly)

### Prompts

Thoughtbox registers multiple prompts (MCP `prompts/get`), including:

- behavioral test prompts: `test-thoughtbox`, `test-notebook`, `test-mental-models`, `test-memory`
- workflow prompts: `interleaved-thinking`, `spec-designer`, `spec-validator`, `spec-orchestrator`, `specification-suite`
- pattern prompts: `subagent-summarize`, `evolution-check`
- a catalog prompt: `list_mcp_assets`

### Resources

Key static/dynamic resources include:

- `thoughtbox://init` and templated init resources (mode/project/task/aspect)
- `thoughtbox://patterns-cookbook`
- `thoughtbox://cipher`
- `thoughtbox://architecture`
- `thoughtbox://session-analysis-guide`
- `thoughtbox://guidance/parallel-verification`
- `thoughtbox://prompts/evolution-check` and `thoughtbox://prompts/subagent-summarize` (prompt-as-resource pattern)
- behavioral tests as resources (URIs from `src/resources/behavioral-tests-content.ts`)
- thought query templates:
  - `thoughtbox://thoughts/{sessionId}/{type}`
  - `thoughtbox://thoughts/{sessionId}/range/{start}-{end}`
  - `thoughtbox://references/{sessionId}/{thoughtNumber}`
  - `thoughtbox://revisions/{sessionId}/{thoughtNumber}`
- OODA loops:
  - `thoughtbox://loops/{category}/{name}`
  - `thoughtbox://loops/catalog`
  - `thoughtbox://loops/analytics/refresh`

Benchmark implication:

Resources/prompt retrieval can be benchmarked for latency and correctness (especially with large catalogs like loops).

---

## Persistence model (filesystem) and durability claims

### FileSystemStorage layout (project-scoped)

Under `THOUGHTBOX_DATA_DIR` (default `~/.thoughtbox`), sessions are stored in:

- `projects/<project>/sessions/<partition>/<sessionId>/`
  - `manifest.json`
  - `<NNN>.json` for main-chain thoughts (padded to 3 digits)
  - `branches/<branchId>/<NNN>.json` for branch thoughts

Partition granularity defaults to monthly, e.g. `2026-01`.

### Atomic writes

Thought and manifest files are written with a temp file + rename (`*.tmp` then `rename()`), which is atomic on POSIX.

Benchmarks should include crash-simulation style tests (where feasible) around:

- partial writes (temp file exists)
- missing thought files referenced by manifest
- integrity validation (`validateSessionIntegrity`) behavior

### Exports

On session completion, Thoughtbox writes a linked export JSON to:

- `~/.thoughtbox/exports/<sessionId>-<timestamp>.json`

Exports include:

- session metadata
- nodes with `prev`, `next[]`, `revisesNode`, `branchOrigin`, `branchId`
- revision metadata + revision analysis (SPEC-002)

### Migration

On startup in filesystem mode, the server attempts to migrate prior export files into the newer session directory format (`migrateExports(...)`). Migration is best-effort and non-fatal.

---

## Observatory (real-time UI) interface

When enabled, the observatory server provides:

- a web UI (HTML) and HTTP API (if enabled)
- a WebSocket server with channels for observatory events and per-session reasoning streams

Benchmarks should consider:

- overhead of event emission during heavy thought throughput
- WebSocket broadcast latency and behavior under many clients (respecting max connections)

---

## Observability stack (optional, for performance benchmarking)

This repo includes an **MCP observability sidecar** in `observability/mcp-sidecar-observability/` that can proxy MCP traffic and emit OpenTelemetry metrics (exported to Prometheus via an OTEL collector).

### Sidecar provides (verified)

- protocol-level counters and histograms (requests, tool calls, latency, bytes)
- health metrics for upstream availability
- a load test script that generates realistic MCP method distributions
- a PII redaction test that verifies telemetry sanitization

Benchmark implication:

- For performance benchmarks, you can drive traffic through the sidecar and use Prometheus queries to compute p50/p95/p99 latencies and error rates.

---

## Existing tests and contracts (use these as baseline correctness signals)

### Behavioral test documents

There are behavioral markdown specs under `tests/`:

- `tests/thoughtbox-behavioral.md`
- `tests/notebook-behavioral.md`
- `tests/mental-models-behavioral.md`
- `tests/memory-behavioral.md`

These define workflows that the repo’s agentic test harness executes.

### Unit tests

Deterministic unit tests exist under `tests/unit/` covering:

- contamination detection logic
- tiered evaluator logic
- proctor/sampler utilities
- improvement tracker

### Behavioral “anti-cheating” contracts (important for benchmark design)

The repo includes contracts intended to detect brittle, hardcoded, or non-reasoning behavior in agentic evaluation contexts:

- variance across different inputs
- content coupling (outputs must incorporate input-specific content)
- trace existence (minimum reasoning artifacts)
- LLM judge scoring gates

Benchmark implication:

- Consider adding benchmark “guard rails” that check for meaningful, input-coupled behavior rather than superficial success.

---

## Benchmark design recommendations (what to measure)

### Correctness (functional)

- Stage gating correctness for `thoughtbox_gateway` operations.
- Thought persistence: main chain, branch, revision semantics.
- Export correctness: linked structure invariants, revision metadata presence.
- Session toolhost correctness: list/get/resume/export/analyze/extract behaviors.
- Notebook toolhost correctness: roundtrip load/export, execution results, timeout behavior.
- Mental models correctness: counts, tags, lookup and error messaging.
- Knowledge correctness (when enabled): CRUD, traversal, stats; behavior when unavailable.

### Robustness (failure modes)

- Wrong-stage calls produce helpful, structured errors.
- Storage integrity failures block `loadSession` with actionable recovery text.
- Sampling failures (including method-not-found) do not fail thought persistence.
- Auto-export failure preserves session (does not lose data).
- Observatory failures never affect reasoning (event emission is swallow-on-error).

### Performance and scalability

Key performance bottleneck candidate:

- Thought processing is serialized via a queue in `ThoughtHandler`.

Benchmarks should quantify:

- single-session throughput (sequential)
- multi-session throughput (parallel MCP sessions)
- filesystem vs memory storage impact
- impact of observatory enabled vs disabled
- session listing performance with large numbers of sessions and thoughts

### Observability quality

- metrics presence and correctness (sidecar)
- PII redaction correctness (collector sanitization + pii-test script)
- alert usefulness (Prometheus alert rules)

---

## Suggested benchmark suites (templates)

Use these as starting points and refine into full benchmark specs.

### Suite A: Protocol + stage gating (smoke/regression)

- `gateway_stage_gating`: call each operation at wrong stage → assert error payload includes `requiredStage`, `currentStage`, `suggestion`.
- `gateway_stage_advancement`: `start_new` → `cipher` → `thought` sequence and verify stage transitions.

### Suite B: Thought ledger semantics (regression)

- forward chain (auto numbering)
- backward numbering (explicit thoughtNumber decreasing)
- branching correctness + `get_structure` topology
- revision correctness + export revision metadata
- `read_thoughts` query modes

### Suite C: Durability + integrity (regression/stress)

- filesystem atomic-write integrity checks
- migration-from-exports behavior
- crash-simulation style checks (where possible)

### Suite D: Sampling critique behavior (regression)

- sampling supported: critique field returned and persisted
- sampling unsupported (`-32601`): no failure; thought persists

### Suite E: Notebook execution (smoke/regression/perf)

- create/load/export roundtrip
- run small JS/TS cells, measure latency and resource usage
- timeout and error-path behavior

### Suite F: Observatory + eventing (perf)

- measure added overhead of observatory enabled under heavy thought throughput
- WebSocket fan-out behavior and max-connection enforcement

### Suite G: Observability sidecar (perf + security)

- loadtest script-driven p95 latency and error rate thresholds
- PII test verification of sanitized telemetry

### Suite H: Optional knowledge graph (conditional)

- enabled + dependency present: CRUD and traversal correctness
- enabled + dependency absent: graceful disablement behavior

---

## Notes on missing/optional components

`package.json` includes benchmark-related npm scripts that reference `dgm-specs/harness/cli.ts`, but that path is not present in this repository snapshot. Benchmarks you generate should therefore be grounded in the currently present harnesses under `scripts/` and `tests/`, or include new harness scaffolding as part of the proposal.

