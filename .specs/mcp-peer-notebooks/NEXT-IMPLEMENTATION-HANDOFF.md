# MCP Peer Notebooks Implementation Handoff

**Status**: Follow-on handoff after the MCP-facing mock broker pilot
**Date**: 2026-04-30
**Governing ADR/spec**: ADR-022 and `SPEC-CONTROL-PLANE.md`
**Current issue**: `thoughtbox-39o`

## Completed In This Slice

- Added `thoughtbox_peer_notebook` as the smallest MCP-facing pilot surface for
  the existing mock `claim-extractor` broker.
- Kept state in memory and execution mock-only.
- Supported artifact seed, peer invoke, invocation read, trace event list, and
  artifact read operations.
- Bootstrapped one deterministic active `claim-extractor` manifest per
  workspace using `compilePeerManifestDraft()`.
- Registered only the mock runtime provider; `local-process` and `smolvm`
  remain deferred.

## Still Deferred

- Supabase migrations and durable peer/artifact storage.
- Web app pages for peer registry, invocations, traces, and artifacts.
- Local-process provider.
- smolvm provider and execution-plane infrastructure.
- Public/direct runtime MCP.
