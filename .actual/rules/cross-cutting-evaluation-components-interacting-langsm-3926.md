---
version: 2
name: cross-cutting-evaluation-components-interacting-langsm-3926
description: "LangSmith Client Adoption with Safe Fallback Execution Middleware: Evaluation Components Interacting Langsmith Platform Adopt"
metadata:
  actual:
    adr_id: 39265fbe-6a53-44f5-9ca4-41369ea0bd47
    status: accepted
    candidate_group_id: 65cde823-dca7-4092-9d32-d1f3ce786438
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# LangSmith Client Adoption with Safe Fallback Execution Middleware: Evaluation Components Interacting Langsmith Platform Adopt

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for evaluation modules, dataset managers, experiment runners, and internal services that perform asynchronous network operations against LangSmith client endpoints.

### Rules

- **R-LANGSMITH-001** MUST: All evaluation components interacting with the LangSmith platform MUST adopt the official LangSmith client SDK (Client) and route all remote SDK operations through an encapsulated safe execution boundary middleware.

### Verify

```bash
# Discover and run the project test suite covering evaluation modules to verify safe execution boundary fallback behavior.
# Discover and execute project static analysis and type-checking scripts to verify LangSmith client calls conform to the boundary signature.
# Inspect the project dependency lock artifact to confirm the resolved client library version matches the documented API surface.
```

**Accept when:**
- All automated test suites for evaluation dataset management and experiment execution pass when the external client is unconfigured, confirming that fallback values are returned without throwing unhandled exceptions.
- Static analysis and type checking scripts complete without diagnostic errors across all evaluation service call sites.
- Execution logs capture structured diagnostic warnings containing the expected operation label and error details when external service operations fail.

<enforcement>
Claude Code MUST NOT skip or defer verification. Pull requests containing direct, unguarded client SDK calls without fallback protection are blocked from merging.
</enforcement>