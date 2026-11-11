---
version: 2
name: cross-cutting-before-implementing-code-that-integrates-65d9
description: "Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Before Implementing Code That Integrates Shared"
metadata:
  actual:
    adr_id: 65d9c9e2-7e1b-4f36-9445-4c536ca0c219
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

# Adoption of the peer-notebook manifest Module for Shared Contract and Metadata Verification: Before Implementing Code That Integrates Shared

Scope: applies to `src/merge-evidence/**`, `src/notebook/**`.

These rules are ALWAYS ACTIVE for modules responsible for notebook contract validation, input parsing, schema boundary enforcement, hashing, digest calculation, and evidence verification of peer notebook structures.

### Rules

- **R-PNM-001** MUST: Before implementing code that integrates with shared internal modules or external libraries, the consumer MUST inspect the repository lock or resolution artifact to confirm resolved dependency specifications and verify compatibility.
- **R-PNM-002** MUST: Consumers MUST derive all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-PNM-003** MUST: Before writing code that uses a versioned library, execute in order: find the dependency manifest, identify the build tool, inspect the repository lock or resolution artifact, look up official documentation for that exact version, and confirm every API/class/function exists before using it.

### Verify

```bash
# Discover and execute repository static analysis and type verification routines
# to confirm that all notebook manifest references resolve to the peer-notebook manifest module.
# Discover and execute project test suites covering contract validation and evidence hashing.
```

**Accept when:**
- All references to peer notebook manifest structures resolve directly to the peer-notebook manifest module across all consuming subsystems.
- Static analysis and test suites verify that contract validation and evidence hashing operations execute successfully against the shared manifest definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis, dependency graph inspection, and peer code reviews enforce compliance.
</enforcement>