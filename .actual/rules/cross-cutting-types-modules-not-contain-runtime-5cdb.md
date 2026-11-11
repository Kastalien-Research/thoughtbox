---
version: 2
name: cross-cutting-types-modules-not-contain-runtime-5cdb
description: "Collocated Domain Types Modules for Contract Isolation: Types Modules Not Contain Runtime Business"
metadata:
  actual:
    adr_id: 5cdb72a6-5990-4367-be67-85a7696ae1e1
    status: accepted
    candidate_group_id: 6fb76454-77db-42d4-a2b7-888812dd2ae0
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Collocated Domain Types Modules for Contract Isolation: Types Modules Not Contain Runtime Business

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all domain subsystems, repositories, storage backends, protocol handlers, validation modules, and cross-subsystem interface definitions.

### Rules

- **R-COL-001** MUST_NOT: Types modules MUST NOT contain runtime business logic, network communication handlers, or side-effecting initialization code.
- **R-COL-002** MANDATORY: Declare pure data interfaces, enumerations, and type aliases within the domain types module without importing runtime operational modules.
- **R-COL-003** MANDATORY: When exposing runtime validation schemas alongside static types, derive static types directly from schema definitions to maintain synchronization without duplicate declarations.
- **R-COL-004** MANDATORY: Before writing code that uses a versioned library, execute in order:
  1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
  2. Identify the build tool from the manifest.
  3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
  4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
  5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
  6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.

### Verify

```bash
# Discover and execute the repository type-checking and linting suites configured in the build manifest
# Discover the static analysis validation script from repository configuration and run it to verify boundary confinement
```

**Accept when:**
- The discovered repository type-checking suite exits with code zero across all subsystem packages.
- Static analysis confirms that domain interfaces and data models are defined within dedicated types modules and consumed without circular dependencies.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated static analysis, type checking, and peer code review verifying module boundary guidelines.
</enforcement>