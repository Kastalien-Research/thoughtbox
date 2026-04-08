Here is a complete list of Thoughtbox capabilities, both explicit and implied, drawn from every page in the documentation:

***

## Thoughtbox Capabilities

### Core Primitives

**Thought Recording** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/sessions-and-thoughts)
- Record individual thoughts as numbered, timestamped, append-only units of reasoning
- Seven thought types: `reasoning`, `decision_frame`, `action_report`, `belief_snapshot`, `assumption_update`, `context_snapshot`, `progress`
- Per-thought confidence levels: `high`, `medium`, `low` (required for `decision_frame`, optional for other types)
- Type-specific structured payloads (e.g., `options[]` for decisions, `beliefs` for snapshots, `progressData`, etc.)

**Session Management** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/session-lifecycle)
- Sessions created automatically on the first thought — no explicit "create" call needed
- Sessions track: title (auto-generated or explicit), tags, status (`active` / `completed` / `abandoned`), thought count, branch count, timestamps
- Filter and list sessions by tag or recency
- Full-text search across all sessions and their thought content
- Resume a previous session so new thoughts append to it rather than starting fresh
- Tag-based organization and searchable categorization

**Branching** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/sessions-and-thoughts)
- Fork reasoning into parallel tracks from any thought number, using `branchFromThought` and `branchId`
- Thought numbers are scoped per session + branch, enabling independent numbering on each branch
- Merge branches back into a main track via synthesis thoughts

**Revisions** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/sessions-and-thoughts)
- Record a revision to supersede an earlier thought without deleting it
- Original thought is preserved; revision flags the old thought number it supersedes
- Creates an honest, auditable correction trail

***

### Session Lifecycle Operations

- **List sessions** with pagination and tag filters [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/session-lifecycle)
- **Search sessions** by full-text query [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/session-lifecycle)
- **Resume sessions** to continue prior reasoning [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/session-lifecycle)
- **Export sessions** in three formats: [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/session-lifecycle)
  - `markdown` — human-readable, full fidelity
  - `cipher` — 2–4x compressed notation for context-constrained agents
  - `json` — raw structured data
- **Analyze sessions** for reasoning quality metrics: [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/session-lifecycle)
  - `linearityScore` — degree of branching
  - `revisionRate` — fraction of corrective thoughts
  - `maxDepth` — deepest branch nesting
  - `thoughtDensity` — substantiveness per thought
  - `hasConvergence` — whether branches resolved to a decision
  - `isComplete` — whether session was properly closed
- **Extract learnings** from key moments in a session, classified into categories (e.g., pattern, anti-pattern, signal), for feeding into the knowledge graph [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/session-lifecycle)

***

### Knowledge Graph (Cross-Session Memory)

- Persistent store of entities and relations that survives session completion and context compaction [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/knowledge-graph)
- **Entity types**: `Concept` (technical idea), `Insight` (validated truth), `Workflow` (process/steps)
- Additional entity types referenced in the SDK: `Decision`, `Agent` [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)
- Entities carry a name (slug), display label, and optional domain-specific properties
- **Observations**: timestamped, append-only notes attached to entities — tracks how understanding of an entity evolves over time [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/knowledge-graph)
- **Relations** (directed edges) between entities: [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/knowledge-graph)
  - `BUILDS_ON`, `DEPENDS_ON`, `RELATES_TO` (knowledge graph page)
  - Extended set in SDK: `CONTRADICTS`, `EXTRACTED_FROM`, `APPLIED_IN`, `LEARNED_BY`, `SUPERSEDES`, `MERGED_FROM` [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)
- **Graph traversal**: query from a starting entity up to a configurable depth, filtering by relation type [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/knowledge-graph)
- **Entity listing** with type filters and name-pattern search [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/knowledge-graph)
- **Aggregate stats** about the graph [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/knowledge-graph)
- Enables "institutional memory" — future sessions load prior findings instead of starting from scratch [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/knowledge-graph)

***

### Code Mode Interface (Two-Tool MCP Design)

