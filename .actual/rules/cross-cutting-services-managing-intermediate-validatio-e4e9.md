---
version: 2
name: cross-cutting-services-managing-intermediate-validatio-e4e9
description: "Scoped Context Binding via validatorService: Services Managing Intermediate Validation State Cache"
metadata:
  actual:
    adr_id: e4e99dc0-906a-406c-9bce-619c42425652
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

# Scoped Context Binding via validatorService: Services Managing Intermediate Validation State Cache

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`, `src/protocol/**`.

These rules are ALWAYS ACTIVE for all evaluation workflows executing cell attestation, claim generation, or checkpoint validation across protocol handlers, and merge evidence generators reconciling claims across divergent branches.

### Rules

- **R-VAL-001** SHOULD: Services managing intermediate validation state SHOULD cache and resolve bound validator instances using the composite target identifier tuple.
- **R-VAL-002** MANDATORY: Derive bound validator instances at the entry point of protocol handling routines and propagate the bound instance through the evaluation lifecycle.
- **R-VAL-003** MANDATORY: Ensure factory methods producing validatorService bindings validate the presence of both notebook and cell identifiers before returning the bound instance.
- **R-VAL-004** MANDATORY (LOCK-VERSION GROUNDING): Before writing code that uses a versioned library, execute in order: (1) Find dependency manifest, (2) Identify build tool, (3) Inspect repository lock/resolution artifact for exact version, (4) Look up official docs/changelog for that exact version, (5) Confirm every API/class/function exists in that version's docs, (6) Re-run steps 3-5 per dependency at point of use.

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
Claude Code MUST NOT skip or defer verification. All pull requests containing unbound validator service invocations are blocked from merging. Runtime invocations of unbound validation routines throw descriptive scoping exceptions immediately.
</enforcement>