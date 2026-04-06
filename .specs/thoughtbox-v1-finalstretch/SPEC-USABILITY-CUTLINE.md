# SPEC-USABILITY-CUTLINE: Make The Online Product Usable

## Status: DRAFT

## Scope

This document defines the minimum work required to make the deployed Thoughtbox product usable for a Claude Code user, explicitly excluding notebook work.

"Usable" means a user can:

1. Sign in, get a workspace API key, and connect Claude Code without hand-editing fragile config.
2. Run one real coding session.
3. Open the product afterward and understand:
   - what work period happened,
   - what the agent decided,
   - what tools it used,
   - what files it touched,
   - and roughly how expensive the run was.

If the product cannot answer those questions from one end-to-end session, it is not yet usable.

Notebooks are out of scope for this cut.

## Current Reality

The deployed/server-side substrate is farther along than the final-stretch drafts suggest:

- Multi-tenant auth, workspaces, API keys, and OAuth already exist.
- OTLP ingestion already exists at `/v1/logs` and `/v1/metrics`.
- OTEL storage already exists in `otel_events`.
- Observability query surfaces already exist for `session_timeline` and `session_cost`.
- Thoughtbox reasoning sessions and thoughts already persist.
- Repo-local Claude config already assumes Claude Code can export OTLP directly to Thoughtbox.

The product is still not usable because the last mile is missing:

1. No user-facing init flow configures Claude Code cleanly.
2. Tool telemetry and reasoning sessions do not yet share a persisted correlation key.
3. There is no user-facing work-period view that interleaves decisions and tool activity.
4. The drafts ask blast-radius/project-model work to carry value that a basic timeline should carry first.

## Product Thesis

The first usable version is not "full observability."

It is:

1. `thoughtbox init`
2. run the agent normally
3. open Thoughtbox
4. see one coherent work period with reasoning and tool calls side by side

Everything that does not help that loop can wait.

## Decision Matrix

| Spec | Decision | Why | What must ship now |
|---|---|---|---|
| `SPEC-CLI-INIT` | **Keep** | There is no usable product without setup that normal users can survive. | A real onboarding command that writes the needed Claude Code config safely. |
| `SPEC-HOOK-CAPTURE` | **Simplify heavily** | The server and repo already assume native Claude Code OTLP export. The primary problem is onboarding and correlation, not inventing a second capture substrate. | Configure OTLP export in `thoughtbox init`. Keep hooks only as optional fallback for clients that cannot emit OTLP. |
| `SPEC-CONNECTION-TRACKING` | **Simplify** | The real missing piece is a persisted join key between reasoning sessions and OTEL session data. A dedicated `connections` table is not obviously the shortest path to usability. | Persist a connection key on reasoning sessions and build the product surface around it. |
| `SPEC-PROJECT-MODEL` | **Defer** | Structural enrichment is valuable, but it is not the first thing a user needs to trust the product. | None for the first usable release. |
| `SPEC-BLAST-RADIUS` | **Split** | Basic summary metrics are useful now; module graph analysis is not required for first value. | Minimal file/tool/count summaries only. Full dependency analysis defers. |
| `SPEC-NOTEBOOK-RLM` | **Defer entirely** | Explicitly out of scope. | None. |

## Key Design Decisions

### 1. Use native Claude Code OTLP as the default capture path

This should be the default path for the usable release.

Reason:

- The server already ingests OTLP.
- The parser already expects Claude Code event types like `claude_code.tool_result`.
- The repo's own Claude config already points Claude Code OTLP directly at Thoughtbox.

Implication:

- `thoughtbox init` should primarily write OTLP environment configuration plus the Thoughtbox MCP server URL.
- A custom `post_tool_use` hook should be treated as fallback compatibility work, not as the mainline product path.

### 2. Ship correlation before a richer connection model

The product becomes useful when a human can move from "tool events happened" to "these events belonged to this reasoning run."

That requires a persisted correlation key, not necessarily a first-class `connections` table.

Minimum acceptable implementation:

- Add `mcp_session_id` or `connection_key` to persisted reasoning sessions.
- When `ThoughtHandler` auto-creates a reasoning session, persist the current MCP session identifier with it.
- Group OTEL events and reasoning sessions in the product using that shared key.

This is the shortest path because `ThoughtHandler` already knows the MCP session ID; it simply does not persist it.

### 3. Treat the work period as the user-facing primitive

The online product should present a user-facing "work period" or "connection" detail page even if the underlying storage is initially derived rather than materialized.

For the first release, the page must answer:

