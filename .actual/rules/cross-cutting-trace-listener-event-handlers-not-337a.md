---
version: 2
name: cross-cutting-trace-listener-event-handlers-not-337a
description: "LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Trace Listener Event Handlers Not Throw"
metadata:
  actual:
    adr_id: 337a8b88-887f-45bb-ac57-0f0addcc1357
    status: accepted
    candidate_group_id: ded5e24f-ce67-493e-940e-d226792e5648
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/evaluation/**
---

# LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Trace Listener Event Handlers Not Throw

Scope: applies to `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TRC-001** MUST_NOT: Trace listener event handlers MUST NOT throw uncaught exceptions or block the execution flow of the runtime event bus.

### Verify

```bash
echo 'Discover and execute project test suite for evaluation modules'; exit 0
echo 'Discover dependency lock artifact and verify resolved client SDK version'; exit 0
echo 'Discover static analysis and linter scripts to validate defensive wrapper typing'; exit 0
```

**Accept when:**
- All evaluation unit and integration test suites pass successfully under test environments.
- Defensive wrapper tests confirm that rejected client operations resolve to designated fallback values without unhandled rejections.
- Trace listener circuit breaker tests confirm that exceeding the failure threshold suppresses remote emissions for the duration of the cooldown period.

<enforcement>
Claude Code MUST NOT skip or defer verification. All evaluation client calls must utilize defensive wrappers and telemetry listeners must maintain circuit breakers.
</enforcement>