---
spec_id: SPEC-EFFECT-001
title: Effect-TS Incremental Refactor Plan
status: draft
date: 2026-06-08
branch: cursor/effect-refactor-spec-90f9
claims:
  - id: c1
    statement: The notebook engine remains the first Effect-TS migration surface and becomes the reference implementation for Schema, tagged errors, and service tags before other modules are migrated.
    type: governance
    behavioral: false
    required_evidence: "Implementation PRs first complete or extend `src/notebook/engine/*` and cite this spec before migrating unrelated handlers."
  - id: c2
    statement: MCP, Express, and Code Mode entrypoints stay imperative adapters that run Effect programs at the boundary instead of becoming Effect-native first.
    type: governance
    behavioral: false
    required_evidence: "Implementation PRs keep `src/index.ts`, `src/server-factory.ts`, and tool registration surfaces as adapter shells while moving inner domain programs to Effect."
  - id: c3
    statement: Boundary validation migrates incrementally from Zod result objects and ad hoc validation to Effect Schema decoders without changing public MCP request or response contracts.
    type: implementation
    behavioral: false
    required_evidence: "Branch/auth pilot PRs prove unchanged tool contracts with existing tests plus focused invalid-input tests."
  - id: c4
    statement: Stringly thrown domain errors are replaced inside migrated modules with tagged errors, while adapters translate them back to the existing protocol-specific error shapes.
    type: implementation
    behavioral: false
    required_evidence: "Migrated modules define tagged error unions and adapter tests assert the same client-facing `isError`, JSON-RPC, or thrown message behavior where contracts are already published."
  - id: c5
    statement: Storage, knowledge, hub, peer notebook, and protocol dependencies are introduced as Effect services and Layers only after small validation and broker pilots have established the adapter pattern.
    type: governance
    behavioral: false
    required_evidence: "A storage Layer PR references completed pilot PRs and begins with in-memory or filesystem implementations before Supabase-backed implementations."
  - id: c6
    statement: The thought-processing hot path is deferred until storage Layers, protocol pilots, and adapter error translation are verified.
    type: governance
    behavioral: false
    required_evidence: "No PR modifies `ThoughtHandler.processThought` or its serialization queue for Effect adoption until prerequisite claims in this spec are satisfied."
  - id: c7
    statement: Each migration slice preserves local filesystem/self-hosted behavior and deployed Supabase behavior rather than replacing either storage mode.
    type: behavioral
    behavioral: true
    required_evidence: "Each storage- or runtime-affecting PR runs targeted tests for in-memory/filesystem behavior and Supabase behavior where the repository already has Supabase test coverage."
links:
  - src/notebook/engine/domain.ts
  - src/notebook/engine/runtime.ts
  - src/notebook/index.ts
  - src/branch/schemas.ts
  - src/auth/api-key.ts
  - src/peer-notebook/broker.ts
  - src/persistence/types.ts
  - src/thought-handler.ts
  - src/server-factory.ts
  - src/index.ts
---

# Effect-TS Incremental Refactor Plan

## Summary

Thoughtbox should adopt Effect-TS from the inside out, starting where the codebase
already uses it: the notebook evidence engine. The migration should not begin by
rewriting HTTP, MCP tool registration, or the top-level server factory. Those
surfaces are transport adapters and should remain straightforward imperative
shells that run Effect programs and translate typed errors into the current
public response contracts.

The desired end state is a Thoughtbox core whose domain programs use Effect
`Schema`, tagged errors, services, and Layers for validation, failure modeling,
and dependency wiring, while existing MCP, Express, Code Mode, filesystem, and
Supabase behavior remains compatible.

## Source Of Truth Preflight

### Unit

Write an implementation-ready architecture spec for a future incremental
Effect-TS refactor of Thoughtbox.

### Non-goals

- Do not implement the refactor in this spec PR.
- Do not replace Zod everywhere in one pass.
- Do not rewrite MCP or Express transport code as the first migration unit.
- Do not remove FileSystemStorage, InMemoryStorage, or SupabaseStorage.
- Do not change public tool names, operation names, JSON response shapes, or
  published error formatting as part of the first migration slices.

### Canonical model

The canonical Effect reference model is `src/notebook/engine/domain.ts` plus
`src/notebook/engine/runtime.ts`.

These files already use:

- Effect `Schema` for notebook documents, cells, outputs, and run states.
- `Data.TaggedError` for notebook engine error variants.
- `Context.Tag` for planned store, artifact, run-store, and sandbox services.
- `Effect.gen`, `Effect.fail`, and `Effect.try` in the in-memory runtime.

Future Effect code should conform to this style before inventing new wrappers.

### Legacy and competing models

- `src/notebook/types.ts` still defines Zod schemas for the older notebook
  handler and validator path. It is legacy-live, not dead code.
