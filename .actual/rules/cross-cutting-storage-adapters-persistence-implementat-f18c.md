---
version: 2
name: cross-cutting-storage-adapters-persistence-implementat-f18c
description: "Collocated Domain Types Modules for Contract Isolation: Storage Adapters Persistence Implementations Implement Domain"
metadata:
  actual:
    adr_id: f18cd2b0-74e2-48c9-9ff3-48624b3e3f0a
    status: accepted
    candidate_group_id: 6fb76454-77db-42d4-a2b7-888812dd2ae0
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Collocated Domain Types Modules for Contract Isolation: Storage Adapters Persistence Implementations Implement Domain

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all domain subsystems, repositories, storage backends, protocol handlers, validation modules, and cross-subsystem interface definitions.

### Rules

- **R-COL-001** SHOULD: Storage adapters and persistence implementations SHOULD implement domain interface contracts exposed by the types module to ensure backend interchangeability.
- **R-COL-002** MANDATORY: Declare pure data interfaces, enumerations, and type aliases within the domain types module without importing runtime operational modules.
- **R-COL-003** MANDATORY: When exposing runtime validation schemas alongside static types, derive static types directly from schema definitions to maintain synchronization without duplicate declarations.
- **R-COL-004** MANDATORY: Execute the lock-version grounding process (discover dependency manifest, identify build tool, inspect lock/resolution artifact, lookup official documentation for the exact resolved version, and confirm every API/class/function exists in that exact version's documentation) before writing code that uses a versioned library.

### Verify

```bash
# Discover and execute the repository type-checking and linting suites configured in the build manifest
# Discover and run the static analysis validation script from repository configuration to verify domain type definitions remain confined to dedicated contract modules without circular dependencies
```

**Accept when:**
- The discovered repository type-checking suite exits with code zero across all subsystem packages.
- Static analysis confirms that domain interfaces and data models are defined within dedicated types modules and consumed without circular dependencies.

<enforcement>
Verification is mandatory. Claude Code MUST NOT skip or defer verification.
</enforcement>