- When did the work start and stop?
- Which reasoning sessions occurred inside it?
- What tools were called, in order?
- Which files were touched, when available?
- Were there API errors?
- What was the run cost?

That is enough for a user to decide whether Thoughtbox is helping.

### 4. Defer structural analysis until after the timeline is solid

The first release does not need:

- module graphs,
- dependency fan-out,
- scope drift scores,
- graph visualization,
- or full blast radius drill-down.

It only needs a coherent timeline plus a few summaries derived from raw events.

## P0 Work Required

### P0.1 Onboarding

Deliver a real `thoughtbox init` flow.

Required behavior:

- Validate the workspace API key.
- Configure the Thoughtbox MCP server URL in `.claude/settings.json`.
- Configure OTLP export in `.claude/settings.json` via env vars.
- Warn if `.claude/` is not ignored.
- Provide a smoke test command and expected result.

Important implementation note:

- `package.json` already maps the `thoughtbox` bin to the server entrypoint. The init flow therefore needs either a dedicated CLI entrypoint or explicit subcommand parsing. It cannot be bolted on implicitly.

### P0.2 Correlation

Create the minimal persistent join between reasoning data and OTEL data.

Required behavior:

- Add a persisted correlation field to reasoning sessions.
- Populate it automatically from the active MCP session when a reasoning session is created.
- Expose a query surface that returns a work period with:
  - OTEL event bounds,
  - attached reasoning sessions,
  - event counts,
  - file-touch counts when present,
  - and cost summary.

Important assumption to validate immediately:

- The OTEL `session.id` emitted by Claude Code must match the MCP session identifier seen by the server for a single work period.

If that assumption is false, switch immediately to an explicit `connection_key` propagated through both paths. Do not continue building on a false free-join.

### P0.3 Product Surface

Add the minimum user-facing observability view in the online product.

Required behavior:

- List recent work periods for a workspace.
- Show detail for one work period.
- Render a single chronological timeline that interleaves:
  - reasoning sessions and structured thoughts,
  - user prompts when available,
  - tool decisions,
  - tool results,
  - API requests/errors,
  - cost metrics.
- Show lightweight summaries:
  - duration,
  - total events,
  - tool types used,
  - files touched,
  - attached reasoning session count,
  - total cost.

This is the first moment the product becomes legible.

### P0.4 Failure Visibility

The product cannot fail silently.

Required behavior:

- If telemetry is not configured, show that clearly.
- If OTEL events are arriving but no reasoning sessions are linked, show that clearly.
- If reasoning sessions exist but no OTEL events are present, show that clearly.

Blank dashboards are not acceptable. The user must know whether the problem is setup, ingestion, or correlation.

## Explicitly Deferred

These items are valuable but are not required for the first usable release:

- dedicated `connections` table, unless the derived work-period model proves insufficient,
- hook-based capture as the primary ingestion path,
- project model upload and module extraction,
- module dependency traversal,
- blast-radius graph visualization,
- scope drift scoring and alert thresholds,
- reconnection merging across multiple transport sessions,
- stale connection cleanup heuristics,
- notebook-related work.

## Acceptance Criteria For "Usable"

- A new user can configure Claude Code with one init command.
- Running a normal coding session produces OTEL events in Thoughtbox without manual curl or custom local scripts.
- At least one persisted reasoning session can be linked to the same work period as the tool telemetry.
- The product can show one unified work-period page with decisions and tool activity side by side.
- The page shows enough summary information to answer "what happened here?" in under a minute.
- Missing setup or broken correlation is surfaced explicitly.

## Evidence Consulted

- `.specs/thoughtbox-v1-finalstretch/SPEC-CLI-INIT.md`
- `.specs/thoughtbox-v1-finalstretch/SPEC-HOOK-CAPTURE.md`
- `.specs/thoughtbox-v1-finalstretch/SPEC-CONNECTION-TRACKING.md`
- `.specs/thoughtbox-v1-finalstretch/SPEC-PROJECT-MODEL.md`
- `.specs/thoughtbox-v1-finalstretch/SPEC-BLAST-RADIUS.md`
- `src/index.ts`
- `src/otel/routes.ts`
- `src/otel/parser.ts`
- `src/otel/otel-storage.ts`
- `src/observability/gateway-handler.ts`
- `src/thought-handler.ts`
- `src/server-factory.ts`
- `package.json`
- `.claude/settings.json`
- `.claude/session-handoff.json`
- `docs/architecture/index.md`
- `docs/architecture/server-architecture.md`
- `docs/architecture/data-model.md`
- `docs/architecture/auth-and-billing.md`