- `src/branch/schemas.ts`, `src/notebook/tool.ts`, `src/protocol/*-tool.ts`,
  `src/observability/gateway-handler.ts`, and `src/peer-notebook/manifest.ts`
  use Zod at public tool or manifest boundaries. These are adapter/boundary
  models until each slice migrates.
- `src/persistence/types.ts` defines `ThoughtboxStorage`, the canonical storage
  port for thought/session persistence. Effect services should wrap or implement
  this port; they should not create a parallel persistence vocabulary.
- `src/knowledge/types.ts` and `src/hub/hub-types.ts` define parallel storage
  ports for knowledge and hub state. They should migrate after the
  `ThoughtboxStorage` service pattern is proven.

### Control-plane models

- `src/peer-notebook/types.ts` and `src/peer-notebook/broker.ts` define
  peer-notebook control-plane state and broker invocation flow.
- `src/protocol/in-memory-handler.ts` and `src/protocol/handler.ts` define
  Ulysses/Theseus protocol runtime state. The in-memory handler is the safer
  pilot target; the Supabase handler follows after shared semantics are
  extracted.

### Adapters needed

- MCP tool adapters translate typed Effect failures to `{ content, isError }`
  responses.
- Express route adapters translate typed Effect failures to HTTP status and
  JSON-RPC error bodies.
- Server factory adapters construct Layers or provide services, but should not
  host domain business logic.
- Code Mode adapters expose the same `tb` SDK shape while calling Effect-backed
  programs internally.

### Illegal states currently representable

The migration should reduce these states slice by slice:

- Completed notebook runs without required outputs or artifacts can be
  represented by legacy plain objects; the Effect notebook run schema already
  rejects invalid run shapes.
- API-key auth collapses missing env, invalid key format, inactive key, lookup
  failure, and hash mismatch into ordinary `Error` messages.
- Branch validation returns `{ ok: true, data: unknown }`, so downstream code
  must cast operation inputs back to handler parameter types.
- Peer notebook errors use an `Error` subclass with a string `code`, but the
  compiler does not force exhaustive handling in adapters.
- `ThoughtboxStorage` methods expose broad `Promise<T>` signatures, so scoping,
  not-found, backend-unavailable, and conflict failures are not visible in the
  type channel.
- Protocol handlers represent state as mutable records with status strings and
  nullable fields; invalid lifecycle transitions are enforced procedurally
  rather than by typed transitions.
- `ThoughtHandler` serializes concurrent work with a promise queue, but the
  queue is not modeled as a typed concurrency primitive.

### Acceptance-to-enforcement map

| Acceptance item | Enforcing artifact |
|---|---|
| Notebook is the first Effect reference surface | `src/notebook/engine/domain.ts`, `src/notebook/engine/runtime.ts`, notebook engine tests |
| Public contracts do not change | Adapter tests for MCP content, JSON-RPC errors, and Code Mode SDK responses |
| Validation migrates safely | Effect `Schema` decoders at operation boundaries plus invalid-input tests |
| Errors become typed internally | `Data.TaggedError` unions and exhaustive adapter translation tests |
| Dependencies move behind services | `Context.Tag` services and `Layer` composition at module/factory boundaries |
| Dual storage remains supported | Existing persistence tests for in-memory/filesystem and Supabase-backed storage |
| Hot-path thought processing is deferred | Scope locks in this spec and PR claim references |

### New types and services proposed

The migration may introduce these services only in the slices that own them:

- `ThoughtboxConfigService` for validated environment and server config.
- `AuthService` for request/API-key authentication.
- `BranchService` for branch operation validation and dispatch.
- `PeerNotebookRepositoryService` and `RuntimeProviderService` around existing
  peer notebook ports.
- `ThoughtboxStorageService`, `KnowledgeStorageService`, and `HubStorageService`
  around existing storage ports.
- `ProtocolRuntimeService` after the in-memory protocol pilot extracts shared
  transition semantics.

### Reuse decision

New Effect services must wrap existing source-of-truth ports and domain models.
They must not create duplicate storage, notebook, peer, protocol, or thought
domain objects. The notebook engine is the style source of truth for Effect
schemas and tagged errors. `ThoughtboxStorage` remains the storage contract.

### Surprises

- Effect is already a production dependency and already used in notebook engine
  code.
- Existing Effect service tags in the notebook engine are declared but not yet
  wired through Layers.

### Proceed or pause

Proceed with a spec-only change. Implementation should pause at each phase gate
until the previous phase has test evidence and adapter-contract evidence.

## Design Principles

1. **Effect inside, adapters outside.** Domain modules return Effect programs;
   public shells run them and translate results.
2. **Typed errors are internal authority.** Client-facing messages remain stable,
   but migrated modules stop using unstructured `throw new Error(...)` for
   domain outcomes.
