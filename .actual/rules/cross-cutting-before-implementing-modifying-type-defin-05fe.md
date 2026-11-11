---
version: 2
name: cross-cutting-before-implementing-modifying-type-defin-05fe
description: "Collocated Domain Types Modules for Contract Isolation: Before Implementing Modifying Type Definitions That"
metadata:
  actual:
    adr_id: 05fe3f39-9694-417d-8902-490219927aaa
    status: accepted
    candidate_group_id: 6fb76454-77db-42d4-a2b7-888812dd2ae0
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Collocated Domain Types Modules for Contract Isolation: Before Implementing Modifying Type Definitions That

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TYPE-001** MUST: Before implementing or modifying type definitions that depend on external typing utilities or schema libraries, the consumer MUST inspect the repository lock artifact to determine the exact resolved dependency versions.
- **R-TYPE-002** MUST: Declare pure data interfaces, enumerations, and type aliases within the domain types module without importing runtime operational modules.
- **R-TYPE-003** MUST: Derive static types directly from runtime schema definitions where schemas exist to maintain synchronization without duplicate declarations.

### Verify

```bash
# Discover and execute the repository type-checking and linting suites configured in the build manifest
# Discover and run the static analysis validation script from repository configuration
```

**Accept when:**
- The discovered repository type-checking suite exits with code zero across all subsystem packages.
- Static analysis confirms that domain interfaces and data models are defined within dedicated types modules and consumed without circular dependencies.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>