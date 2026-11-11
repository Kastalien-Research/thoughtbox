---
version: 2
name: cross-cutting-modules-responsible-contract-evaluation-b08a
description: "Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Modules Responsible Contract Evaluation Notebook Validation"
metadata:
  actual:
    adr_id: b08a22ad-0414-4eff-a8bf-51cf10105a05
    status: accepted
    candidate_group_id: 4c1bdf23-53b4-4b04-a845-65afb2868e48
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge-evidence/**
      - src/notebook/**
---

# Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Modules Responsible Contract Evaluation Notebook Validation

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`.

These rules are ALWAYS ACTIVE for modules responsible for notebook contract validation, input parsing, schema boundary enforcement, hashing, digest calculation, and evidence verification of peer notebook structures.

### Rules

- **R-NOTEBOOK-001** MUST: All modules responsible for contract evaluation, notebook validation, or evidence hashing MUST import and standardize on the peer-notebook manifest module for canonical manifest definitions rather than declaring local schema duplicates.

### Verify

```bash
# Discover and execute the repository static analysis and type verification routines
# to confirm that all notebook manifest references resolve to the peer-notebook manifest module.
# Discover and execute the project test suites covering contract validation and evidence hashing
# to ensure consistent execution against shared manifest schemas.
```

**Accept when:**
- All references to peer notebook manifest structures resolve directly to the peer-notebook manifest module across all consuming subsystems.
- Static analysis and test suites verify that contract validation and evidence hashing operations execute successfully against the shared manifest definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>