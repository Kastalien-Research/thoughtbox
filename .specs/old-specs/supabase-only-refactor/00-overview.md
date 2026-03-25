# Supabase-Only Protocol Enforcement: Overview

## What This Is

A series of specs describing the refactor of Theseus and Ulysses protocol
enforcement from local-filesystem state (`.theseus/session.json`,
`.ulysses/session.json`) to Supabase as the sole source of truth.

## Why

1. **Local files don't work across containers.** Cloud Run instances have
   ephemeral filesystems. A session started in one container is invisible to
   another.

2. **Local files only enforce within one runtime.** `pre_tool_use.sh` is
   Claude Code only. Gemini CLI, Codex, and future runtimes walk past it
   unless they also read local state — and they won't unless forced to.

3. **Supabase is already the infrastructure.** The decided architecture uses
   Supabase for all persistence. Local filesystem tricks add complexity for
   an offline scenario that isn't a real constraint.

4. **Protocol enforcement and protocol telemetry should share a backend.**
   Thoughtbox already records session thoughts in Supabase. Having enforcement
   state in a separate local file creates a split-brain risk.

## Scope

This refactor touches:

- `theseus.sh` — rewrite from local JSON to Supabase REST calls
- `ulysses.sh` — same treatment
- `pre_tool_use.sh` — add Supabase query for active protocol sessions
- Supabase schema — new tables for protocol sessions, scope, visas, audits
- Supabase RPC functions — single-roundtrip scope checks for hooks
- SKILL.md files — update to remove references to local state directories

This refactor does NOT touch:

- The Thoughtbox MCP server core (thoughts, sessions, gateway)
- The protocol logic itself (state machines, tollbooth, audit criteria)
- The SKILL.md workflow descriptions (Thoughtbox thought integration)

## Spec Index

| Spec | Title | Depends On |
|------|-------|------------|
| 01 | Supabase Schema | — |
| 02 | theseus.sh Rewrite | 01 |
| 03 | ulysses.sh Rewrite | 01 |
| 04 | Hook Enforcement | 01 |
| 05 | Migration & Cleanup | 02, 03, 04 |
