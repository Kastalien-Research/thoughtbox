---
version: 2
name: cross-cutting-incoming-payment-webhook-endpoints-crypt-c2e8
description: "Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Incoming Payment Webhook Endpoints Cryptographically Verify"
metadata:
  actual:
    adr_id: c2e893b6-0cdf-4b77-9024-edd4c9fa63dd
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

# Adopt Stripe SDK for Server-Side Payment Processing and Webhook Verification: Incoming Payment Webhook Endpoints Cryptographically Verify

Scope: applies to `apps/web/src/app/api/stripe/webhook/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all server-side modules initiating checkout sessions, billing portal redirects, and API route endpoints handling inbound webhook notifications from the payment gateway.

### Rules

- **R-PAY-001** MUST: All incoming payment webhook endpoints MUST cryptographically verify request signatures using the configured webhook secret before parsing or acting upon event payloads.

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