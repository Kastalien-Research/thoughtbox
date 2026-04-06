# Ship Checklist

## Goal

Ship the smallest demoable Thoughtbox path: one coherent `run` within a `session` that can be shown to a user with linked telemetry and linked internal session data.

## Why This Checklist Replaced The Old One

The previous checklist assumed the current session identity scheme could be validated into coherence. That assumption is no longer trustworthy. The new checklist keeps `session` as the primary object, treats `run` as belonging to a `session`, and requires a mechanically provable composite binding record that stores both external IDs.

See `DEPENDENCY-LEDGER.md` for the full proof path, infrastructure prerequisites, and operational blockers.

## Definition Of Done

- [ ] One fresh real Claude Code work period creates exactly one canonical run binding row.
- [ ] That run binding row is attached to exactly one `session`.
- [ ] OTEL events for that work period are resolved through the bound `otel_session_id`.
- [ ] Internal Thoughtbox session data for that work period are resolved through the same run binding row without redefining `session` as subordinate to `run`.
- [ ] The web app can render one run view keyed by the binding row within its session context.
- [ ] The run view shows both telemetry activity and internal session/reasoning data for the same run.
- [ ] Missing run-linked data produces an explicit error or empty state instead of ambiguity.

## Critical Path

### 1. Establish Canonical Run Identity

- [x] Create one first-class run binding row.
- [x] Define exactly where the binding row is created.
- [x] Define exactly when the binding row lifecycle begins and ends.
- [x] Keep `session` as the primary persistent object.
- [x] Keep `run` as a work period belonging to a `session`.
- [x] Remove reliance on inferred joins between `sessions.id` and `otel_events.session_id`.

### 2. Persist The Run Record

- [x] Add or finalize the persisted record that represents one run.
- [x] Store `otel_session_id` on the run record (`sessions.id` IS the MCP session ID).
- [x] Store the session linkage for that run without reversing the ontology.
- [x] Store workspace ownership and start/end timestamps.
- [x] Make the run record the primary lookup unit for the demo path.

### 3. Attach OTEL To Run Identity

- [x] Persist OTEL rows with raw OTEL `session.id`.
- [ ] Verify one fresh real run binds that OTEL `session.id` onto the correct run row.
- [x] Query OTEL rows for the demo exclusively through the run binding row.

### 4. Attach Internal Session Data To Run Identity

- [x] Persist the binding record that attaches runs to sessions.
- [ ] Verify one fresh real run produces internal session data attached to the bound `session_id`.
- [x] Query internal session data for the demo exclusively through the run binding row.

### 5. Build One Minimal Run View

- [ ] List recent runs.
- [ ] Add one run detail page.
- [ ] Load the page by run binding row.
- [ ] Show start/end time.
- [ ] Show telemetry timeline.
- [ ] Show attached internal session/reasoning records.
- [ ] Show cost summary when available.
- [ ] Show touched files when available.

### 6. Error And Empty States

- [ ] Show a clear state when a run exists but OTEL is missing.
- [ ] Show a clear state when a run exists but internal session data is missing.
- [ ] Show a clear state when no runs exist.
- [ ] Remove blank or ambiguous run states.

### 7. End-To-End Demo Proof

- [ ] Create a fresh API key from the live web app.
- [ ] Configure Claude Code against the deployed MCP service.
- [ ] Run one short real coding task.
- [ ] Verify one canonical run binding row was created for that work period.
- [ ] Verify OTEL rows exist for that bound `otel_session_id`.
- [ ] Verify internal session data exist for that bound `session_id`.
- [ ] Verify the web app renders that run coherently.

## Kill Switch

- [ ] If any step above still requires inference instead of a direct lookup through the binding row, stop and change the model before continuing.

## Explicitly Deferred

- [ ] Notebook work
- [ ] Blast radius graph visualization
- [ ] Scope drift scoring
- [ ] Project model upload
- [ ] Module dependency traversal
- [ ] Monorepo migration
- [ ] Any feature not required to show one coherent run

## Priority Order

1. Establish canonical run binding row.
2. Persist one run record.
3. Attach OTEL and internal session data through that run binding row.
4. Render one ugly but coherent run page.
5. Demo it.
6. Only then consider follow-on work.
