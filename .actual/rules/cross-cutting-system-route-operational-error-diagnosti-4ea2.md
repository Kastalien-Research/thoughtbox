---
version: 2
name: cross-cutting-system-route-operational-error-diagnosti-4ea2
description: "Runtime Console API for Operational Logging: System Route Operational Error Diagnostic Warning"
metadata:
  actual:
    adr_id: 4ea2305b-f29e-4c12-8996-51c0f14b010b
    status: accepted
    candidate_group_id: 8545acc7-4328-426e-8a32-88b80982fc9e
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - .agents/skills/effect-ts/scripts/**
      - .claude/skills/effect-ts/scripts/**
      - scripts/**
      - src/**
---

# Runtime Console API for Operational Logging: System Route Operational Error Diagnostic Warning

Scope: applies to `.agents/skills/effect-ts/scripts/**`, `.claude/skills/effect-ts/scripts/**`, `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for standalone command-line scripts, evaluation harnesses, background event handlers, and operational error reporting where dedicated logging service infrastructure is absent.

### Rules

- **R-LOG-001** MUST: The system MUST route operational error and diagnostic warning messages directly to standard error output using runtime console methods rather than introducing an external logging framework for standalone scripts and handlers.

### Verify

```bash
# Discover the project verification scripts from the repository manifest and execute them
# Discover and run the static analysis script defined in the project configuration
```

**Accept when:**
- Static analysis checks pass with zero unhandled logging violations across all modules.
- All automated test suites and script validation targets execute and complete with expected diagnostic stream output.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory and enforced via automated code analysis, linting checks, and peer code review.
</enforcement>