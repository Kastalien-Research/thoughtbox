---
version: 2
name: cross-cutting-subsystems-publishing-subscribing-cross-1f56
description: "Internal Events Module Adoption: Subsystems Publishing Subscribing Cross Boundary Domain"
metadata:
  actual:
    adr_id: 1f567212-3288-41f0-89d9-3b8872359491
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

# Internal Events Module Adoption: Subsystems Publishing Subscribing Cross Boundary Domain

Scope: applies to `src/claims/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for subsystems and domain modules requiring asynchronous event distribution, lifecycle notifications, or cross-cutting listener attachment.

### Rules

- **R-IE-001** MUST: Subsystems publishing or subscribing to cross-boundary domain lifecycle occurrences MUST communicate exclusively through the internal events module interface rather than establishing direct synchronous inter-module dependencies.

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