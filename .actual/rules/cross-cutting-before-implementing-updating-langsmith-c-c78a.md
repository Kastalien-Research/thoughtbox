---
version: 2
name: cross-cutting-before-implementing-updating-langsmith-c-c78a
description: "LangSmith Client Adoption with Safe Fallback Execution Middleware: Before Implementing Updating Langsmith Client Integration"
metadata:
  actual:
    adr_id: c78a9163-5893-4821-be54-d38b213b4611
    status: accepted
    candidate_group_id: 65cde823-dca7-4092-9d32-d1f3ce786438
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# LangSmith Client Adoption with Safe Fallback Execution Middleware: Before Implementing Updating Langsmith Client Integration

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LANG-001** MUST: Before implementing or updating LangSmith client integration code, consumers MUST discover the project dependency manifest and lock resolution artifact to identify and verify the exact resolved version of the LangSmith client library.

### Verify

```bash
# Discover and run the project test suite covering evaluation modules to verify safe execution boundary fallback behavior.
# Discover and execute the project static analysis and type-checking scripts to verify that all LangSmith client calls conform to the required boundary signature.
# Discover and inspect the project dependency lock artifact to confirm the resolved client library version matches the documented API surface.
```

**Accept when:**
- All automated test suites for evaluation dataset management and experiment execution pass when the external client is unconfigured, confirming that fallback values are returned without throwing unhandled exceptions.
- Static analysis and type checking scripts complete without diagnostic errors across all evaluation service call sites.
- Execution logs capture structured diagnostic warnings containing the expected operation label and error details when external service operations fail.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>