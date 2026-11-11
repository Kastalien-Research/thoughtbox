---
version: 2
name: cross-cutting-telemetry-trace-collection-subscribe-ses-0276
description: "LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Telemetry Trace Collection Subscribe Session Thought"
metadata:
  actual:
    adr_id: 02763958-ba9a-4543-8942-167272eb8369
    status: accepted
    candidate_group_id: ded5e24f-ce67-493e-940e-d226792e5648
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/evaluation/**
---

# LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Telemetry Trace Collection Subscribe Session Thought

Scope: applies to `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LS-001** MUST: Telemetry and trace collection MUST subscribe to session and thought runtime events asynchronously and decouple trace persistence from application state transitions.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>