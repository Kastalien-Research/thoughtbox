---
version: 2
name: cross-cutting-components-not-invoke-validation-methods-19af
description: "Scoped Context Binding via validatorService: Components Not Invoke Validation Methods Unbound"
metadata:
  actual:
    adr_id: 19afa887-9972-41f7-9a8d-10316ef59fef
    status: accepted
    candidate_group_id: 90718bdd-4d90-4a6f-8fa4-b50f5c5bc670
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge-evidence/**
      - src/notebook/**
      - src/protocol/**
---

# Scoped Context Binding via validatorService: Components Not Invoke Validation Methods Unbound

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`, `src/protocol/**`.

These rules are ALWAYS ACTIVE for evaluation workflows executing cell attestation, claim generation, or checkpoint validation across protocol handlers, and merge evidence generators reconciling claims across divergent branches.

### Rules

- **R-VAL-001** MUST_NOT: Components MUST NOT invoke validation methods on an unbound validatorService instance or pass ambient execution coordinates dynamically per validation call.

### Verify

```bash
# Discover the project verification script from the repository manifest and execute test suites covering protocol handlers and validator bindings.
# Inspect the lock resolution artifact using repository tooling to confirm all dependency versions match expected definitions.
# Run static analysis checks defined in repository configuration to ensure no unbound validator service calls exist.
```

**Accept when:**
- All protocol and notebook validator test suites pass without unbound provider invocation warnings.
- All attestation records in evidence generation contain valid bound context coordinates.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests containing unbound validator service invocations are blocked from merging.
</enforcement>