---
version: 2
name: cross-cutting-every-domain-subsystem-define-its-2eab
description: "Collocated Domain Types Modules for Contract Isolation: Every Domain Subsystem Define Its Exported"
metadata:
  actual:
    adr_id: 2eab1c22-fdd8-46ed-a197-c84ef0f0b5c2
    status: accepted
    candidate_group_id: 6fb76454-77db-42d4-a2b7-888812dd2ae0
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Collocated Domain Types Modules for Contract Isolation: Every Domain Subsystem Define Its Exported

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all domain subsystems, repositories, storage backends, protocol handlers, and validation modules.

### Rules

- **R-DOM-001** MUST: Every domain subsystem MUST define its exported domain interfaces, payload structures, and entity models within a dedicated collocated types module.
- **R-DOM-002** MUST: Declare pure data interfaces, enumerations, and type aliases within the domain types module without importing runtime operational modules.
- **R-DOM-003** MUST: Derive static types directly from runtime schema definitions where schemas exist to maintain synchronization without duplicate declarations.

### Verify

```bash
# Discover and execute the repository type-checking and linting suites configured in the build manifest
# Discover the static analysis validation script from repository configuration and run it to verify domain type definitions
```

**Accept when:**
- The discovered repository type-checking suite exits with code zero across all subsystem packages.
- Static analysis confirms that domain interfaces and data models are defined within dedicated types modules and consumed without circular dependencies.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated static analysis, type checking, and peer code review.
</enforcement>