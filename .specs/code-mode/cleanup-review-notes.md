# Code Mode Cleanup Review Notes

Date: 2026-03-23

Context: capture the remaining alignment questions and decisions after removing progressive disclosure and before implementing the Code Mode facade.

## Decisions

### 1. `thoughtbox_init`

Decision: `thoughtbox_init` must be removed; there is no compatibility target to preserve.

Reasoning:
- no external client protocol still depends on `thoughtbox_init` as a required entrypoint
- there is no remaining migration dependency for callers to call this legacy operation
- retaining it only preserves dead abstraction and contradicts the current direct-tool runtime contract

Implication:
- remove legacy init-entrypoint language from specs, resources, and tests that still reference `thoughtbox_init`
- `thoughtbox_init` is not part of the intended public interface
- the direct-tool surface is the authoritative interface contract

### 2. Resources and prompts in Code Mode

Direction:
- treat resources and prompts as effectively the same content class for Code Mode
- source content is mostly markdown plus a URI
- index that content together for search/discovery
- prefer serving relevant content back as embedded resources on tool calls instead of forcing agents to reason about standalone prompts vs standalone resources

Open implementation question:
- define how markdown-backed resources/prompts are selected, indexed, and attached during Code Mode search and execute flows

### 3. Gateway documentation

Decision: gateway docs should describe only the current server.

Implication:
- remove or rewrite historical gateway-first/init-first/cipher-first guidance from agent-facing docs
- avoid leaving historical workflow text in discoverability surfaces that Code Mode search may ingest

## Concrete Follow-Ups

1. Remove the `session_discovery` schema leftovers from `src/sessions/tool.ts` so the tool schema matches the handler.
2. Rewrite `src/resources/server-architecture-content.ts` to describe the actual registered tool surface rather than gateway/init/cipher-era abstractions.
3. Update search-facing resources that still instruct agents to call `thoughtbox_init`, `thoughtbox_cipher`, or `thoughtbox_gateway`.
4. Align init operation resource metadata in `src/server-factory.ts` and the remaining init catalog language with the decision that `thoughtbox_init` is intentionally gone.
5. Update `.specs/code-mode/target-state.md` to remove stale references to `thoughtbox_init` and deleted description-registry files.
6. Normalize remaining project-scope copy so it consistently reflects MCP roots plus `THOUGHTBOX_PROJECT`.

## Working Assumption For Code Mode

Code Mode should sit on top of the real direct-tool surface:
- `thoughtbox_session`
- `thoughtbox_thought`
- `thoughtbox_notebook`
- `thoughtbox_knowledge`
- `thoughtbox_theseus`
- `thoughtbox_ulysses`
- `thoughtbox_operations`
- `observability_gateway`
- `thoughtbox_hub` when configured

`observability_gateway` is explicitly part of the standard vehicle surface, not a fallback-only artifact.

The search layer should incorporate markdown guidance from resources/prompts, but that guidance should reinforce the current direct-tool model rather than preserve removed compatibility workflows.

This cleanup step is documentation/spec alignment only; no runtime behavior changes and no test/build execution are required for this pass.
