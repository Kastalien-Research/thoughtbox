---
version: 2
name: cross-cutting-evaluation-subsystem-adopt-langsmith-sdk-aff4
description: "LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Evaluation Subsystem Adopt Langsmith Sdk Unified"
metadata:
  actual:
    adr_id: aff41d15-6733-447a-aa3c-94a8e33cfcba
    status: accepted
    candidate_group_id: ded5e24f-ce67-493e-940e-d226792e5648
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/evaluation/**
---

# LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Evaluation Subsystem Adopt Langsmith Sdk Unified

Scope: applies to `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EVA-001** MUST: The evaluation subsystem MUST adopt the LangSmith SDK as the unified client interface for dataset curation, experiment execution, and execution tracing, instantiating the client centrally with explicit API key and API URL configuration parameters.

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