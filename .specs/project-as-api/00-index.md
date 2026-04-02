# Project-as-API Spec

> **ADR**: [ADR-018](/.adr/staging/ADR-018-project-as-api.md)
> **Status**: Staging
> **Phase**: 1 of 3 (Tool surface + Catalog + Codebase ops + CLI dispatch + Scope consent)

## Purpose

Specifies the "Project Mode" surface: two new MCP tools that make Thoughtbox the mandatory
pathway for all project operations (code writes, infrastructure CLI calls, commits). An agent
equipped with only `thoughtbox_execute`, `thoughtbox_project_execute`,
`thoughtbox_project_search`, and a read tool can complete coding tasks — but every write is
traced and attributed to a reasoning session.

## Component Map

| Section | What it covers |
|---|---|
| [01 — Tool Surface](./01-tool-surface.md) | Tool schemas, `tp` SDK interface, session attribution protocol |
| [02 — Catalog and Codebase](./02-catalog-and-codebase.md) | ts-morph catalog design, `tp.codebase.*` operations, edit semantics |
| [03 — CLI Dispatch and Scope](./03-cli-dispatch-and-scope.md) | Dispatch table config, argument validation, blacklist model, elicitation flow |

## Deferred (Out of Scope for Phase 1)

- **PatternCards, DecisionCards, LessonCards** — the Knowledge plane from `.specs/codebase-as-api.md`
- **Session-end learning loop** — trace diffing against PatternCards
- **Work tracking** (Beads replacement) — ADR-019; Linear used in interim

## Key Invariants

1. `thoughtbox_project_execute` never executes without an active reasoning session.
2. `tp.codebase.edit()` never writes to a blacklisted path without elicitation-confirmed consent.
3. `tp.cli.exec()` never interpolates arguments into a shell string.
4. The ts-morph catalog is always the primary navigation surface; raw filesystem enumeration
   is available via `tp.codebase.listFiles()` but is a fallback, not the default path.
5. All project operations are appended to the active session trace as attributed events.
