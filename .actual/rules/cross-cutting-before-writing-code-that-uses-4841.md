---
version: 2
name: cross-cutting-before-writing-code-that-uses-4841
description: "LangSmith Evaluation and Experiment Tracking Library Adoption: Before Writing Code That Uses Evaluation"
metadata:
  actual:
    adr_id: 4841571b-a237-4903-a61f-edb52daa3ade
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

# LangSmith Evaluation and Experiment Tracking Library Adoption: Before Writing Code That Uses Evaluation

Scope: applies to `scripts/**`, `src/evaluation/**`.

These rules are ALWAYS ACTIVE for all evaluation runners, scripts querying evaluation datasets, and type definitions governing evaluation runs.

### Rules

- **R-EVAL-001** MUST: Before writing code that uses the evaluation library, the consumer MUST inspect the repository lock artifact to determine the exact resolved dependency version and verify API compatibility against that exact version documentation.
- **R-EVAL-002** MANDATORY: Discover and derive dependency manifests, lock artifacts, build tools, and commands from the project repository.
- **R-EVAL-003** MANDATORY: Execute lock-version grounding steps in order (inspect lock artifact, look up exact version documentation, confirm every API exists in that exact version before use).
- **R-EVAL-004** MUST: Configure client initialization through structured environment settings, providing explicit fallbacks when client instances cannot be initialized.
- **R-EVAL-005** MUST: Encapsulate remote client API invocations within reusable asynchronous error-boundary methods that capture and log service errors without raising uncaught exceptions.

### Verify

```bash
# Discover the project's dependency manifest and lock artifact, and verify that the evaluation library is declared and locked to a resolved release.
# (Perform environment-specific discovery as specified by project configuration)

# Discover and run the project's static analysis and type verification script to ensure evaluation runners correctly conform to the evaluation schema contracts.

# Discover and run the evaluation test suite to verify that evaluation client calls execute without throwing unhandled exceptions when telemetry endpoints are unreachable.
```

**Accept when:**
- The evaluation library and its schema modules resolve successfully according to the project's lock artifact.
- Static type verification confirms that all evaluation outputs and datasets adhere to the standardized evaluation schemas.
- Evaluation runners execute successfully with safe fallback handling when remote evaluation credentials or network endpoints are unavailable.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by continuous integration checks enforcing static typing and schema compliance across evaluation modules, and peer code reviews validating error-boundary wrappers and credential handling in evaluation scripts.
</enforcement>