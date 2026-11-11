---
version: 2
name: cross-cutting-consumers-extend-peer-notebook-manifest-a17e
description: "Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Consumers Extend Peer Notebook Manifest Schema"
metadata:
  actual:
    adr_id: a17e1b81-981c-4cb7-8afb-c330c536f7e4
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

# Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Consumers Extend Peer Notebook Manifest Schema

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-PNM-001** MAY: Consumers MAY extend peer-notebook manifest schema definitions with domain-specific metadata provided that core manifest contracts remain backward compatible.

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