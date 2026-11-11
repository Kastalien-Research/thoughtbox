---
version: 2
name: cross-cutting-event-listeners-not-allow-unhandled-421d
description: "Internal Events Module Adoption: Event Listeners Not Allow Unhandled Subscription"
metadata:
  actual:
    adr_id: 421dab44-cfb5-4697-b151-fab1a8ad7037
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

# Internal Events Module Adoption: Event Listeners Not Allow Unhandled Subscription

Scope: applies to `src/claims/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for subsystems and domain modules requiring asynchronous event distribution, lifecycle notifications, or cross-cutting listener attachment.

### Rules

- **R-IEA-001** MUST_NOT: Event listeners MUST NOT allow unhandled subscription errors to bubble up and terminate the emitting domain execution flow.

### Verify

```bash
# Discover and run the project's test suite verification script to ensure all event publishing and subscriber test suites pass.
# Discover and run the project's static analysis and type check scripts to verify event payload contract conformance across module boundaries.
```

**Accept when:**
- All unit and integration tests covering event emission and subscription pass successfully.
- Static type analysis confirms zero type errors across event registration and listener payload signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration pipeline executing test suites and static analysis checks, and architectural and peer code review verifying adherence to decoupled event communication rules.
</enforcement>