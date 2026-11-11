---
version: 2
name: cross-cutting-domain-event-types-payload-structures-3478
description: "Internal Events Module Adoption: Domain Event Types Payload Structures Defined"
metadata:
  actual:
    adr_id: 34781ffa-c1c5-4146-90ff-0edbecc5c3fd
    status: accepted
    candidate_group_id: 1030c3c6-d894-429c-97f9-79735a145c16
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/claims/**
      - src/evaluation/**
---

# Internal Events Module Adoption: Domain Event Types Payload Structures Defined

Scope: applies to `src/claims/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for subsystems and domain modules requiring asynchronous event distribution, lifecycle notifications, or cross-cutting listener attachment.

### Rules

- **R-EVM-001** SHOULD: Domain event types and payload structures SHOULD be defined within dedicated interface types associated with the events module to ensure type safety across publisher-subscriber boundaries.

### Verify

```bash
# Discover and run the project's test suite verification script to ensure all event publishing and subscriber test suites pass.
# Discover and run the project's static analysis and type check scripts to verify event payload contract conformance across module boundaries.
```

**Accept when:**
- All unit and integration tests covering event emission and subscription pass successfully.
- Static type analysis confirms zero type errors across event registration and listener payload signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration pipeline executing test suites and static analysis checks, and architectural/peer code review.
</enforcement>