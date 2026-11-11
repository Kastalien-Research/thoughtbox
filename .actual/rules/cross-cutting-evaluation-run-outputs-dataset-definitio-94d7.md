---
version: 2
name: cross-cutting-evaluation-run-outputs-dataset-definitio-94d7
description: "LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Run Outputs Dataset Definitions Conform"
metadata:
  actual:
    adr_id: 94d7d889-d935-4627-9740-ba21df7006fe
    status: accepted
    candidate_group_id: 24daf34b-1fd7-4e4f-96ed-da0e6d818c7e
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/evaluation/**
---

# LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Run Outputs Dataset Definitions Conform

Scope: applies to `scripts/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all evaluation runners executing model benchmarks, scripts querying evaluation datasets and recording judge outputs, and type definitions and schema contracts governing evaluation runs.

### Rules

- **R-EVAL-001** MUST: Evaluation run outputs and dataset definitions MUST conform to the shared schemas provided by the evaluation library schema module.

### Verify

```bash
# Discover the project's dependency manifest and lock artifact, and verify that the evaluation library is declared and locked to a resolved release.
# Discover and run the project's static analysis and type verification script to ensure evaluation runners correctly conform to the evaluation schema contracts.
# Discover and run the evaluation test suite to verify that evaluation client calls execute without throwing unhandled exceptions when telemetry endpoints are unreachable.
```

**Accept when:**
- The evaluation library and its schema modules resolve successfully according to the project's lock artifact.
- Static type verification confirms that all evaluation outputs and datasets adhere to the standardized evaluation schemas.
- Evaluation runners execute successfully with safe fallback handling when remote evaluation credentials or network endpoints are unavailable.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>