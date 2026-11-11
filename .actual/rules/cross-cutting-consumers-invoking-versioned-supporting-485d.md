---
version: 2
name: cross-cutting-consumers-invoking-versioned-supporting-485d
description: "Scoped Context Binding via validatorService: Consumers Invoking Versioned Supporting Libraries Inspect"
metadata:
  actual:
    adr_id: 485d4389-10c0-4416-9875-c09e0ed46925
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

# Scoped Context Binding via validatorService: Consumers Invoking Versioned Supporting Libraries Inspect

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`, `src/protocol/**`.

These rules are ALWAYS ACTIVE for evaluation workflows executing cell attestation, claim generation, or checkpoint validation across protocol handlers, and merge evidence generators reconciling claims across divergent branches.

### Rules

- **R-SCB-001** MUST: Consumers invoking versioned supporting libraries MUST inspect the repository lock artifact to verify the exact resolved dependency version prior to binding provider instances.

### Verify

```bash
# Discover and execute project verification test suites covering protocol handlers and validator bindings
# Inspect the lock resolution artifact using repository tooling to confirm dependency versions match expected definitions
# Run static analysis checks defined in repository configuration to ensure no unbound validator service calls exist
```

**Accept when:**
- All protocol and notebook validator test suites pass without unbound provider invocation warnings.
- All attestation records in evidence generation contain valid bound context coordinates.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated test suites, static analysis, and peer reviews enforce these rules, and violations block pull requests from merging or throw descriptive scoping exceptions.
</enforcement>