- Exposes exactly two MCP tools (`thoughtbox_search` and `thoughtbox_execute`) instead of dozens, to minimize context window token consumption [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)
- `thoughtbox_search`: agent writes JavaScript against a `catalog` object to discover available operations by module — read-only, 10-second timeout [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)
- `thoughtbox_execute`: agent writes JavaScript against a `tb` SDK object to call any operation — 30-second timeout [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)
- Catalog organized into modules: `session`, `thought`, `knowledge`, `notebook`, `theseus`, `ulysses`, `observability` (implies additional unreleased/undocumented modules) [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)
- Catalog also exposes `prompts`, `resources`, and `resourceTemplates` [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)

***

### Structured Reasoning Protocols (Built-in Guides)

**Interleaved Thinking / IRCoT** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/interleaved-thinking)
- Think–act–think–act loop: alternate Thoughtbox reasoning with external tool calls (web search, file reads, code execution)
- Three prompt-template–backed modes loaded from `thoughtbox://interleaved/{mode}` resources:
  - **Research** — breadth-first investigation
  - **Development** — code-write/test/record loops
  - **Analysis** — deep examination of existing material with no external retrieval
- Synthesis checkpoint pattern: consolidate findings every 10–15 thoughts, flag contradictions, rank open questions

**Ulysses Protocol (Surprise-Gated Debugging)** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/ulysses-protocol)
- Structured debugging for genuinely stuck situations (2+ failed attempts)
- S-register (surprise counter): blocks new plans when S ≥ 2, forcing a `reflect` step
- Operations: `init`, `plan` (with mandatory pre-committed recovery), `outcome` (expected/unexpected + severity), `reflect` (requires falsifiable hypothesis, resets S), `complete`, `status`
- Terminal states: `resolved`, `abandoned`, `deferred`
- Prevents the "try random things" spiral by requiring hypothesis formation before action resumes

***

### Subagent / Context Isolation Patterns

- **Subagent-Summarize**: spawn a cheap subagent (e.g., haiku) to retrieve and summarize a session; only the summary (~80 tokens) returns to the parent context, vs. ~8000 tokens raw [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/subagent-patterns)
- **Evolution-Check (A-MEM)**: spawn a subagent to classify prior thoughts as `UPDATE` / `NO_UPDATE` given a new insight; apply updates via `isRevision` flag [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/subagent-patterns)
- Explicit cost comparison table for choosing between raw retrieval, summarize, and evolution-check patterns [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/subagent-patterns)

***

### Observability and Telemetry

- Ingest OpenTelemetry (OTEL) data emitted by Claude Code: tool calls, API costs per model, session timelines, errors [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/observability)
- Data stored in Supabase, queryable via the `observability` module [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/observability)
- Setup via OTLP environment variables in `.claude/settings.local.json` [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/observability)
- `PostToolUse` hook: tracks file access and writes tool receipts automatically [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/observability)
- Session tracker hook (`thoughtbox_session_tracker.sh`): binds Claude Code sessions to Thoughtbox sessions for cross-system correlation [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/observability)
- Queryable operations: [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/observability)
  - **Health check** — service status for MCP server and Supabase
  - **Active sessions** — list currently active reasoning sessions
  - **Cost breakdown** — per-model API cost for a session
  - **Event timeline** — chronological tool call/event trace for a session

***

### Authentication and Workspace Management

- API key authentication scoped to a workspace; all data belongs to the workspace of the authenticating key [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/authentication)
- Keys are bcrypt-hashed server-side — raw key never stored [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/authentication)
- Multiple simultaneous active keys per workspace (enables zero-downtime rotation) [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/authentication)
- Key revocation is immediate, with audit record preserved [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/authentication)
- Workspace isolation: different workspaces are fully separated; multiple keys for the same workspace share a unified reasoning history [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/authentication)
- Supports both URL query parameter and `Authorization: Bearer` header auth [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/authentication)

***

### Implicitly Promised / Referenced Capabilities

- **Notebook module** — referenced in the SDK catalog but not yet documented [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)
- **Theseus module** — referenced in the SDK catalog but not yet documented [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)
- **`thoughtbox://cipher` grammar resource** — a machine-readable spec for the compressed session export format [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/session-lifecycle)
- **`thoughtbox://interleaved/{mode}` resources** — loadable prompt templates and constraints for each IRCoT mode [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/interleaved-thinking)
- **Prompt templates and resource templates** — exposed via the catalog, implying a library of built-in agent prompts [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/docs/code-mode)