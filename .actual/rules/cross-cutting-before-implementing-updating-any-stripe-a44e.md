---
version: 2
name: cross-cutting-before-implementing-updating-any-stripe-a44e
description: "Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Before Implementing Updating Any Stripe Integration"
metadata:
  actual:
    adr_id: a44e0855-25aa-49be-b18f-f8ce42224d6e
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

# Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Before Implementing Updating Any Stripe Integration

Scope: applies to `apps/web/src/app/api/stripe/webhook/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all server-side modules initiating checkout sessions, billing portal redirects, or handling inbound webhook notifications from the payment gateway.

### Rules

- **R-STRIPE-001** MUST: Before implementing or updating any Stripe integration code, developers MUST discover the dependency lock artifact in the repository and verify the exact resolved SDK version against authoritative documentation.

### Verify

```bash
# Discover and run the repository type-checking suite to verify Stripe SDK type definitions
# Discover and execute the test runner across payment and webhook test suites
```

**Accept when:**
- The project type-checking and automated test suites execute with zero errors across all payment integration modules.
- Payment webhook endpoints successfully verify valid signatures and reject unsigned or invalid payloads with an error response.
- All Stripe SDK instantiations and invocations remain confined to server-side execution contexts without leaking credentials into client assets.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification via automated checks, peer code reviews, and static analysis is mandatory for all payment integration modules.
</enforcement>