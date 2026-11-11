---
version: 2
name: cross-cutting-operational-handlers-not-suppress-caught-6f65
description: "Runtime Console API for Operational Logging: Operational Handlers Not Suppress Caught Error"
metadata:
  actual:
    adr_id: 6f659fad-568e-4e49-9d7a-5f3cc22e9fcd
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

# Runtime Console API for Operational Logging: Operational Handlers Not Suppress Caught Error

Scope: applies to `.agents/skills/effect-ts/scripts/**`, `.claude/skills/effect-ts/scripts/**`, `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for standalone command-line scripts, evaluation harnesses, and background event handlers requiring lightweight diagnostic output.

### Rules

- **R-OPS-001** MUST_NOT: Operational handlers MUST NOT suppress caught error messages when logging failure states to standard error.

### Verify

```bash
# Discover and execute project verification and static analysis scripts from the repository manifest
```

**Accept when:**
- Static analysis checks pass with zero unhandled logging violations across all modules.
- All automated test suites and script validation targets execute and complete with expected diagnostic stream output.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated code analysis, linting checks, and peer code review.
</enforcement>