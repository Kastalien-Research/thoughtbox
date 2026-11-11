---
version: 2
name: cross-cutting-dataset-retrieval-mutation-experiment-ex-a6c6
description: "LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Dataset Retrieval Mutation Experiment Execution Calls"
metadata:
  actual:
    adr_id: a6c6ac40-699d-4c14-b49a-00237f07fa21
    status: accepted
    candidate_group_id: ded5e24f-ce67-493e-940e-d226792e5648
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/evaluation/**
---

# LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Dataset Retrieval Mutation Experiment Execution Calls

Scope: applies to `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LST-001** MUST: All dataset retrieval, mutation, and experiment execution calls against the evaluation client MUST be wrapped in defensive execution handlers that catch runtime errors, log diagnostic warnings, and return designated fallback values without propagating unhandled exceptions.

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