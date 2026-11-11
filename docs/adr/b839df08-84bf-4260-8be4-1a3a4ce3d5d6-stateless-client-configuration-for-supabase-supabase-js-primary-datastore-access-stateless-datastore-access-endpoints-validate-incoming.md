---
version: 2
name: b839df08-84bf-4260-8be4-1a3a4ce3d5d6-stateless-client-configuration-for-supabase-supabase-js-primary-datastore-access-stateless-datastore-access-endpoints-validate-incoming
description: "Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Stateless Datastore Access Endpoints Validate Incoming"
metadata:
  actual:
    adr_id: b839df08-84bf-4260-8be4-1a3a4ce3d5d6
    status: accepted
    candidate_group_id: 41eb9913-8fa1-452a-8799-65e21c795446
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Stateless Datastore Access Endpoints Validate Incoming

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `supabase`

Applies to:
- `functions/tb-branch/**`

## Context

- Primary datastore access in serverless edge environments requires deterministic, isolated execution lifecycles to prevent cross-request contamination.
- The codebase utilizes @supabase/supabase-js to interface with primary backend datastores from edge service handlers.
- Default client configurations in datastore SDKs may attempt local storage session persistence and background token refreshes that are incompatible with ephemeral runtime lifecycles.
- Request handling boundaries require explicit disabling of client-side authentication persistence coupled with environment-based credential injection.

## Problem Statement

Serverless request handlers connecting to primary datastores risk cross-tenant data leakage and session desynchronization if the underlying client SDK attempts stateful session persistence or automated token refresh routines across ephemeral request contexts. The architecture requires an explicit, standardized initialization pattern for @supabase/supabase-js that guarantees zero session persistence while maintaining secure service-level datastore access.

## Decision

1. SHOULD: Stateless datastore access endpoints SHOULD validate incoming request authorization tokens and branch payloads through strict schema parsing prior to executing datastore operations.

## Policy Block

- SHOULD Stateless datastore access endpoints SHOULD validate incoming request authorization tokens and branch payloads through strict schema parsing prior to executing datastore operations.

In scope:
- Stateless service boundaries and edge runtime handlers requiring primary datastore access via @supabase/supabase-js.
- Serverless background functions and request handlers executing in ephemeral runtime environments.

Out of scope:
- Client-facing browser applications where persistent user sessions and local authentication storage are explicitly required.
- Long-running stateful services with dedicated connection pooling abstractions.

Exceptions:
- EXC-28-001: A dedicated long-running background worker requires continuous user impersonation and automated session token refresh.

## Rationale

- Disabling persistSession and autoRefreshToken in createClient ensures that each request lifecycle remains fully isolated without shared state or memory retention across invocations.
- Injecting datastore connection endpoints and service role keys from runtime environment variables preserves credential security and centralizes environment configuration.
- Pairing stateless datastore access with explicit schema-validated token inspection guarantees that request authorizations are verified independently on every call.

## Consequences

Positive:
- Eliminates cross-request session contamination and credential leakage in ephemeral edge runtime environments.
- Guarantees predictable, reproducible datastore queries governed solely by the immediate invocation context.
- Aligns datastore client resource footprint with lightweight serverless execution constraints.

Negative:
- Precludes automated client-side session management, necessitating explicit request authorization handling for every transaction.
- Increases configuration verbosity by requiring manual declaration of authentication client flags on instantiation.

## Alternatives

- Default stateful @supabase/supabase-js client initialization (rejected)
  Rejected because: Default initialization attempts local storage caching and automatic session refreshes, introducing memory leaks and race conditions in stateless environments.
  When valid: Client-side interactive applications running in single-user web browser contexts.
- Direct raw HTTP requests to datastore REST APIs without an official client SDK (rejected)
  Rejected because: Bypasses structured query builders, type safety, and standardized error handling provided by @supabase/supabase-js.
  When valid: Ultra-constrained runtime environments with strict binary size or dependency footprint limits.

## Risks

- Accidental client re-instantiation with default stateful options leading to shared session leakage.
  Mitigation: Automated static analysis and code review gates verifying that all createClient calls include explicit stateless authentication options.
  Owner: Backend Engineering Team
- Service role credential misconfiguration or exposure across edge boundaries.
  Mitigation: Strict environment variable access controls and runtime secret segregation.
  Owner: Platform Security Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Construct datastore clients using factory functions that encapsulate createClient with auth.persistSession set to false and auth.autoRefreshToken set to false to avoid configuration drift across handler endpoints.
- Couple datastore client queries with upfront request token and schema validation to ensure authorization boundaries are enforced prior to executing datastore transactions.

## Continuation Context


Verify commands:
- echo "Discover and run the project test verification script defined in repository configuration"
- echo "Discover and execute project static analysis and linting scripts to verify datastore client instantiation patterns"

Accept when:
- Project verification test suite passes with zero errors.
- Static analysis confirms all primary datastore client initializations explicitly set session persistence and auto-refresh to false.
- No client instances persist authentication state across request lifecycles.

## Enforcement

- Verified by: Continuous integration automated test suites.
- Verified by: Static analysis checks detecting client initialization patterns.
- Verified by: Peer code review for datastore integration pull requests.
- Violation handling: Pull requests containing stateful datastore client configurations in serverless handlers are blocked from merging.
- Violation handling: Non-compliant client initializations must be refactored to disable session persistence before deployment.
- Exception process: Submit an architectural exception request detailing the requirement for stateful persistence, security review sign-off, and isolation verification.