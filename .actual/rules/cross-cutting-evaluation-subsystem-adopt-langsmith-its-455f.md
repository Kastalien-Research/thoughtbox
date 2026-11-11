---
version: 2
name: cross-cutting-evaluation-subsystem-adopt-langsmith-its-455f
description: "LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Subsystem Adopt Langsmith Its Schema"
metadata:
  actual:
    adr_id: 455fcd0f-f0e1-40ee-b0e9-125fa13ef527
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

# LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Subsystem Adopt Langsmith Its Schema

Scope: applies to `scripts/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EVAL-001** MUST: The evaluation subsystem MUST adopt LangSmith and its evaluation and schema modules as the standard library for experiment tracking, dataset management, and evaluation metric collection.
- **R-EVAL-002** MANDATORY: Execute lock-version grounding procedures before writing code that uses versioned libraries (find manifest, identify build tool, inspect lock artifact, look up official documentation for the exact version, confirm APIs exist, and re-run per dependency at point of use).
- **R-EVAL-003** MANDATORY: Configure client initialization through structured environment settings, providing explicit fallbacks when client instances cannot be initialized.
- **R-EVAL-004** MANDATORY: Encapsulate remote client API invocations within reusable asynchronous error-boundary methods that capture and log service errors without raising uncaught exceptions.

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
Claude Code MUST NOT skip or defer verification. Continuous integration checks enforce static typing and schema compliance across evaluation modules, blocking PRs introducing unwrapped client invocations or incompatible schema shapes.
</enforcement>