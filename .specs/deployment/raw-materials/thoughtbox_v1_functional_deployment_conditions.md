# ThoughtBox v1 Functional Deployment Conditions

## Purpose

This document defines the circumstances that must be true for a hosted ThoughtBox deployment to count as a **functional v1 product**, not merely a running service.

The standard here is not "the backend is up" or "the endpoint responds." The standard is:

> A new user can discover ThoughtBox, understand what it is for, sign up, obtain access, successfully use it, inspect what happened, and decide whether to keep using it or pay for more.

If any major part of that loop is missing, the deployment is not functionally complete.

---

## 1. Definition of Functional v1

A functional v1 deployment exists only if all of the following are true:

1. ThoughtBox is reachable as a hosted product by someone other than the developer.
2. A new user can create an account without manual intervention.
3. A new user can obtain credentials for programmatic use.
4. A new user can make a successful first request.
5. The system records the resulting run in a way that is inspectable afterward.
6. The user can view the resulting trace / ledger in a browser.
7. The user can tell what plan they are on, what the limits are, and what they are consuming.
8. A paid path exists and is actually usable.
9. The system has enough controls to prevent abuse, recover from failures, and support real users.
10. The product’s differentiating value is present in the hosted experience, not merely implied.

For ThoughtBox specifically, the differentiating value is **reasoning trace capture and post hoc inspectability**. Therefore, the hosted product is not functionally complete unless the trace / ledger explorer works.

---

## 2. Product-Level Truths That Must Hold

### 2.1 Clear value proposition
The product must make a legible promise that a user can understand quickly.

At minimum, all of the following must be true:

- The homepage or landing surface clearly states what ThoughtBox is.
- The value proposition distinguishes ThoughtBox from a generic hosted API.
- The product is framed around **auditability / inspectability / reasoning ledger visibility**, not only around hosted access.
- A user can understand why hosted ThoughtBox is worth using instead of only self-hosting.

### 2.2 v1 scope is explicit
The deployment must have a defined v1 boundary.

All of the following must be true:

- Free vs paid is defined.
- Included vs excluded functionality is defined.
- Retention behavior is defined.
- Support expectations are defined.
- The system does not implicitly promise enterprise-grade capabilities that do not exist.

### 2.3 There is exactly one primary first-run story
The product must have a simple, successful first-use path.

All of the following must be true:

- The expected first user action is obvious.
- The user does not need to contact the developer to complete onboarding.
- There is a canonical quickstart path.
- The quickstart terminates in a visible success condition.
- The success condition includes trace visibility, not just HTTP success.

---

## 3. End-to-End User Journey Conditions

A deployment is functionally complete only if the following journey works end to end:

1. User lands on site.
2. User understands the product.
3. User signs up.
4. User lands inside an authenticated app.
5. User creates or enters a workspace / project context.
6. User obtains an API key.
7. User sees a minimal quickstart example.
8. User sends a request successfully.
9. User sees the request represented as a run.
10. User can open the run and inspect the ledger / trace.
11. User can understand what happened.
12. User can see plan and usage state.
13. User can upgrade if they want more.

If any of these steps is missing, unclear, manual, or broken, v1 is incomplete.

---

## 4. Public-Facing Surface Conditions

The public-facing surface does not need to be elaborate, but it must be sufficient.

### 4.1 Public pages that must exist
At minimum, all of the following must exist:

- Home / landing page
- Pricing page
- Docs or quickstart page
- Sign up / sign in entry points
- Privacy policy
- Terms of service
- Support / contact path

### 4.2 Public page truths that must hold

- The home page explains the product in plain language.
- The pricing page explains free vs paid in concrete terms.
- The docs / quickstart let a user get to a first successful request.
- Privacy and terms are accessible before or during signup.
- A user can tell how to get help if something fails.

---

## 5. Identity, Access, and Tenancy Conditions

A real hosted product needs user and tenant boundaries.

### 5.1 Authentication must work

All of the following must be true:

