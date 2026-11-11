---
version: 2
name: cross-cutting-evaluation-runners-instantiate-client-ex-8ace
description: "LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Runners Instantiate Client Explicitly Configured"
metadata:
  actual:
    adr_id: 8ace388f-0ab4-4c68-96d2-c5f9005210d9
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

# LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Runners Instantiate Client Explicitly Configured

Scope: applies to `scripts/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EVAL-001** MUST: Evaluation runners MUST instantiate the evaluation client using explicitly configured credentials and service endpoints.

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