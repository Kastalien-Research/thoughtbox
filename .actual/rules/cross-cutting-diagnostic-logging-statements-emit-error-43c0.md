---
version: 2
name: cross-cutting-diagnostic-logging-statements-emit-error-43c0
description: "Runtime Console API for Operational Logging: Diagnostic Logging Statements Emit Error Objects"
metadata:
  actual:
    adr_id: 43c09d2b-5a5c-49c2-94cc-36591e6d085c
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

# Runtime Console API for Operational Logging: Diagnostic Logging Statements Emit Error Objects

Scope: applies to `.agents/skills/effect-ts/scripts/**`, `.claude/skills/effect-ts/scripts/**`, `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for standalone command-line scripts, evaluation harnesses, and background event handlers requiring lightweight diagnostic output, and operational error reporting and warning notification where dedicated logging service infrastructure is absent.

### Rules

- **R-LOG-001** SHOULD: Diagnostic logging statements SHOULD emit error objects directly or extract message properties to preserve failure descriptions.

### Verify

```bash
# Discover the project verification scripts from the repository manifest and execute them to verify that console invocations adhere to static analysis and operational guidelines.
# Discover and run the static analysis script defined in the project configuration to ensure error and warning streams are handled consistently across modules.
```

**Accept when:**
- Static analysis checks pass with zero unhandled logging violations across all modules.
- All automated test suites and script validation targets execute and complete with expected diagnostic stream output.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>