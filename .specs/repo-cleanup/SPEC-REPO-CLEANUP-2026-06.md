---
spec_id: SPEC-REPO-CLEANUP
title: Repository Cleanup Execution Plan (June 2026)
status: active
date: 2026-06-03
branch: chore/repo-cleanup-tracker
claims:
  - id: c1
    statement: The cleanup series removes only revalidated dead or unsupported repo artifacts while preserving currently authoritative assets such as `.agents/` and `FileSystemStorage`.
    type: governance
    behavioral: false
    required_evidence: Cleanup tracker, per-branch diffs, and validation notes show deletions were revalidated and `.agents/` plus filesystem storage were intentionally retained.
  - id: c2
    statement: The cleanup series fixes verified stale configuration drift, including the broken `start:stateful` script and the Vitest include path that skipped `automation-self-improvement/agentops/tests/`.
    type: implementation
    behavioral: false
    required_evidence: `package.json` and `vitest.config.ts` change together with targeted validation commands that exercise the corrected paths.
  - id: c3
    statement: Research workflow assets become reproducible from tracked text sources under `research-workflows/`, and the repository no longer relies on a tracked mutable SQLite binary as the authoritative seed artifact.
    type: implementation
    behavioral: false
    required_evidence: `research-workflows/schema.sql` and `seed.sql` define the durable model, regeneration instructions exist, and `research-workflows/workflows.db` is removed from git tracking.
  - id: c4
    statement: Repo docs and cleanup governance artifacts explicitly record accepted cleanup decisions, validation evidence, and deferred items so later sessions can continue without re-auditing the same scope.
    type: governance
    behavioral: false
    required_evidence: The tracker and plan artifacts under `cleanup/` document decisions, branch breakdown, validation commands, audit corrections, and follow-up items.
links:
  - cleanup/2026-05-29-cleanup-audit.md
  - cleanup/2026-06-03-repo-cleanup-plan.md
  - cleanup/2026-06-03-repo-cleanup-tracker.md
---

## Repository Cleanup Execution Plan (June 2026)

This spec governs the cleanup series initiated from the 2026-05-29 repo audit.
The user approved the execution sequence, the shadow-tracker approach, and the
key ambiguity collapses that narrowed the scope.

## Scope locks

- Preserve `.agents/` because current `AGENTS.md` treats it as a tool-neutral
  fallback.
- Preserve `FileSystemStorage` for this cleanup series.
- Normalize `research-workflows/` instead of deleting it.
- Revalidate each delete target immediately before removal.

## Approved execution units

1. Tracker/bootstrap artifacts
2. Tier 1 safe cleanup and stale config fixes
3. Docs and authority alignment
4. Research workflow normalization before deleting stale regeneration copies
5. Archive/delete stale prototype clusters
6. Remove unsupported runtime surfaces (`.gemini/`, `.pi/`, local observability)
7. Branch cleanup, with remote deletions performed only from an explicit list

## Evidence model

Each branch in the cleanup series records:

- exact files changed
- validation commands run
- audit corrections discovered during revalidation
- follow-up items that remain out of scope
