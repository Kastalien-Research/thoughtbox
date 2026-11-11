---
version: 2
name: cross-cutting-listeners-registering-lifecycle-events-t-b96b
description: "ThoughtEmitter Event-Driven Integration Architecture: Listeners Registering Lifecycle Events Thoughtemitter Implement"
metadata:
  actual:
    adr_id: b96b6022-7d95-40e5-b914-dea7fabd2c75
    status: accepted
    candidate_group_id: 358d4746-b96b-4c6b-9226-3f477a6e40cf
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/**
---

# ThoughtEmitter Event-Driven Integration Architecture: Listeners Registering Lifecycle Events Thoughtemitter Implement

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-THOUGHT-001** MUST: Listeners registering for lifecycle events with the ThoughtEmitter MUST implement independent error boundaries and error logging to ensure subscriber failure isolation.

### Verify

```bash
# Discover and run static analysis, linting, and the test suite
# (Commands must be discovered from the project repository configuration)
```

**Accept when:**
- All event emission and listener subscription unit and integration tests pass cleanly without unhandled rejections.
- Static analysis checks pass with zero violations across event handling boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Pull requests introducing direct synchronous calls to external observers or unhandled listener exceptions must be blocked until refactored to use the event emitter boundary.
</enforcement>