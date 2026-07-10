---
spec_id: SPEC-HUB-003
title: Durable Agent Identity — stateless, principal-bound hub identity
status: draft
date: 2026-07-10
branch: feat/hub-durable-identity
claims:
  - id: c1
    statement: >-
      AgentIdentity carries an optional ownerPrincipal field. register and
      quick_join persist it whenever the request carries an authenticated
      principal (hosted multi-tenant mode: the API key id or OAuth subject
      that authenticated the request). In local fs mode the field is absent.
    type: implementation
    behavioral: false
    required_evidence: >-
      ownerPrincipal on the AgentIdentity type in src/hub/hub-types.ts plus
      registration tests asserting the persisted record carries the caller's
      principal in hosted mode and omits it in local mode.
  - id: c2
    statement: >-
      Hub identity resolution is per-request and consults no session state.
      An explicit agentId on a hub mutation resolves iff a durable agent
      record exists in hub storage and the mode-specific ownership check
      (c3) passes. SessionIdentityRegistry and its registered-in-this-
      session requirement are removed from the resolution path of every
      namespace that used it (tb.hub, tb.claims, tb.merge).
    type: behavioral
    behavioral: true
    required_evidence: >-
      Resolver unit tests exercising explicit-agentId resolution against
      storage with no prior register call in the same handler session;
      wiring tests for hub, claims, and merge handlers; no remaining
      import of session-identity.ts in src/ (the module is deleted).
  - id: c3
    statement: >-
      Ownership is checked per deployment mode. Hosted multi-tenant mode:
      the caller's authenticated principal must match the agent record's
      ownerPrincipal or the call fails with an authorization error; a
      legacy record with no ownerPrincipal is adopted by the first
      principal that successfully acts as it (the principal is stamped on
      first use). Local fs mode: any explicit agentId with an existing
      record resolves — the trust boundary is the local machine, matching
      the existing THOUGHTBOX_AGENT_NAME assertion-based behavior.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Hosted-mode tests: wrong-principal act-as rejected; same-principal
      act-as succeeds from a fresh connection; legacy no-principal record
      adopted and stamped on first authenticated use. Local-mode test:
      explicit agentId resolves with no ownership check.
  - id: c4
    statement: >-
      Coordinator power survives reconnection. A workspace coordinator can
      perform coordinator-only operations (merge_proposal) from a new
      connection or session by passing its agentId explicitly, with no
      re-registration, provided the c3 ownership check passes. Re-register
      is never required to recover an existing identity.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Test: register + create_workspace + create/approve proposal in one
      handler session, then merge_proposal via a second handler instance
      (different or absent mcpSessionId) using the same agentId — succeeds
      in local mode and in hosted mode under the same principal.
  - id: c5
    statement: >-
      Implicit (agentId-less) identity resolves only from process-level env
      configuration (THOUGHTBOX_AGENT_ID / THOUGHTBOX_AGENT_NAME), applied
      uniformly to every request regardless of session. The first-
      registration-in-a-session-becomes-default behavior is removed. Absent
      env configuration, an agentId-less mutation fails with an error that
      names the explicit-agentId requirement and echoes how to obtain one.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Tests: env-configured identity applies to a request on a session that
      never called register (regression for the envResolved first-session
      bug); with no env config, agentId-less mutation returns the
      instructive error; register no longer changes resolution of later
      agentId-less calls in the same session.
  - id: c6
    statement: >-
      A transfer_coordinator operation exists. The current coordinator may
      transfer coordinatorship of a workspace to another registered member.
      In hosted mode, the principal that owns the workspace-creating agent
      may also transfer coordinatorship to an agent it owns even when the
      original coordinator agentId is lost, covering identity loss without
      credential loss. Credential rotation without prior transfer remains a
      documented unrecoverable case in v1.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Tests: coordinator-initiated transfer succeeds and old coordinator
      loses merge_proposal; non-coordinator transfer rejected in local
      mode; hosted-mode owning-principal transfer succeeds with a fresh
      agentId under the same principal and is rejected under a different
      principal.
  - id: c7
    statement: >-
      Identity behavior is independent of the protocol session. The same
      call sequence produces identical resolution results whether
      mcpSessionId is provided or not, so the hub identity layer requires
      no changes when the transport moves to MCP 2026-07-28 sessionless
      operation.
    type: behavioral
    behavioral: true
    required_evidence: >-
      Parametrized test running the register/act-as/coordinator scenarios
      twice — once with distinct mcpSessionId values per call, once with
      none — asserting identical outcomes.
  - id: c8
    statement: >-
      Operator-facing guidance is updated in the same change that
      implements this spec (the PR satisfying c1-c7, not the spec-authoring
      PR): the .claude/team-prompts/ bootstrap instructions and
      .claude/rules/mcp-gotchas.md no longer describe session-default
      identity or permanent coordinator loss, and instead document explicit
      agentId, principal binding, and transfer_coordinator.
    type: governance
    behavioral: false
    required_evidence: >-
      Diff in the implementation PR updating .claude/team-prompts/*.md and
      .claude/rules/mcp-gotchas.md to the new identity model.
links:
  - .specs/SPEC-HUB-002-hierarchical-agent-roles.md
  - .specs/hub-deployed/SCOPE-LAYER-2-SUPABASE-HUB-STORAGE.md
  - .specs/deployment/v1-initiative.md
  - https://modelcontextprotocol.io/seps/2567-sessionless-mcp
  - https://modelcontextprotocol.io/specification/draft/changelog
  - src/hub/session-identity.ts
  - src/hub/hub-tool-handler.ts
  - src/hub/agent-identity.ts
  - src/hub/identity.ts
---

# SPEC-HUB-003: Durable Agent Identity

## Problem

Hub state is durable; hub identity is not. `AgentIdentity` records persist in
both storage backends (`hub-storage-fs.ts`, `supabase-hub-storage.ts`), but the
*binding* between a connection and an agentId lives in
`SessionIdentityRegistry`, an in-process map keyed on the MCP session id
(`hub-tool-handler.ts:85`, falling back to `'__default__'`). Consequences:

- An explicit `agentId` is only accepted if it was registered **in the same
  MCP session**. There is no way to act as an existing agent from a new
  connection; `register` always mints a fresh UUID.
- Coordinator role stays bound to the creating agentId, so `merge_proposal`
  is permanently lost when the coordinator's session ends
  (documented today in `.claude/rules/mcp-gotchas.md` as "lose coordinator
  role permanently").
- The first registration in a session becomes the implicit default identity
  for agentId-less calls — a misattribution hazard for sub-agents sharing a
  parent's MCP session, worked around by prompt discipline in
  `.claude/team-prompts/`.
- The env-var identity path has a latent bug: the `envResolved` flag in
  `hub-tool-handler.ts` is handler-global, so env-resolved identity registers
  only into whichever session touches the handler first.

Two forces make this worth fixing now:

1. **Agent-team collaboration.** The hub's differentiating value over native
   Claude Code agent teams is durable, cross-session, cross-client
   collaboration (workspaces, proposals, consensus that outlive a session).
   That pitch is hollow while identity — and coordinator power with it —
   dies with the connection.
2. **MCP goes stateless.** The MCP `2026-07-28` release candidate (locked
   2026-05-21, final 2026-07-28) removes protocol-level sessions and the
   `Mcp-Session-Id` header entirely (SEP-2567) and removes the
   `initialize` handshake (SEP-2575). Under that revision every request
   would land in the registry's `'__default__'` bucket, silently collapsing
   all callers into one identity. The spec's prescribed replacement for
   session state — "explicit, server-minted handles passed as ordinary tool
   arguments" — is exactly what `agentId` already is. The session registry
   is the only part of hub identity the new protocol invalidates.

## Design

### Principle

The durable agent record is the source of identity truth. A request proves
its right to an agentId with what the request itself carries: the explicit
`agentId` argument (the handle) plus, in hosted mode, the authenticated
principal. No per-connection state participates in resolution.

### Resolution algorithm

For every hub/claims/merge call, per request:

```
resolve(explicitAgentId, requestPrincipal):
  if explicitAgentId:
    record = storage.getAgent(explicitAgentId)
    if !record: error "unknown agent"
    if hostedMode:
      if record.ownerPrincipal == null:
        record.ownerPrincipal = requestPrincipal   # legacy adoption, stamped on first use
      else if record.ownerPrincipal != requestPrincipal:
        error "agent owned by another principal"
    return record.agentId
  else:
    envId = resolveAgentId(storage, env.THOUGHTBOX_AGENT_ID, env.THOUGHTBOX_AGENT_NAME)
    if envId: return envId                          # uniform, every request (fixes envResolved bug)
    error "hub mutations require an explicit agentId; register returns one — record and reuse it"
```

`register`/`quick_join` stamp `ownerPrincipal` at creation (c1) and their
results remain the handle the caller must carry (the MCP explicit-handle
pattern). `SessionIdentityRegistry` is deleted, not repaired (c2); the
same-session guard, the first-registration default, and the shared-session
misattribution hazard cease to exist as concepts.

### Trust model by mode

- **Hosted (Supabase, multi-tenant).** Hub storage is already scoped by
  `tenant_workspace_id`, so cross-tenant impersonation is structurally
  impossible; `ownerPrincipal` narrows identity *within* a tenant to the
  credential that created it. Requires plumbing the authenticated principal
  (API key id / OAuth subject) from the transport layer into the tool
  handlers — today `hubToolHandler.handle()` receives only `mcpSessionId`.
  The exact SDK surface for per-request auth context is an implementation-
  time verification item; on the eventual SDK v2 migration this maps to
  per-request bearer verification and the identity layer is unchanged (c7).
- **Local (fs).** Assertion-based: any existing agentId resolves. This is
  not a weakening — local mode's trust boundary is the machine, and the
  existing `THOUGHTBOX_AGENT_NAME` lookup already adopts agents by
  assertion. Making that honest and uniform beats simulating security with
  hub-level secrets nobody is threatened by.

### Rejected alternative: resume tokens

A `register`-returned bearer secret (hash stored on the record, presented to
a `resume` operation) was considered and rejected for v1: in hosted mode it
duplicates the auth layer that already authenticates every request, and in
local mode it protects nothing the filesystem doesn't already expose. A
`resume` operation itself is unnecessary once resolution is per-request —
there is no session to resume into.

### Coordinator continuity and transfer

With identity resumable, coordinator role follows automatically: role lives
on the durable record and workspace membership, so a coordinator reconnecting
under the same principal (hosted) or same agentId (local) keeps
`merge_proposal` (c4). `transfer_coordinator` (c6) covers the residual
lost-identity case; credential rotation without prior transfer is documented
as unrecoverable in v1 rather than papered over.

### Breaking change: implicit session default removed

Today a solo agent can `quick_join` and then issue agentId-less mutations.
After this change, agentId-less mutations require env-configured identity or
fail with an instructive error (c5). The well-behaved path — the
`.claude/team-prompts/` instruction to pass `agentId` explicitly on every
call — is unchanged; the footgun path is removed rather than fixed.
Registration responses and the error message both carry the guidance, and
the team prompts and `mcp-gotchas.md` are updated in the same change that
implements this spec (c8).

## Out of scope

- SDK v2 / MCP `2026-07-28` transport migration (separate unit of work;
  this spec removes the identity-layer blocker for it).
- Cross-client push notification of hub events (polling via
  `read_channel({since})` remains the cross-session mechanism).
- Human-user identity in `apps/web` (Supabase Auth) — this spec covers
  agent identity on the MCP/HTTP hub surface only.

## Acceptance

Each claim maps to vitest suites colocated under `src/hub/__tests__/` (and
wiring tests for claims/merge namespaces), runnable via `pnpm vitest run`.
c3/c4/c6 hosted-mode paths run against the in-memory/test double of
`HubStorage` with a stubbed principal; live Supabase verification rides the
existing hub-deployed acceptance flow. c8 is verified by diff inspection in
the PR.
