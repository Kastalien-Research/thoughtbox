# SPEC-CORE-002A: Code Mode Facade End State

> **Status**: Draft
> **Related**: `SPEC-CORE-002-code-mode-thoughtbox.md`

## Scope

This document describes the application state after Thoughtbox gains a Code Mode facade while retaining the existing gateway-centered domain contract underneath it.

It describes the resulting codebase state only. It does not prescribe migration order, implementation steps, or deployment mechanics.

## Resulting Application State

- Thoughtbox is Code Mode-first for reasoning clients.
- The primary model-facing interaction surface is a small MCP API centered on discovery and execution rather than a large operation-by-operation contract.
- Model-authored work is expressed through a typed Thoughtbox authoring library inside server-side execution, not through handwritten gateway payloads or manual cipher strings.
- Existing reasoning, session, notebook, knowledge, and mental-model behavior remains semantically consistent with the pre-facade system.

## Public Interface State

- `search` is the default discovery surface for Thoughtbox capabilities, schemas, and context boundaries.
- `execute` is the default authoring surface for model-directed work.
- `thoughtbox_gateway` remains available as a compatibility interface for non-Code-Mode clients and for clients that still operate against the current operation-based contract.
- `thoughtbox_operations` remains available as a compatibility catalog for operation-oriented clients.
- `observability_gateway` and `thoughtbox_hub` remain distinct, intentionally named MCP tool surfaces.

## Authoring State

- Code running inside `execute` has access to a typed `tb` library that exposes Thoughtbox concepts directly.
- The `tb` surface is stable, compact, and domain-oriented.
- The authoring surface is centered on reasoning objects, queries, and task-level operations rather than flattened string operation names.
- Code authored against the facade does not need to know the gateway operation enum or the transport codec layout.

## Internal Contract State

- The gateway remains a supported internal orchestration boundary for core Thoughtbox domains.
- The existing operation catalogs remain valid and continue to describe the behavior of the underlying reasoning system.
- Gateway-stage semantics, project scoping, session continuity, and agent identity rules are preserved across both Code Mode and compatibility entrypoints.
- The application has a clear split between:
  - model-facing authoring surfaces
  - internal operation/domain surfaces
  - persistence and indexing surfaces

## Canonical IR State

- Canonical IR exists as an internal normalization layer.
- Records produced by Code Mode execution are normalized into Canonical IR before they are persisted, projected, exported, or indexed.
- Canonical IR is not the required authoring format for clients.
- Canonical IR does not require the removal of existing `ThoughtData`-shaped storage, session exports, or other compatibility-oriented data contracts.
- The Thoughtbox cipher remains available as an optional notation or serialization layer, not as the canonical internal source of truth.

## Retrieval and Projection State

- Retrieval-oriented structures are derived from Canonical IR rather than reconstructed from ad hoc payload formats.
- The codebase has stable projections for session replay, graph traversal, lexical retrieval, and other analytical views.
- Queryable reasoning structure is available without requiring clients to parse handwritten cipher text.

## Compatibility State

- Existing clients that rely on gateway operations continue to function.
- New model-facing clients are expected to prefer Code Mode surfaces.
- The facade is the preferred front door for reasoning workflows, while the gateway remains the compatibility and internal-domain contract.
