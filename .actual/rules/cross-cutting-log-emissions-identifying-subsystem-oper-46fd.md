---
version: 2
name: cross-cutting-log-emissions-identifying-subsystem-oper-46fd
description: "Runtime Console API for Operational Logging: Log Emissions Identifying Subsystem Operations Include"
metadata:
  actual:
    adr_id: 46fdbd26-1cd6-49df-a97d-fa6136c8bc14
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

# Runtime Console API for Operational Logging: Log Emissions Identifying Subsystem Operations Include

Scope: applies to `.agents/skills/effect-ts/scripts/**`, `.claude/skills/effect-ts/scripts/**`, `scripts/**`, `src/**`.

These rules are ALWAYS ACTIVE for standalone command-line scripts, evaluation harnesses, and background event handlers requiring lightweight diagnostic output, and operational error reporting and warning notification where dedicated logging service infrastructure is absent.

### Rules

- **R-LOG-001** SHOULD: Log emissions identifying subsystem operations SHOULD include a bracketed subsystem prefix to maintain context across concurrent execution logs.
- **R-LOG-002** MANDATORY: Subsystems emitting diagnostic warnings MUST prefix their message strings with the subsystem identifier to provide context when reading aggregated logs.
- **R-LOG-003** MANDATORY: When capturing caught exceptions for output, pass the error instance or its message string explicitly to preserve diagnostic detail.
- **R-LOG-004** MANDATORY: Consumers MUST follow the LOCK-VERSION GROUNDING policy before writing code that uses a versioned library (discover manifest, identify build tool, inspect lock/resolution artifact, look up official documentation for exact resolved version, confirm API existence, re-run per dependency at point of use).

### Verify

```bash
# Discover and run the project verification scripts from the repository manifest
# Discover and run the static analysis script defined in the project configuration
```

**Accept when:**
- Static analysis checks pass with zero unhandled logging violations across all modules.
- All automated test suites and script validation targets execute and complete with expected diagnostic stream output.

<enforcement>
Verification is mandatory. Pull request merge is blocked until non-compliant or silent error logging patterns are corrected. Claude Code MUST NOT skip or defer verification.
</enforcement>