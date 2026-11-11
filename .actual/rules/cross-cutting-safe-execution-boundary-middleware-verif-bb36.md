---
version: 2
name: cross-cutting-safe-execution-boundary-middleware-verif-bb36
description: "LangSmith Client Adoption with Safe Fallback Execution Middleware: Safe Execution Boundary Middleware Verify That"
metadata:
  actual:
    adr_id: bb36bdec-5a6b-4cf4-9b7f-492fe83e7762
    status: accepted
    candidate_group_id: 65cde823-dca7-4092-9d32-d1f3ce786438
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# LangSmith Client Adoption with Safe Fallback Execution Middleware: Safe Execution Boundary Middleware Verify That

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LS-001** MUST: The safe execution boundary middleware MUST verify that the LangSmith Client instance is initialized before invoking any remote operation, immediately returning the caller-supplied fallback value if the client is uninitialized.

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
Claude Code MUST NOT skip or defer verification. All pull requests containing direct, unguarded client SDK calls without fallback protection are blocked from merging.
</enforcement>