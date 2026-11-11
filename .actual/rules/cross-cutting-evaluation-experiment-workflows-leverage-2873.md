---
version: 2
name: cross-cutting-evaluation-experiment-workflows-leverage-2873
description: "LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Evaluation Experiment Workflows Leverage Dedicated Schema"
metadata:
  actual:
    adr_id: 287325a3-3157-45fc-a034-24efc409d5c8
    status: accepted
    candidate_group_id: ded5e24f-ce67-493e-940e-d226792e5648
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/evaluation/**
---

# LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Evaluation Experiment Workflows Leverage Dedicated Schema

Scope: applies to `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LSE-001** SHOULD: Evaluation experiment workflows SHOULD leverage dedicated schema and evaluation submodules provided by the SDK to standardize input and output structures across test runs.

### Verify

```bash
echo 'Discover and execute project test suite for evaluation modules'
echo 'Discover dependency lock artifact and verify resolved client SDK version'
echo 'Discover static analysis and linter scripts to validate defensive wrapper typing'
```

**Accept when:**
- All evaluation unit and integration test suites pass successfully under test environments.
- Defensive wrapper tests confirm that rejected client operations resolve to designated fallback values without unhandled rejections.
- Trace listener circuit breaker tests confirm that exceeding the failure threshold suppresses remote emissions for the duration of the cooldown period.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>