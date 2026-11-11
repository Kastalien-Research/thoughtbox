---
version: 2
name: cross-cutting-stripe-secret-keys-webhook-signing-edcc
description: "Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Stripe Secret Keys Webhook Signing Secrets"
metadata:
  actual:
    adr_id: edccd30d-477f-4295-8c6f-df55dfb086e9
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

# Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Stripe Secret Keys Webhook Signing Secrets

Scope: applies to `apps/web/src/app/api/stripe/webhook/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-STRIPE-001** MUST_NOT: Stripe API secret keys and webhook signing secrets MUST NOT be referenced, imported, or executed within client component contexts or exposed to client-side bundles.

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
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks, static analysis rules, and peer code reviews.
</enforcement>