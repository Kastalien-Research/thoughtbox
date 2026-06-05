# Web, Docs, Tests, And Cleanup Triage Map

## Web App Surface

`apps/web` is a real product app.

Public routes:

- `/`
- `/pricing`
- `/support`
- `/terms`
- `/privacy`
- `/explore`
- `/explore/[sessionSlug]`
- `/docs/*`

Auth routes:

- `/sign-in`
- `/forgot-password`
- `/reset-password`
- `/sign-up`
- `/sign-up/claim`

Workspace routes:

- `/app`
- `/w/[workspaceSlug]/dashboard`
- `/w/[workspaceSlug]/sessions`
- `/w/[workspaceSlug]/sessions/[sessionId]`
- `/w/[workspaceSlug]/sessions/[sessionId]/explore`
- `/w/[workspaceSlug]/observability`
- `/w/[workspaceSlug]/api-keys`
- `/w/[workspaceSlug]/connect`
- `/w/[workspaceSlug]/billing`
- `/w/[workspaceSlug]/usage`
- `/w/[workspaceSlug]/settings/account`
- `/w/[workspaceSlug]/settings/workspace`
- `/w/[workspaceSlug]/docs/quickstart`

Implemented app capabilities:

- Supabase auth middleware protects `/w/*` and `/app`.
- Server actions exist for sign-in, forgot/reset password, API keys, workspace
  settings, account settings, billing, and Stripe flows.
- Session pages read `workspaces`, `sessions`, `runs`, `otel_events`, and
  `thoughts`.
- Realtime session updates exist through Supabase channels.

Main drift:

- `apps/web/README.md` says auth, API keys, real runs/thought data, and Stripe
  billing are not implemented. Source says they are implemented.
- README route maps mention `/projects` and `/runs`; actual app uses
  `/sessions`.

## Specs And ADRs

Likely live-governing:

- `.adr/README.md`: lifecycle and acceptance rules for ADRs.
- `.adr/accepted/ADR-011-gateway-schema-surfacing.md`: live intent, but the
  `thoughtbox_operations` claim now conflicts with registration.
- `.adr/accepted/ADR-015-protocol-mcp-tools.md`: protocol tooling direction and
  explicit deferred work.
- `.adr/staging/ADR-022.json` and `.specs/mcp-peer-notebooks/*`: peer notebook
  current slice plan.
- `.specs/security/identity-binding-audit.md`: security remediation status and
  remaining medium/low debt.

Likely stale/aspirational:

- `.specs/README.md` and `.specs/IMPLEMENTATION-READY.md` OODA loop embedding
  claims.
- Old or parked spec folders that still show up in search.
- Docs that still mention runs/projects where source now uses sessions.

## Tests And Quality Gates

Enforcing surfaces:

- Root `pnpm test`: `pnpm build:local && vitest run`.
- Root Vitest includes `src/**/__tests__/**/*.test.ts` and `demo`. It does not
  include `apps/web` tests.
- `pnpm check:cycles`: dependency cycle gate.
- `pnpm check:event-types`: live Supabase protocol event constraint parity when
  Supabase credentials are available.
- `pnpm validate:pr`: PR claim validation against ADR claim JSON.
- `pnpm check:types`: TypeScript no-emit.
- `pnpm check:lint`: oxlint over `src/`.

Weak or documentary surfaces:

- `tests/MASTER-TEST-INDEX.md` is a catalog, not an executable suite.
- `tests/*-behavioral.md` are behavioral scripts, not included in root test.
- `apps/web` has Vitest config and tests, but no `test` script in its
  `package.json`.
- `apps/web/scripts/qa/agent-check.sh` exists but is not wired into app package
  scripts.
- Web QA scripts still mention `runs` paths that do not exist.

## Cleanup Triage

### Highest-Leverage Cleanup Slices

1. Public MCP truth reconciliation
   - Fix README/docs/resource text around 3 public tools, no `tb.hub`, and old
     direct tools.
   - Decide whether `thoughtbox_operations` is removed, restored, or documented
     as obsolete.

2. Generated DB types and schema drift
   - Regenerate/verify Supabase generated types.
   - Remove ad hoc row typing where generated types should own it.
   - Confirm protocol workspace ID type with live DB before editing.

3. Web documentation and test wiring
   - Update `apps/web/README.md` to match implemented auth/API/billing/session
     surfaces.
   - Add an app-level test script if web tests remain.
   - Fix stale route names in web QA.

4. Peer notebook Part 2 readiness
   - Treat Part 1 durable control plane as landed.
   - Continue with manifest lifecycle/notebook graduation only if ADR-022 remains
     the chosen slice.
   - Do not treat real runtime provider, web inspection, or isolation as done.

5. Model illegal-state cleanup
   - Start with one domain only.
   - Best candidates: `ThoughtData`, `ProtocolSession`, or peer invocation
     lifecycle.
   - Require tests that prove the illegal state is rejected at the selected
     boundary.

### Cooked But Not Fit Yet

- Hub: mature code, weak live exposure.
- Notebook Effect engine: stronger model, still coexists with older model.
- Peer notebooks: real control-plane foundation, still pilot/mock-only.
- Web app: real product surface, docs/test scripts lag behind.
- OODA loop specs: rich specs, weak implementation evidence.

### Do Not Assume

- Do not assume accepted ADR text equals current registration.
- Do not assume generated DB types are current.
- Do not assume root tests cover web.
- Do not assume public tool discoverability from source files alone.
- Do not assume Supabase migrations equal deployed schema without live check.
