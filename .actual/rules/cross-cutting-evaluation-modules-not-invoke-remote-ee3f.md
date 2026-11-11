---
version: 2
name: cross-cutting-evaluation-modules-not-invoke-remote-ee3f
description: "LangSmith Client Adoption with Safe Fallback Execution Middleware: Evaluation Modules Not Invoke Remote Langsmith"
metadata:
  actual:
    adr_id: ee3fb83e-90b7-49c6-a570-f1e0f5df2e5d
    status: accepted
    candidate_group_id: 65cde823-dca7-4092-9d32-d1f3ce786438
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# LangSmith Client Adoption with Safe Fallback Execution Middleware: Evaluation Modules Not Invoke Remote Langsmith

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all evaluation modules, dataset managers, and experiment runners that integrate with external evaluation and dataset tracking services.

### Rules

- **R-LS-001** MUST_NOT: Evaluation modules MUST NOT invoke remote LangSmith SDK methods directly without wrapping the execution inside the safe boundary middleware.

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