- Users can sign up.
- Users can sign in again later.
- Sessions persist correctly.
- Users can sign out.
- Password reset or equivalent account recovery exists.

### 5.2 Workspace boundary must exist

All of the following must be true:

- Usage, billing, data, and access are scoped to a tenant boundary.
- The tenant boundary is visible in the UI.
- A user can tell which workspace they are operating in.
- Data from one workspace is not exposed to another workspace.

### 5.3 Membership model must exist

For v1, this can be minimal, but all of the following must be true:

- A workspace has an owner.
- Roles or at least ownership semantics exist.
- Sensitive actions are restricted to authorized users.

---

## 6. Programmatic Access Conditions

### 6.1 User-issued API keys must exist

All of the following must be true:

- A user can create an API key without manual developer involvement.
- The key is associated with the correct workspace and/or project boundary.
- The user can copy the key once at creation time.
- The user can revoke the key.
- The user can tell when the key was created and whether it has been used.

### 6.2 Key handling must be sane

All of the following must be true:

- Raw keys are not stored in plaintext in the product database.
- Revoked keys stop working.
- A compromised key can be replaced without destroying the entire account.
- Keys are distinct from any platform-internal infrastructure credentials.

### 6.3 Quickstart must be aligned with keys

- The docs show how to use the key.
- The example actually works against the hosted service.
- The first successful call can be made with minimal setup.

---

## 7. Hosted Service / Request Execution Conditions

The execution plane may live outside Supabase, but for v1 the hosted service itself must behave like a product surface.

### 7.1 The hosted service must be reachable and usable

All of the following must be true:

- The hosted endpoint is live.
- Authentication is enforced.
- Valid requests succeed.
- Invalid requests fail legibly.
- Errors are surfaced in a way that helps debugging.

### 7.2 The service must create inspectable state

A successful request must do more than return a response.

All of the following must be true:

- A request creates a run record.
- The run is associated with the correct tenant context.
- The run has a status lifecycle.
- The run can be located afterward.
- The run contains or links to ledger data sufficient for inspection.

### 7.3 Failure must also be represented

All of the following must be true:

- Failed runs are recorded.
- Failures can be found in the dashboard.
- Error summaries are visible.
- A user can distinguish success from failure quickly.

---

## 8. Trace / Ledger Product Conditions

This is the core wedge. If this is weak or absent, the hosted deployment is missing the product.

### 8.1 There must be a run explorer

All of the following must be true:

- Users can see a list of recent runs.
- Users can filter or at least scan by status and time.
- Users can distinguish projects or contexts.
- Users can open a specific run.

### 8.2 There must be a run detail / ledger view

All of the following must be true:

- The user can inspect the timeline of a run.
- The ledger entries are displayed in a coherent order.
- Core event types are distinguishable.
- Inputs, decisions, tool activity, outputs, and errors are represented clearly enough to reconstruct what happened.
- Timestamps or sequence ordering exist.

### 8.3 The ledger must be the canonical post hoc explanation surface

All of the following must be true:

- The user does not need raw logs or direct developer assistance to understand ordinary behavior.
- The hosted UI gives enough information to answer "what happened?" for normal cases.
- The run detail page is treated as product functionality, not hidden admin plumbing.

### 8.4 Retention behavior must be explicit

All of the following must be true:

- The user knows how long traces are retained.
- Free and paid retention differences are visible if they differ.
- Deletion / expiration behavior is defined.

---

## 9. Billing and Plan Conditions

A paid path must exist as an actual product path, not a future intention.

### 9.1 The free tier must be real

All of the following must be true:

- A user can sign up and use the product without paying.
- The free tier has defined limits.
- The free tier is still useful enough to demonstrate the product.

### 9.2 The paid tier must be real

All of the following must be true:

- A user can upgrade through an actual billing flow.
- Payment state is reflected in the app.
- Plan-specific entitlements actually change when billing state changes.
- The paid tier offers a meaningful value difference from free.

