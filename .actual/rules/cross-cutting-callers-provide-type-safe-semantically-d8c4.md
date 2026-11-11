---
version: 2
name: cross-cutting-callers-provide-type-safe-semantically-d8c4
description: "LangSmith Client Adoption with Safe Fallback Execution Middleware: Callers Provide Type Safe Semantically Neutral"
metadata:
  actual:
    adr_id: d8c46063-19f8-4880-b10e-1b5f61255934
    status: accepted
    candidate_group_id: 65cde823-dca7-4092-9d32-d1f3ce786438
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# LangSmith Client Adoption with Safe Fallback Execution Middleware: Callers Provide Type Safe Semantically Neutral

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for evaluation modules, dataset managers, experiment runners, and internal services that perform asynchronous network operations against LangSmith client endpoints.

### Rules

- **R-LANG-001** SHOULD: Callers provide type-safe, semantically neutral fallback values to ensure downstream consumers can proceed without branching on external failure states.
- **R-LANG-002** MANDATORY: Encapsulate external client calls within a safe execution boundary helper method accepting an operation label, a fallback return value, and an asynchronous execution callback.
- **R-LANG-003** MANDATORY: Evaluate whether the underlying client instance is truthy prior to initiating any SDK method calls.
- **R-LANG-004** MANDATORY: Ensure warning logs include distinct operation labels and error messages when external service operations fail.
- **R-LANG-005** MANDATORY: Execute lock-version grounding (inspect manifest, build tool, resolution/lock artifact, and public API reference for the exact resolved version) before writing code that uses a versioned library.

### Verify

```bash
# Discover and run the project test suite covering evaluation modules to verify safe execution boundary fallback behavior.
# Discover and execute project static analysis and type-checking scripts to verify that all LangSmith client calls conform to the required boundary signature.
# Discover and inspect the project dependency lock artifact to confirm the resolved client library version matches the documented API surface.
```

**Accept when:**
- All automated test suites for evaluation dataset management and experiment execution pass when the external client is unconfigured, confirming that fallback values are returned without throwing unhandled exceptions.
- Static analysis and type checking scripts complete without diagnostic errors across all evaluation service call sites.
- Execution logs capture structured diagnostic warnings containing the expected operation label and error details when external service operations fail.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>