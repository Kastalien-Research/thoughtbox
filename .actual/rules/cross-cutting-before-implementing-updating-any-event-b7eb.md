---
version: 2
name: cross-cutting-before-implementing-updating-any-event-b7eb
description: "ThoughtEmitter Event-Driven Integration Architecture: Before Implementing Updating Any Event Emitter"
metadata:
  actual:
    adr_id: b7ebc521-2bb9-4a38-88da-eee607bdb157
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

# ThoughtEmitter Event-Driven Integration Architecture: Before Implementing Updating Any Event Emitter

Scope: applies to `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for all asynchronous integration boundaries, telemetry, tracing, and streaming event publishers and subscribers.

### Rules

- **R-TE-001** MUST: Before implementing or updating any event emitter dependency or related protocol package, developers MUST inspect the repository lock artifact to verify the exact resolved version against the project dependency manifest.

### Verify

```bash
# Discover and run the project static analysis and linting scripts to verify adherence to event listener and error handling boundaries.
# Discover and run the test suite to execute event emission, listener registration, and error containment tests.
```

**Accept when:**
- All event emission and listener subscription unit and integration tests pass cleanly without unhandled rejections.
- Static analysis checks pass with zero violations across event handling boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration pipeline running test suites and static analysis, and architectural/peer code review.
</enforcement>