### 9.3 The paid value difference must not be trivial or incoherent

At minimum, the paid tier should differ through things like:

- longer trace retention
- higher limits or fair-use access
- more projects and/or more keys
- export or better trace access
- stronger support expectations

### 9.4 "Unlimited" must be translated into enforceable product truth

All of the following must be true:

- The public promise is not structurally suicidal.
- Internal usage metering still exists even if pricing is flat.
- Abuse controls exist.
- Fair-use expectations are defined somewhere.

---

## 10. Usage, Limits, and Entitlement Conditions

### 10.1 Usage must be measurable

All of the following must be true:

- The system records usage events or equivalent metering facts.
- Usage can be rolled up by workspace and plan period.
- The product can tell how much a user has consumed.

### 10.2 Usage must be visible enough to support trust

All of the following must be true:

- Users can see relevant usage information.
- Users can understand why a limit is being applied.
- Limits are not arbitrary black-box behavior.

### 10.3 Entitlement enforcement must exist

All of the following must be true:

- The product can tell what a workspace is allowed to do.
- Project count, API key count, retention, and any other plan features can be enforced.
- Upgrading or downgrading changes entitlements correctly.

---

## 11. Core Data Model Conditions

Regardless of implementation details, the data model must support the product truths above.

### 11.1 The model must represent the key boundaries

At minimum, the data model must represent:

- user
- workspace
- membership / role
- project
- plan
- subscription / billing state
- API key
- run
- ledger entry
- artifact
- usage event or usage rollup
- audit log

### 11.2 Tenant scoping must be explicit

All tenant-owned records must be attributable to a workspace boundary.

### 11.3 Run data must be append-oriented

All of the following must be true:

- Runs have stable identities.
- Ledger entries can be ordered.
- The system can preserve execution history without destructive overwrites.
- The model supports later debugging and export.

### 11.4 Large payloads must not corrupt the main product surface

All of the following must be true:

- Large artifacts are stored sensibly.
- The run explorer remains performant.
- The data model supports storage-backed artifacts with metadata in the database.

---

## 12. Internal Operator / Admin Conditions

A functional v1 must be operable by its developer.

### 12.1 There must be enough operator visibility to support real users

All of the following must be true:

- The operator can see which users and workspaces exist.
- The operator can see billing state.
- The operator can see whether requests are succeeding or failing.
- The operator can identify abusive or broken usage patterns.

### 12.2 There must be enough control to intervene safely

All of the following must be true:

- The operator can revoke or disable compromised access.
- The operator can suspend a workspace if necessary.
- The operator can inspect enough state to diagnose support issues.

### 12.3 Control-plane actions should leave evidence

All of the following must be true:

- Sensitive administrative or user actions are auditable.
- Changes to keys, memberships, billing state, or workspace status are reconstructable afterward.

---

## 13. Reliability and Failure-Handling Conditions

v1 does not need enterprise SLOs, but it must not be fragile in obvious ways.

### 13.1 The user-facing experience must degrade legibly

All of the following must be true:

- If a request fails, the user sees that it failed.
- If a background process is delayed, the user is not misled into thinking success occurred.
- If the ledger is incomplete, that fact is visible.

### 13.2 Basic recovery paths must exist

All of the following must be true:

- A user can generate a new key if needed.
- A user can retry a request.
- An operator can inspect and diagnose broken runs.
- Billing state mismatches can be corrected.

### 13.3 Launch should not depend on manual hidden steps

All of the following must be true:

- The product does not require the developer to manually provision users one by one.
- The product does not require manual key issuance.
- The product does not require manual trace stitching for ordinary use.
- The product does not require manual billing updates for normal signup/upgrade flows.

---

## 14. Security and Trust Conditions

This does not require perfect security architecture, but it does require sane trust boundaries.

### 14.1 Access boundaries must be real

All of the following must be true:

- Authenticated users can access only their own tenant-scoped data.
- API keys are scoped appropriately.
- Sensitive internal credentials are not exposed through the product surface.