3. **Layer composition happens at module edges.** Factories assemble concrete
   services; domain code asks for services through tags.
4. **Schema migration follows ownership.** Migrate schemas owned by the module
   being refactored. Do not mass-convert every Zod schema.
5. **Dual backend is invariant.** Filesystem/local and Supabase/deployed storage
   remain first-class.
6. **Hot paths come late.** `ThoughtHandler`, server startup, HTTP sessions, and
   Code Mode VM execution wait until smaller slices prove the pattern.

## Phased Migration Plan

### Phase 0: Notebook engine completion

Scope:

- `src/notebook/engine/domain.ts`
- `src/notebook/engine/runtime.ts`
- `src/notebook/index.ts`
- `src/notebook/__tests__/engine.test.ts`

Changes:

- Replace direct in-memory maps in the runtime with services behind existing
  `NotebookStoreService`, `NotebookRunStoreService`, `ArtifactStoreService`,
  and `SandboxExecutorService` tags.
- Add concrete in-memory Layers for the current behavior.
- Keep `NotebookHandler` as the MCP-facing adapter that runs Effect programs.
- Remove dynamic `import("effect")` once import-cycle or bundle concerns are
  verified; prefer static imports if they do not worsen cycle checks.

Acceptance:

- Existing notebook engine tests pass.
- Invalid notebook shapes still fail through Effect Schema decoding.
- `notebook_start_run`, `notebook_list_runs`, `notebook_cancel_run`, and
  `notebook_get_artifact` keep their current response shapes.

### Phase 1: Small boundary pilots

Scope:

- `src/branch/schemas.ts`
- `src/branch/index.ts`
- `src/auth/resolve-request-auth.ts`
- `src/auth/api-key.ts`
- `src/evaluation/langsmith-config.ts`
- Optionally the small `configSchema` block in `src/server-factory.ts`

Changes:

- Introduce Effect Schema decoders for branch operation inputs.
- Return typed validation failures internally, then translate them to the same
  branch toolhost `{ success: false, error }` JSON text payload.
- Introduce tagged auth/config errors such as `MissingApiKey`,
  `InvalidApiKeyFormat`, `InactiveApiKey`, and `AuthServerMisconfigured`.
- Wrap Supabase and bcrypt calls with `Effect.tryPromise`.
- Introduce a small config service for LangSmith and server config parsing.

Acceptance:

- Branch invalid-input behavior remains user-friendly and includes all relevant
  validation failures.
- Auth routes continue returning the same public 401/403 style messages through
  their adapters.
- Missing Supabase environment variables are typed internally and still produce
  the existing external misconfiguration message where currently exposed.

### Phase 2: Peer notebook broker orchestration

Scope:

- `src/peer-notebook/types.ts`
- `src/peer-notebook/broker.ts`
- `src/peer-notebook/repositories.ts`
- `src/peer-notebook/runtime-provider.ts`
- Existing broker tests

Changes:

- Convert `PeerNotebookError` to tagged errors or wrap it behind a tagged error
  union while preserving exported compatibility if needed.
- Introduce repository, runtime-provider, timeout, and clock services.
- Convert `PeerBroker.invoke` into an Effect program internally.
- Keep `createPeerBroker` and handler APIs compatible for callers.

Acceptance:

- Broker tests still prove peer lookup, active manifest checks, schema
  validation, runtime dispatch, output validation, and trace event writes.
- Timeout and invalid-result failures are typed internally and translated to the
  same caller-visible error code semantics.

### Phase 3: In-memory protocol runtime pilot

Scope:

- `src/protocol/in-memory-handler.ts`
- Shared protocol transition helpers if extracted
- Existing protocol in-memory tests

Changes:

- Extract transition functions into typed Effect programs before touching the
  Supabase-backed `src/protocol/handler.ts`.
- Model protocol failures as tagged errors, including no active session,
  reflect-required, visa-required, validator-not-configured, and invalid
  lifecycle transition.
- Preserve the current public Ulysses/Theseus tool adapters.

Acceptance:

- Existing Ulysses and Theseus in-memory protocol tests pass.
- Enforcement behavior for reflect gating and scope/test gating remains
  unchanged.
- Supabase-backed protocol code is not modified in this phase except through
  shared pure helpers that are covered by tests.

### Phase 4: Storage services and Layers

Scope:

- `src/persistence/types.ts`
- `src/persistence/storage.ts`
- `src/persistence/filesystem-storage.ts`
- `src/persistence/supabase-storage.ts`
- Existing persistence tests

Changes:

- Introduce `ThoughtboxStorageService` as an Effect service around the existing
  `ThoughtboxStorage` contract.
