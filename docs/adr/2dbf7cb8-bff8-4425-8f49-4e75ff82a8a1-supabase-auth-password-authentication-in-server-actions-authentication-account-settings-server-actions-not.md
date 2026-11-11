---
version: 2
name: 2dbf7cb8-bff8-4425-8f49-4e75ff82a8a1-supabase-auth-password-authentication-in-server-actions-authentication-account-settings-server-actions-not
description: "Supabase Auth Password Authentication in Server Actions: Authentication Account Settings Server Actions Not"
metadata:
  actual:
    adr_id: 2dbf7cb8-bff8-4425-8f49-4e75ff82a8a1
    status: accepted
    candidate_group_id: 2956158a-06a2-45d3-9b5b-0fe83df1dd18
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Supabase Auth Password Authentication in Server Actions: Authentication Account Settings Server Actions Not

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`

## Context

- Application server actions require secure identity verification for initial user sign-in and subsequent credential re-authentication during sensitive account updates.
- Client-side direct authentication can leak session handling details and complicate secure server-side session cookie management across routed layouts.
- The repository adopts a server-side authentication client factory to handle identity provider communication within server action execution contexts.

## Problem Statement

Handling password-based authentication requires a unified server-side verification pattern that validates credentials, issues session credentials, and secures sensitive account updates without exposing raw credentials to client browser scripts or duplicating custom verification logic across endpoints.

## Decision

1. MUST_NOT: Authentication and account settings server actions MUST NOT implement custom database password hash matching or bypass the designated provider client authentication interface.

## Policy Block

- MUST_NOT Authentication and account settings server actions MUST NOT implement custom database password hash matching or bypass the designated provider client authentication interface.

In scope:
- Server action routines handling user sign-in and credential verification.
- Account management actions requiring current password confirmation prior to mutation.

Out of scope:
- Third-party OAuth or federated identity authentication flows bypassing password credentials.
- Passwordless magic link or multi-factor authentication enrollment and verification endpoints.

## Rationale

- Static analysis demonstrates consistent usage of supabase.auth.signInWithPassword in both authentication sign-in actions and account management settings actions.
- Invoking provider authentication through a shared server client ensures consistent session cookie handling and aligns re-authentication semantics across features.
- Leveraging the provider's built-in credential verification avoids implementing custom cryptographic password verification routines.

## Consequences

Positive:
- Ensures password validation and session token generation occur exclusively within protected server execution boundaries.
- Centralizes credential handling and security policy enforcement through the standardized identity provider authentication provider interface.
- Reuses existing session and account verification mechanics consistently across initial login and re-authentication flows.

Negative:
- Creates direct architectural coupling to the specific identity provider client authentication SDK across server action routines.
- Requires careful synchronization of server client context to ensure session cookie mutation headers propagate back to HTTP responses.

## Alternatives

- Client-side authentication via browser SDK invocation (rejected)
  Rejected because: Exposes authentication state synchronization to client browser contexts and complicates HTTP-only session cookie management on server-rendered routes.
  When valid: Static single-page applications operating without server-side rendering or dedicated server action execution runtimes.
- Custom credential verification against database password hashes (rejected)
  Rejected because: Bypasses native identity provider rate limiting, session token generation, and centralized audit logging mechanisms.
  When valid: Self-hosted standalone deployments with custom identity providers requiring direct hash management.

## Risks

- Improper cookie or session propagation across server action responses can cause silent authentication failures or stale session state.
  Mitigation: Ensure the server client factory properly propagates session cookies into outgoing response headers and validate through automated integration tests.
  Owner: Engineering Team
- Exposing password authentication server actions without rate limiting could subject endpoints to brute-force credential attacks.
  Mitigation: Implement rate limiting and audit logging around server actions that invoke credential authentication.
  Owner: Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Initialize the provider client inside the server action scope using the internal server client factory to ensure request and response cookie contexts are appropriately wired.
- Sanitize all error messages returned from failed authentication calls before exposing feedback to caller forms or application state.

## Continuation Context


Verify commands:
- Discover the project's static analysis script in the package manifest and execute it to verify that password authentication conforms to the designated provider client interface.
- Discover and execute the repository test suite to verify authentication and account settings server action behavior.

Accept when:
- Static analysis confirms all password verification routines invoke supabase.auth.signInWithPassword using the server client factory.
- Automated test suites validate successful authentication and structured failure handling across authentication and account settings workflows.
- Dependency audit confirms client library calls conform to the resolved version documented in the repository lock artifact.

## Enforcement

- Verified by: Automated static analysis checks scanning server actions for unauthorized direct credential checks or unapproved authentication provider client calls.
- Verified by: Mandatory peer code review for any pull request touching authentication or account settings server action definitions.
- Violation handling: Pull requests containing alternative password verification patterns or bypassing the server client factory will be blocked by continuous integration.
- Violation handling: Discovered violations must be refactored to use the standardized server client signInWithPassword method before merging.
- Exception process: Exceptions require security architecture review and documented justification for why provider password authentication cannot satisfy the authentication requirement.
- Exception process: Temporary exceptions must be registered in the repository tracking system with an explicit deprecation or migration target date.