### 14.2 Data handling expectations must be stated

All of the following must be true:

- The product states what it stores.
- The product states how long it stores trace data.
- The product states enough about privacy for users to make a decision.

### 14.3 Secret handling must be sane

All of the following must be true:

- User-facing secrets are protected.
- Internal service secrets are managed separately from customer credentials.
- Secret rotation is possible.

---

## 15. Support and Communication Conditions

### 15.1 A support path must exist

All of the following must be true:

- A user can tell how to contact support.
- The support path is visible from the product or site.
- The support path is realistic for the claimed plan tiers.

### 15.2 Common questions must be answerable without direct conversation

At minimum, a user should be able to answer the following from the site or app:

- What is ThoughtBox?
- How do I get a key?
- How do I make my first request?
- Where do I inspect a run?
- What does the free tier include?
- What does the paid tier include?
- How long are traces retained?
- What do I do if something breaks?

---

## 16. Minimal Page / Surface Conditions

A functional v1 should expose at least the following surfaces.

### Public surfaces

- Home
- Pricing
- Docs / Quickstart
- Sign up / Sign in
- Terms
- Privacy
- Support / Contact

### Private app surfaces

- Overview / Dashboard
- Projects list
- Project detail
- API keys
- Trace explorer / Runs list
- Run detail / Ledger viewer
- Usage
- Billing
- Workspace settings
- Account settings

These do not all need to be elaborate, but they need to exist and work.

---

## 17. Concrete Launch Gates

The deployment should not be considered launched until all of the following are true in practice:

### 17.1 Stranger test
A person who is not the developer can:

- land on the site
- understand the offer
- sign up
- enter the app
- obtain an API key
- make a successful request
- find the resulting run
- inspect the ledger
- understand free vs paid
- upgrade if desired

### 17.2 Payment test
A real payment flow exists and has been tested end to end.

### 17.3 Failure test
At least one known-bad request path has been tested, and the product surfaces the failure legibly.

### 17.4 Revocation test
An API key can be revoked and actually stops working.

### 17.5 Retention / entitlement test
At least one plan-specific limitation or entitlement difference has been validated in product behavior.

### 17.6 Supportability test
The operator can inspect a user’s workspace state, run state, billing state, and key state without needing ad hoc database surgery for ordinary support.

---

## 18. What Is Not Required for Functional v1

The following are useful later, but their absence does not block v1 if the core loop works:

- SSO / SCIM
- enterprise RBAC depth
- advanced team collaboration
- per-seat billing
- polished analytics beyond usage visibility
- full-text trace intelligence or advanced search
- complex export pipelines
- webhook ecosystems
- extensive integrations
- immaculate branding / design polish
- broad marketing site content

These are improvements, not launch prerequisites.

---

## 19. Functional v1 Go / No-Go Summary

ThoughtBox v1 is functionally real only if all of the following summary statements are true:

1. The hosted service is live and usable.
2. Users can sign up and authenticate.
3. Users can obtain their own API keys.
4. Users can make successful first requests.
5. Requests create inspectable runs.
6. The run explorer and ledger viewer work.
7. Free vs paid is defined and enforced.
8. Billing works.
9. Usage and retention are visible enough to support trust.
10. Tenant boundaries are real.
11. The operator can support and control the product.
12. The hosted product visibly delivers ThoughtBox’s core value: post hoc reasoning auditability.

If any one of those is false, the deployment may be partially working, but it is not yet a functional v1 product.

---

## 20. Highest-Priority Truths, If Time Is Tight

If time pressure forces prioritization, the following truths matter most:

1. A stranger can sign up and get a key.
2. A first request can be made successfully.
3. The resulting run is captured and viewable.
4. The ledger / trace actually helps answer "what happened?"
5. Free vs paid exists as a real product distinction.
6. The operator can revoke keys, inspect failures, and see billing/usage state.

Those six are the irreducible core. Everything else should support them.
