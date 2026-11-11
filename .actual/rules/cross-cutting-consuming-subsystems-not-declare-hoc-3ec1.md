---
version: 2
name: cross-cutting-consuming-subsystems-not-declare-hoc-3ec1
description: "Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Consuming Subsystems Not Declare Hoc Duplicated"
metadata:
  actual:
    adr_id: 3ec17d56-8632-44ba-acd9-0011d88968bd
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

# Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Consuming Subsystems Not Declare Hoc Duplicated

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`.

These rules are ALWAYS ACTIVE for modules responsible for notebook contract validation, input parsing, schema boundary enforcement, hashing, digest calculation, and evidence verification of peer notebook structures.

### Rules

- **R-PNM-001** MUST_NOT: Consuming subsystems MUST_NOT declare ad-hoc or duplicated peer notebook manifest structural types outside the designated peer-notebook manifest module.

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
Claude Code MUST NOT skip or defer verification. Automated static analysis, dependency graph inspection, and peer code reviews enforce compliance.
</enforcement>