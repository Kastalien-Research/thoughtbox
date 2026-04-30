---
status: ready
priority: p2
issue_id: "001"
tags: [notebook, supabase, cloud-run, effect]
dependencies: []
---

# Notebook Evidence Engine Production Durability

## Problem Statement

The first Notebook Evidence Engine slice adds typed Effect schemas, capability visibility, evidence templates, and in-process run/artifact operations. Production durability is still incomplete: async runs need Supabase-backed stores and a Cloud Run runner.

## Findings

- `NotebookStore`, `NotebookRunStore`, `ArtifactStore`, `ModeRegistry`, and `SandboxExecutor` are represented as Effect service boundaries.
- `notebook_start_run` supports `executionMode: "async"` by creating a queued run record in the current in-process runtime only.
- Supabase migrations and Cloud Run runner dispatch are intentionally deferred from the first slice.

## Proposed Solutions

1. Add Supabase-backed stores and migrations first, then wire the existing MCP operations to durable state.
2. Add Cloud Run runner first and keep state in-memory during runner development.
3. Build both in one large infrastructure slice.

## Recommended Action

Use option 1. Make durable state real before adding distributed compute.

## Acceptance Criteria

- [ ] Supabase migrations create notebook documents, runs, run events, and artifacts with workspace isolation.
- [ ] `NotebookStore`, `NotebookRunStore`, and `ArtifactStore` have Supabase implementations.
- [ ] `notebook_persist`, `notebook_start_run`, `notebook_get_run`, `notebook_list_runs`, `notebook_cancel_run`, and `notebook_get_artifact` use durable stores when Supabase credentials are configured.
- [ ] Async runs are claimable by a Cloud Run runner without relying on the main MCP request lifecycle.
- [ ] Runner strips notebook child-process environment variables and enforces timeout, artifact size, and concurrency limits.
- [ ] Tests cover local/in-memory and Supabase-backed store behavior.

## Work Log

### 2026-04-30 - Follow-Up Created

**By:** Codex

**Actions:**
- Tracked production durability work after the first Notebook Evidence Engine slice.
- External GitHub issue creation was unavailable from the sandbox, so this local todo records the remaining work.

**Learnings:**
- The first slice can be reviewed independently from the infrastructure-heavy Supabase/Cloud Run runner slice.
