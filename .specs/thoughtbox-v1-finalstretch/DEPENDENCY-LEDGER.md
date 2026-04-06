# Composite Audited Correlation Dependency Ledger

## Proof Obligation

One real Claude Code work period must create one canonical `runs` binding row that stores both external IDs, belongs to exactly one Thoughtbox `session`, and serves as the only valid lookup path for OTEL-backed auditing.

## Canonical Data Model

- `session` is the primary persistent Thoughtbox object.
- `run` is a work period that belongs to a `session`.
- `runs` is the composite binding table.
- `runs` must store both external identifiers rather than pretending one shared raw ID exists.

## Required Boundaries

### 1. Session Boundary

What must exist:
- Thoughtbox can create a persistent `session`.
- That session can create a `run` row immediately.
- The `run` row must carry at least `session_id`, `workspace_id`, `mcp_session_id`, and lifecycle timestamps.

What is now implemented:
- Session creation creates a `runs` row.
- Session close ends open `runs` rows.

What this boundary does not prove:
- It does not prove the OTEL-side `session.id` yet.

### 2. Handshake Boundary

What must exist:
- One audited event or transport path that can observe both:
  - Claude Code / MCP session identity
  - OTEL `session.id`
- That event must be durable enough to justify updating the canonical `runs` row.

What is explicitly false:
- OTLP requests do not carry MCP session ID by default.
- There is no trustworthy shared raw ID already present in both systems.
- Parser-side inference is not acceptable.

What is now implemented:
- Hook-side capture emits `thoughtbox.run_binding` with:
  - `mcp.session_id`
  - `thoughtbox.session_id`
  - OTEL resource `session.id`

Operational prerequisite:
- Hooks must fire in the real Claude Code path.
- Hook OTLP posts must authenticate successfully.

### 3. OTEL Ingestion Boundary

What must exist:
- OTEL ingestion must persist raw OTEL rows with raw OTEL `session.id`.
- OTEL ingestion must reconcile canonical bindings from the handshake event, not from guessed joins.

What is now implemented:
- OTEL rows still store raw OTEL `session.id`.
- `thoughtbox.run_binding` can reconcile the canonical `runs` row.
- Reconciliation now prefers exact `mcp_session_id` match and only falls back to a session-scoped null-`mcp_session_id` run.

What was removed:
- Route-level `mcp-session-id` header binding assumption.
- `run_correlation_key` as a fake shared-key path.

### 4. Storage Boundary

What must exist:
- Database schema must support canonical run binding rows.
- The schema must not preserve abandoned false-key columns as if they were still authoritative.

What is now implemented:
- `runs` migration exists.
- cleanup migration drops `run_correlation_key` from `sessions` and `otel_events`.
- generated DB types include `runs` and no longer surface the abandoned key on those tables.

Operational prerequisite:
- The migrations must be applied to the live database that receives OTLP traffic before end-to-end verification means anything.

### 5. Query Boundary

What must exist:
- Audit and observability reads must go through `runs`.
- Query code must no longer assume Thoughtbox `session.id`, `mcp_session_id`, and OTEL `session.id` are directly interchangeable.

What is now implemented:
- session timeline reads resolve OTEL through `runs.otel_session_id`.
- cost reads resolve OTEL through `runs.otel_session_id`.

What this boundary does not prove:
- It does not prove the run row is fully populated in a real deployment.

## Environment Dependencies

## Current Topology

- local code environment exists
- production deployment exists
- staging deployment does not exist

## Consequence

Live verification currently collapses into a bad binary:

- local can prove code shape but not real hook-to-OTLP-to-DB behavior
- production is the only place where the full live path exists

This is not a modeling dependency. It is an environment dependency.

## Minimum Requirements For Real Verification

- deployed service with this code path
- deployed database schema with `runs` migration applied
- valid hook OTLP auth configuration
- one fresh Claude Code session hitting that deployed service

## Recommended Topology

- local: edit and inspect
- staging: verify live integration safely
- production: user-facing path only after staging proof

Without staging, production remains the only real proof target.

## Open Risks

- Hook delivery may fail silently if OTLP auth or env wiring is wrong.
- A partially created run row can exist without an OTEL binding if the handshake event never lands.
- End-to-end proof remains blocked until migrations are applied to the real OTLP-backed database.

## Kill Conditions

Stop and redesign if any of the following become true:

- correlation depends on raw equality of Thoughtbox `session.id` and OTEL `session.id`
- correlation depends on one invented shared raw ID
- correlation depends on parser-side inference after the fact
- auditing queries can bypass `runs`
- live verification is claimed without the schema existing on the live OTLP-backed database

## Remaining Unknowns

- Whether the hook-emitted binding event lands successfully in the deployed environment.
- Whether any existing downstream readers still assume the removed `run_correlation_key` path.
- Whether production-first verification is acceptable, or whether staging must be built first.
