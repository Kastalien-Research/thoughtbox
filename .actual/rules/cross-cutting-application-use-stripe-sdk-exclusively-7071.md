---
version: 2
name: cross-cutting-application-use-stripe-sdk-exclusively-7071
description: "Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Application Use Stripe Sdk Exclusively Within"
metadata:
  actual:
    adr_id: 70715e61-b7e4-4299-ba8d-29753dfbb6d0
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

# Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Application Use Stripe Sdk Exclusively Within

Scope: applies to `apps/web/src/app/api/stripe/webhook/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-STRIPE-001** MUST: The application MUST use the Stripe SDK exclusively within server-side execution contexts for checkout session creation, billing portal management, and payment lifecycle operations.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>