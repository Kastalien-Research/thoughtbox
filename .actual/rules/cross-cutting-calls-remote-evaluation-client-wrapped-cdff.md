---
version: 2
name: cross-cutting-calls-remote-evaluation-client-wrapped-cdff
description: "LangSmith Evaluation and Experiment Tracking Library Adoption: Calls Remote Evaluation Client Wrapped Fault"
metadata:
  actual:
    adr_id: cdff1181-9be5-4429-a748-1d56f3c19c5e
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

# LangSmith Evaluation and Experiment Tracking Library Adoption: Calls Remote Evaluation Client Wrapped Fault

Scope: applies to `scripts/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all evaluation runners, benchmark scripts, and schema contract definitions governing evaluation workflows.

### Rules

- **R-EVAL-001** MUST: All calls to the remote evaluation client MUST be wrapped in fault-tolerant error boundaries that catch exceptions, log warnings, and return predefined fallbacks to prevent telemetry failures from halting benchmark execution.
- **R-EVAL-002** MANDATORY: Execute lock-version grounding before writing code that uses a versioned library by finding the dependency manifest, identifying the build tool, inspecting the lock/resolution artifact, looking up official documentation for that exact version, confirming API existence, and repeating at points of use for version-sensitive behavior.

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
Claude Code MUST NOT skip or defer verification. Continuous integration checks enforce static typing and schema compliance, and peer code reviews validate error-boundary wrappers and credential handling.
</enforcement>