---
version: 2
name: cross-cutting-payment-workflows-initialize-stripe-clie-df02
description: "Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Payment Workflows Initialize Stripe Client Through"
metadata:
  actual:
    adr_id: df02592f-51d8-4121-8389-2518d9d8ceaf
    status: accepted
    candidate_group_id: 6f5ef337-f282-4ff9-8b96-8109e2c3d59d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/api/stripe/webhook/**
      - src/lib/stripe/**
---

# Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Payment Workflows Initialize Stripe Client Through

Scope: applies to `apps/web/src/app/api/stripe/webhook/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all server-side modules initiating checkout sessions, customer billing portal redirects, or handling inbound webhook notifications from the payment gateway.

### Rules

- **R-STRIPE-001** SHOULD: Payment workflows SHOULD initialize the Stripe client through a centralized server utility module to ensure consistent configuration and runtime credential access.
- **R-STRIPE-002** MANDATORY: The consumer MUST derive tool names, file names, commands, package managers, and version numbers from the repository.
- **R-STRIPE-003** MANDATORY: Before writing code that uses a versioned library, execute in order: find dependency manifest, identify build tool, inspect repository lock or resolution artifact for exact resolved version, look up official documentation for that exact version, confirm every API/class/function exists in that exact version, and re-run per dependency at point of use for version-sensitive behavior.
- **R-STRIPE-004** MANDATORY: Instantiate the Stripe SDK through a centralized server module to ensure uniform configuration across server actions and route handlers.
- **R-STRIPE-005** MANDATORY: Retrieve the raw request payload buffer when verifying webhook event signatures to avoid JSON parsing discrepancies.

### Verify

```bash
# Discover and run the repository type-checking suite
# Discover and execute the test runner across payment and webhook test suites
```

**Accept when:**
- The project type-checking and automated test suites execute with zero errors across all payment integration modules.
- Payment webhook endpoints successfully verify valid signatures and reject unsigned or invalid payloads with an error response.
- All Stripe SDK instantiations and invocations remain confined to server-side execution contexts without leaking credentials into client assets.

<enforcement>
Claude Code MUST NOT skip or defer verification. Pull requests introducing direct client-side payment client instances or unverified webhook endpoints will be rejected. Static analysis violations regarding exposed payment credentials will immediately halt the build and deployment pipeline.
</enforcement>