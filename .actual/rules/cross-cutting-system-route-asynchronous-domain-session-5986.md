---
version: 2
name: cross-cutting-system-route-asynchronous-domain-session-5986
description: "ThoughtEmitter Event-Driven Integration Architecture: System Route Asynchronous Domain Session Lifecycle"
metadata:
  actual:
    adr_id: 5986ec0b-d0d3-4b5e-ac10-927f6f562dfd
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

# ThoughtEmitter Event-Driven Integration Architecture: System Route Asynchronous Domain Session Lifecycle

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SYS-001** MUST: The system MUST route all asynchronous domain and session lifecycle state notifications across architectural boundaries through the ThoughtEmitter event bus rather than invoking downstream subscribers directly.

### Verify

```bash
# Discover and run the project static analysis and linting scripts to verify adherence to event listener and error handling boundaries.
# Discover and run the test suite to execute event emission, listener registration, and error containment tests.
```

**Accept when:**
- All event emission and listener subscription unit and integration tests pass cleanly without unhandled rejections.
- Static analysis checks pass with zero violations across event handling boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification by automated continuous integration pipeline, test suites, and static analysis is mandatory.
</enforcement>