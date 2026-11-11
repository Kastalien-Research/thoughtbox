---
version: 2
name: cross-cutting-protocol-handlers-configuring-multi-stag-015d
description: "Scoped Context Binding via validatorService: Protocol Handlers Configuring Multi Stage Verification"
metadata:
  actual:
    adr_id: 015dcf44-ff6a-4167-9419-7b6d7a9ee994
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

# Scoped Context Binding via validatorService: Protocol Handlers Configuring Multi Stage Verification

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`, `src/protocol/**`.

These rules are ALWAYS ACTIVE for evaluation workflows executing cell attestation, claim generation, or checkpoint validation across protocol handlers, and merge evidence generators reconciling claims across divergent branches.

### Rules

- **R-VAL-001** MUST: Protocol handlers configuring multi-stage verification MUST explicitly bind distinct validatorService instances for primary and recovery validation roles.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>