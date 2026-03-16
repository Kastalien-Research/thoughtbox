# SPEC-CORE-002B: Code Mode Gateway Replacement End State

> **Status**: Draft
> **Related**: `SPEC-CORE-002-code-mode-thoughtbox.md`

## Scope

This document describes the application state after Thoughtbox no longer depends on `thoughtbox_gateway` as its core orchestration boundary.

It describes the resulting codebase state only. It does not prescribe migration order, implementation steps, or deployment mechanics.

## Resulting Application State

- Thoughtbox is organized around a Code Mode-native reasoning contract.
- The application no longer depends on a generic string-keyed gateway router as the primary boundary between clients and domain capabilities.
- Model-facing reasoning, session, notebook, knowledge, and mental-model work is expressed through a typed Thoughtbox execution surface.
- The application’s primary reasoning surface is centered on code execution and capability discovery, not on flattened operation dispatch.

## Public Interface State

- `search` is the canonical discovery surface for Thoughtbox capabilities, schemas, and policy boundaries.
- `execute` is the canonical authoring and orchestration surface for Thoughtbox reasoning work.
- The public reasoning API is described in terms of capabilities and typed authoring primitives rather than a gateway operation enum.
- Any remaining gateway-shaped interface is explicitly compatibility-only and contains no unique business logic.

## Authoring State

- Code running inside `execute` has access to a stable `tb` library that exposes the full supported Thoughtbox reasoning surface.
- The authoring surface is domain-oriented and typed.
- Author-authored code does not construct raw `{ operation, args }` gateway payloads.
- Author-authored code does not need to know internal transport compression rules in order to use Thoughtbox correctly.

## Internal Contract State

- Core Thoughtbox domains are reachable through direct capability contracts rather than through a central flattened gateway router.
- Capability metadata is derived from the primary runtime contract, not from a separate operation-registry-only layer.
- Progressive disclosure, scope binding, session continuity, and agent identity remain first-class rules of the system.
- Those rules are expressed as runtime capability availability and policy constraints rather than as a requirement to traverse a generic router tool.

## Canonical IR State

- Canonical IR exists as the internal normalization layer for all reasoning records, tool activity, stateful mutations, and relevant outputs.
- All supported reasoning paths normalize into Canonical IR.
- Canonical IR is the stable internal semantic substrate for persistence, projection, retrieval, export, and replay.
- The Thoughtbox cipher remains optional and non-canonical.

## Retrieval and Projection State

- Search, replay, graph traversal, and analytical views are derived from Canonical IR and its projections.
- The application code exposes a coherent capability catalog and a coherent reasoning record model.
- Retrieval consumers do not need to infer structure from gateway routing decisions or handwritten payload conventions.

## Compatibility State

- Compatibility clients, if still supported, are served by shims layered over the primary Code Mode-native contract.
- Compatibility surfaces do not define the internal architecture.
- The codebase has a single primary reasoning contract, and that contract is the Code Mode surface.
