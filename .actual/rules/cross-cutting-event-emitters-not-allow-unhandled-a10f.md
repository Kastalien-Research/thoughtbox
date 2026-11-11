---
version: 2
name: cross-cutting-event-emitters-not-allow-unhandled-a10f
description: "ThoughtEmitter Event-Driven Integration Architecture: Event Emitters Not Allow Unhandled Listener"
metadata:
  actual:
    adr_id: a10fe940-44ad-4626-a567-fbc8961a84b0
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

# ThoughtEmitter Event-Driven Integration Architecture: Event Emitters Not Allow Unhandled Listener

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TE-001** MUST_NOT: Event emitters MUST NOT allow unhandled listener exceptions to terminate emission loops or propagate faults back into the initiating operational workflow.

### Verify

```bash
# Discover and run static analysis, linting, and test scripts to verify event listener and error handling boundaries.
# Refer to the project repository manifests for specific tool invocations.
```

**Accept when:**
- All event emission and listener subscription unit and integration tests pass cleanly without unhandled rejections.
- Static analysis checks pass with zero violations across event handling boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests introducing direct synchronous calls to external observers or unhandled listener exceptions must be blocked until refactored.
</enforcement>