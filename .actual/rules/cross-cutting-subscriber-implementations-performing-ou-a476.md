---
version: 2
name: cross-cutting-subscriber-implementations-performing-ou-a476
description: "Internal Events Module Adoption: Subscriber Implementations Performing Outbound Operations Incorporate"
metadata:
  actual:
    adr_id: a476b43b-56cf-4759-a95e-5bc3842da354
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

# Internal Events Module Adoption: Subscriber Implementations Performing Outbound Operations Incorporate

Scope: applies to `src/claims/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for subsystems and domain modules requiring asynchronous event distribution, lifecycle notifications, or cross-cutting listener attachment.

### Rules

- **R-IE-001** SHOULD: Subscriber implementations performing outbound I/O operations incorporate fault-tolerance patterns such as circuit breakers and suppression cooldowns to protect the event loop.

### Verify

```bash
# Discover and run the project's test suite verification script to ensure all event publishing and subscriber test suites pass.
# Discover and run the project's static analysis and type check scripts to verify event payload contract conformance across module boundaries.
```

**Accept when:**
- All unit and integration tests covering event emission and subscription pass successfully.
- Static type analysis confirms zero type errors across event registration and listener payload signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification. All registered event handlers must properly deregister when lifecycle sessions conclude, and subscriber exceptions or omitted event listener cleanup must be treated as release-blocking defects.
</enforcement>