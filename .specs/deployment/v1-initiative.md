# ThoughtBox v1 GCP Deployment — Initiative Spec

## Purpose

This document is the program-level plan for the ThoughtBox v1 GCP deployment. It
defines the workstreams, the ADRs each workstream will produce, and the sequencing
constraints between them. It is the durable artifact that prevents drift between
the original decomposition intent and the individual HDD sessions that execute it.

Individual HDD sessions reference this document as shared context. Beads epics and
cross-workstream dep edges are derived from the sequencing defined here.

---

## Acceptance Criteria (Initiative-Level)

The initiative is complete when all 12 summary conditions in
`.specs/deployment/raw-materials/thoughtbox_v1_functional_deployment_conditions.md`
are true in practice, as verified by the six launch gates in Section 17 of that
document.

---

## Known Constraints

- **Execution plane**: Google Cloud Run (decided; not up for ADR debate)
- **Control plane**: Supabase (auth, postgres, storage)
- **Billing**: Stripe
- **GCP-specific architecture** within Cloud Run (container structure, secrets
  management, networking, CI/CD) is undecided and governed by HDD

---

## Workstreams

### WS-01 · GCP Infrastructure

**Scope**: Everything needed for Cloud Run to run and be reachable. Does not include
application code — only the platform it runs on.

**ADRs to produce**:
- ADR-GCP-01: Cloud Run service configuration (regions, scaling, concurrency)
- ADR-GCP-02: Secret management strategy (Secret Manager vs env vars)
- ADR-GCP-03: CI/CD pipeline (build, deploy, environment promotion)
- ADR-GCP-04: Domain, SSL, and ingress strategy

**Blocks**: All other workstreams except WS-02 (Data Layer)

---

### WS-02 · Data Layer

**Scope**: Supabase project setup, schema migrations (exact DDL), RLS policies,
index strategy, plan seeding, and audit log design. The schema is defined in
raw-materials; this workstream turns it into deployable migrations. Audit log is
required per Section 11.1 and 12.3 of the conditions doc — sensitive actions
(key revocation, billing changes, membership changes) must be reconstructable.

**ADRs to produce**:
- ADR-DATA-01: Migration tooling and execution strategy
- ADR-DATA-02: RLS policy design per table
- ADR-DATA-03: Plan seeding and configuration management
- ADR-DATA-04: Audit log design and retention

**Blocks**: WS-03 (Auth), WS-04 (API Service), WS-05 (Trace Pipeline), WS-06 (Billing)

---

### WS-03 · Auth & Identity

**Scope**: Supabase Auth configuration, JWT validation on the Cloud Run service,
API key issuance/validation scheme (hashing, prefix format, revocation).

**ADRs to produce**:
- ADR-AUTH-01: Supabase Auth configuration and session strategy
- ADR-AUTH-02: API key hashing and validation scheme

**Blocks**: WS-04 (API Service), WS-07 (Frontend)

---

### WS-04 · MCP/API Service

**Scope**: The ThoughtBox execution plane running on Cloud Run. Request routing,
auth middleware, run lifecycle (create to running to succeeded/failed), ledger write
path, error surface, and failure handling. Failure handling includes: failed runs
are recorded and findable, errors are surfaced legibly, the product degrades visibly
rather than silently (per Section 13 of the conditions doc).

**ADRs to produce**:
- ADR-SVC-01: Request auth and middleware chain
- ADR-SVC-02: Run lifecycle and state machine
- ADR-SVC-03: Ledger write path and ordering guarantees
- ADR-SVC-04: Failure handling and legible degradation

**Blocks**: WS-05 (Trace Pipeline), WS-07 (Frontend)

---

### WS-05 · Trace & Ledger Pipeline

**Scope**: Ledger entry storage, artifact handling (blobs to GCS or Supabase Storage),
retention expiry implementation, run explorer query performance.

**ADRs to produce**:
- ADR-TRACE-01: Artifact storage strategy (GCS vs Supabase Storage)
- ADR-TRACE-02: Retention expiry implementation

