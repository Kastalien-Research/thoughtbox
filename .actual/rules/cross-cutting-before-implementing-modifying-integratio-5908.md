---
version: 2
name: cross-cutting-before-implementing-modifying-integratio-5908
description: "LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Before Implementing Modifying Integration Evaluation Sdk"
metadata:
  actual:
    adr_id: 59088f61-0cd8-4873-825c-bbf7e06f6bc6
    status: accepted
    candidate_group_id: ded5e24f-ce67-493e-940e-d226792e5648
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/evaluation/**
---

# LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Before Implementing Modifying Integration Evaluation Sdk

Scope: applies to `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all components within the evaluation subsystem responsible for client management, dataset synchronization, experiment runs, and trace telemetry.

### Rules

- **R-EVAL-001** MUST: Before implementing or modifying integration with the evaluation SDK, the consumer MUST discover the repository dependency manifest and lock artifact to resolve and verify the exact locked version of the library against its authoritative public documentation.

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