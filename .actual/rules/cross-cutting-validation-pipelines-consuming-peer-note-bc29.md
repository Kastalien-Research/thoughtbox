---
version: 2
name: cross-cutting-validation-pipelines-consuming-peer-note-bc29
description: "Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Validation Pipelines Consuming Peer Notebook Structures"
metadata:
  actual:
    adr_id: bc29adc3-6a68-44d5-b297-164292ad8474
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

# Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Validation Pipelines Consuming Peer Notebook Structures

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`.

These rules are ALWAYS ACTIVE for modules responsible for notebook contract validation, input parsing, schema boundary enforcement, hashing, digest calculation, and evidence verification of peer notebook structures.

### Rules

- **R-PNM-001** SHOULD: Validation pipelines consuming peer notebook structures SHOULD validate runtime payloads directly against schemas exported by the peer-notebook manifest module prior to downstream execution.
- **R-PNM-002** MANDATORY: Consumers MUST inspect repository dependency configurations to locate the internal module import path for the peer-notebook manifest module.
- **R-PNM-003** SHOULD: Consumers should verify that contract validation rules and cryptographic hashing functions directly reference exported types from the shared manifest module.
- **R-PNM-004** MANDATORY: Before writing code that uses a versioned library, developers MUST find the dependency manifest, identify the build tool, inspect the repository lock or resolution artifact for the exact resolved version, look up official documentation for that exact version, confirm every API/class/function exists in that version, and re-run these checks per dependency at point of use for version-sensitive behavior.

### Verify

```bash
# Discover and execute repository static analysis and type verification routines
# to confirm that all notebook manifest references resolve to the peer-notebook manifest module.
# Discover and execute project test suites covering contract validation and evidence hashing
# to ensure consistent execution against shared manifest schemas.
```

**Accept when:**
- All references to peer notebook manifest structures resolve directly to the peer-notebook manifest module across all consuming subsystems.
- Static analysis and test suites verify that contract validation and evidence hashing operations execute successfully against the shared manifest definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis, dependency graph inspection, and peer code reviews are mandatory. Pull requests introducing duplicate manifest interfaces or bypassing the shared peer-notebook manifest module are blocked from merging.
</enforcement>