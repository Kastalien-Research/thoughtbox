---
version: 2
name: cross-cutting-consumers-implementing-dependencies-inte-fbe3
description: "Internal Events Module Adoption: Consumers Implementing Dependencies Integrations Related Event"
metadata:
  actual:
    adr_id: fbe305e0-0cdb-4828-9203-74268eb4a770
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

# Internal Events Module Adoption: Consumers Implementing Dependencies Integrations Related Event

Scope: applies to `src/claims/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for subsystems and domain modules requiring asynchronous event distribution, lifecycle notifications, or cross-cutting listener attachment.

### Rules

- **R-IE-001** MUST: Consumers implementing dependencies or integrations related to the event subsystem MUST discover the repository dependency resolution artifact and verify exact locked versions prior to implementation.

### Verify

```bash
# Discover and run the project's test suite verification script to ensure all event publishing and subscriber test suites pass.
# Discover and run the project's static analysis and type check scripts to verify event payload contract conformance across module boundaries.
```

**Accept when:**
- All unit and integration tests covering event emission and subscription pass successfully.
- Static type analysis confirms zero type errors across event registration and listener payload signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>