- Begin with `InMemoryStorage` and `FileSystemStorage` Layers.
- Add `SupabaseStorage` Layer after local storage behavior is stable.
- Model storage errors that callers can act on: not scoped, not found,
  conflict, backend unavailable, validation failure, and permission/workspace
  mismatch.
- Do not remove the existing interface until all callers have migrated.

Acceptance:

- Existing persistence roundtrip tests pass.
- Filesystem project scoping remains unchanged.
- Supabase-backed tests that already exist remain green.
- Callers can provide either filesystem/local or Supabase/deployed storage via
  Layer composition.

### Phase 5: Sessions, observability, knowledge, and hub services

Scope:

- `src/sessions/handlers.ts`
- `src/observability/gateway-handler.ts`
- `src/knowledge/*`
- `src/hub/*`

Changes:

- Convert constructor-injected dependencies to services where the module has a
  clear domain boundary.
- Keep gateway handlers as adapters.
- Preserve existing operation catalogs and Code Mode search/execute behavior.

Acceptance:

- Session list/get/search behavior is unchanged.
- Observability gateway still formats operation results and errors exactly as
  current callers expect.
- Knowledge and hub storage continue using their existing persistence backends.

### Phase 6: Thought handler and server wiring

Scope:

- `src/thought-handler.ts`
- `src/server-factory.ts`
- `src/index.ts`

Prerequisites:

- Phase 0 through Phase 4 are implemented and verified.
- Adapter translation patterns are documented in code and tests.
- Storage services support both local/filesystem and Supabase modes.

Changes:

- Replace the promise serialization queue in `ThoughtHandler` with an Effect
  concurrency primitive only after behavior is covered by concurrent request
  tests.
- Move thought validation to Effect Schema only after existing thought tool
  schemas and response contracts are protected by tests.
- Keep `createMcpServer` and `/mcp` request handling as boundary assembly code.
- Use the server factory to provide Layers, not to host domain logic.

Acceptance:

- Concurrent thought submissions remain serialized.
- Existing thought response content and error responses remain compatible.
- Multi-tenant Supabase session routing and local filesystem mode both work.

## Testing And Evidence Requirements

Every implementation PR that references this spec must include:

- The exact spec claims it satisfies.
- Targeted unit or integration tests for the migrated module.
- Adapter-contract tests when public response shapes are involved.
- At least one negative-path test for typed errors or schema failures.
- Storage-mode evidence for any slice touching persistence or server assembly.

Suggested commands by phase:

- Notebook: `pnpm vitest run src/notebook/__tests__/engine.test.ts`
- Branch/auth pilots: targeted tests for branch validation and auth adapters.
- Peer broker: `pnpm vitest run src/peer-notebook/__tests__/broker.test.ts`
- Protocol pilot: `pnpm vitest run src/protocol/__tests__/ulysses-state-machine.test.ts src/protocol/__tests__/enforcement.test.ts`
- Storage: existing persistence test commands plus Supabase tests when the slice
  touches Supabase-backed code.
- Cross-cutting sanity: `pnpm check:types` and `pnpm check:lint`

## Rollout Rules

- Each phase lands as one or more small PRs.
- Each PR must preserve public behavior unless its spec claim explicitly says
  the contract changes.
- Effect adoption may coexist with Zod during migration.
- A module can expose Promise-returning compatibility functions while its
  internals use Effect.
- No phase may delete an existing storage backend.
- No phase may introduce a second domain model for notebooks, thoughts,
  sessions, peer manifests, protocol sessions, or storage records.

## Open Questions

1. Should the repo standardize on Effect Schema for all future public operation
   inputs, or keep Zod at MCP tool definitions because surrounding MCP tooling
   already expects Zod/JSON Schema conversion?
2. Should storage services expose the existing broad `ThoughtboxStorage`
   interface as one tag, or split config/session/thought/run/branch operations
   into smaller services?
3. Should `PeerNotebookError` preserve its current class export indefinitely for
   compatibility, or move fully to `Data.TaggedError` once all local callers are
   migrated?
4. Should server config use Effect Config immediately, or a smaller Schema-based
   wrapper first to avoid coupling startup to a broader config runtime?
5. Which Supabase tests are required before declaring storage Layer parity,
   given local environments sometimes lack Supabase credentials?

## Initial Implementation Slice Recommendation

The first implementation PR should be limited to Phase 0:

1. Add in-memory Layers for the notebook engine service tags.
2. Make `InMemoryNotebookEngineRuntime` depend on those services internally.
3. Keep `NotebookHandler` response behavior unchanged.
4. Extend `src/notebook/__tests__/engine.test.ts` to prove service-backed run
   creation, artifact persistence, cancellation, and invalid mode handling.

This slice has the smallest blast radius, reuses the existing Effect island, and
creates concrete examples for later migrations.
