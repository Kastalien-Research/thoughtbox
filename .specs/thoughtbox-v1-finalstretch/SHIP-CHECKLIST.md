# Ship Checklist

## Goal

Ship the smallest usable Thoughtbox loop without blocking on notebooks, blast radius, or a repo merge.

## Definition Of Done

- [ ] A user can get an API key from the web app.
- [ ] A user can connect Claude Code to the deployed MCP service.
- [ ] One real run produces OTEL telemetry in the deployed backend.
- [ ] One reasoning session links to that same run/work period.
- [ ] The web app shows one coherent run with reasoning and tool activity.
- [ ] Broken setup shows an explicit error/empty state instead of a blank dashboard.

## P0

### 1. Prove The Correlation Key

- [ ] Confirm whether Claude Code OTEL `session.id` matches the MCP session identifier seen by the server.
- [ ] If it matches, use that as the join key.
- [ ] If it does not match, introduce an explicit `connection_key` and propagate it through both paths.
- [ ] Persist the chosen key on backend `sessions`.

### 2. Backend Query Surface

- [ ] Add the minimal backend query needed to fetch one work period/run by correlation key.
- [ ] Include attached reasoning sessions.
- [ ] Include OTEL events in chronological order.
- [ ] Include event counts, file-touch counts when present, and cost summary.
- [ ] Do not build a dedicated `connections` table unless the simple join fails.

### 3. Web App Run View

- [ ] List recent runs/work periods for a workspace.
- [ ] Add one run detail page.
- [ ] Show start/end time.
- [ ] Show attached reasoning sessions.
- [ ] Show chronological timeline of:
- [ ] user prompt when available
- [ ] tool decisions/results
- [ ] API requests/errors
- [ ] structured thoughts/reasoning
- [ ] cost
- [ ] Show touched files when available.

### 4. Error And Empty States

- [ ] Show a clear state when telemetry is not configured.
- [ ] Show a clear state when telemetry exists but no reasoning sessions are linked.
- [ ] Show a clear state when reasoning sessions exist but telemetry is missing.
- [ ] Remove any blank or ambiguous dashboard states in the run flow.

### 5. Onboarding

- [ ] Decide whether `thoughtbox init` ships in this cut.
- [ ] If yes, implement `thoughtbox init` to:
- [ ] validate API key
- [ ] configure MCP URL
- [ ] configure OTLP env vars
- [ ] warn if `.claude/` is not ignored
- [ ] provide a smoke test
- [ ] If no, ship a manual quickstart in the web app and docs with the exact same steps.

### 6. End-To-End Smoke Test

- [ ] Create a fresh API key from the live web app.
- [ ] Configure Claude Code against the deployed MCP service.
- [ ] Run one short real coding task.
- [ ] Verify OTEL events land in `otel_events`.
- [ ] Verify a reasoning session is created.
- [ ] Verify the correlation works.
- [ ] Verify the web app displays the run coherently.

## Explicitly Deferred

- [ ] Dedicated `connections` table
- [ ] Hook-first capture as the primary ingestion path
- [ ] Project model upload
- [ ] Module dependency traversal
- [ ] Blast radius graph visualization
- [ ] Scope drift scoring
- [ ] Notebook work
- [ ] Monorepo migration

## Docs Cleanup After Product Path Works

- [ ] Update `docs/architecture/infrastructure.md` to match deployed reality.
- [ ] Update `docs/architecture/index.md` so the web app deploy target is no longer `TBD`.
- [ ] Keep `SPEC-USABILITY-CUTLINE.md` as the product cut line.

## Priority Order

1. Prove the correlation key.
2. Make the web app show one coherent run.
3. Add explicit error and empty states.
4. Finish onboarding.
5. Update stale docs.
6. Stop.