**Blocks**: WS-07 (Frontend — trace explorer and run detail views)

---

### WS-06 · Billing

**Scope**: Stripe integration, webhook handler, subscription state sync to
workspace_subscriptions, entitlement enforcement at the API layer.

**ADRs to produce**:
- ADR-BILL-01: Stripe webhook handling and subscription sync
- ADR-BILL-02: Entitlement enforcement strategy

**Blocks**: WS-07 (Frontend — billing and usage pages)

---

### WS-07 · Frontend, Dashboard & Public Site

**Scope**: The unified Next.js app covering both the authenticated product and the
public-facing surfaces. One codebase, one deployment. Includes all private app
surfaces (dashboard, projects, API keys, trace explorer, run detail, usage, billing,
workspace settings, account settings) and all public surfaces (landing, pricing,
docs/quickstart, sign up/in, terms, privacy, support). The quickstart doc must work
against the live hosted API.

**ADRs to produce**:
- ADR-FE-01: Next.js app structure, routing strategy, and hosting on Cloud Run
- ADR-FE-02: Auth integration (session handling, protected routes, password reset)

**Blocks**: WS-09 (Launch Gates)

---

### WS-08 · Observability & Operations

**Scope**: GCP-native logging (Cloud Logging) and alerting (Cloud Monitoring).
Admin tooling for v1 is Supabase Studio — no purpose-built admin surface required.
This workstream owns the logging strategy and alert definitions sufficient for the
supportability launch gate.

**ADRs to produce**:
- ADR-OPS-01: Logging and alerting strategy (Cloud Logging + Cloud Monitoring)

**Blocks**: WS-09 (Launch Gates — supportability test)

---

### WS-09 · Launch Gates

**Scope**: The six validation tests from Section 17 of the conditions doc. This
workstream is not implementation — it is end-to-end validation that all prior
workstreams have delivered what they claimed.

- Stranger test
- Payment test
- Failure test
- Revocation test
- Retention/entitlement test
- Supportability test

**ADRs to produce**: None. This workstream produces a go/no-go report, not ADRs.

**Blocked by**: All other workstreams

---

## Sequencing Summary

WS-01 and WS-02 can start in parallel and have no dependencies on each other.

WS-03, WS-04, WS-05 each depend on WS-02 (data layer must exist).
WS-03 and WS-04 also depend on WS-01 (infrastructure must be reachable).

WS-06 depends on WS-02 (data layer) and WS-01 (infrastructure).

WS-07 depends on WS-03, WS-04, WS-05, and WS-06.

WS-08 (Observability) can proceed in parallel with most workstreams; it blocks WS-09.

WS-09 (Launch Gates) depends on all other workstreams.

---

## Beads Structure

Each workstream gets one epic. Each ADR-to-be-written gets one task bead under
its workstream epic. Cross-workstream blocking relationships are captured as bead
dep edges.

This document is the source of truth. If a workstream scope changes, update here
first, then update beads to match.

---

## Triage Priorities (Section 20 of conditions doc)

If time pressure forces scope cuts, these six are the irreducible core. Everything
else should support them:

1. A stranger can sign up and get a key — WS-03, WS-07
2. A first request can be made successfully — WS-01, WS-04
3. The resulting run is captured and viewable — WS-04, WS-05, WS-07
4. The ledger / trace actually helps answer "what happened?" — WS-05, WS-07
5. Free vs paid exists as a real product distinction — WS-06
6. The operator can revoke keys, inspect failures, and see billing/usage state — WS-02, WS-08

If any workstream is deferred, defer WS-08 (Observability) last — the supportability
gate is easier to pass with basic GCP logging than with no logging at all.

---

## Open Questions

<!-- Record gaps here as they're identified. Remove when resolved. -->

- [x] Frontend tech choice: **Next.js**
- [x] Public site strategy: **unified — public site and authenticated app in the same Next.js deployment**
- [x] Observability tooling: **GCP-native (Cloud Logging + Cloud Monitoring)**
- [x] Admin tooling: **Supabase Studio sufficient for v1**
