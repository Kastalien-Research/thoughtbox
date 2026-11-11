---
version: 2
name: cross-cutting-service-implementations-storage-adapters-ad47
description: "Collocated Domain Types Modules for Contract Isolation: Service Implementations Storage Adapters Protocol Handlers"
metadata:
  actual:
    adr_id: ad4774ae-9b0c-408f-9ac8-365619bc7b8b
    status: accepted
    candidate_group_id: 6fb76454-77db-42d4-a2b7-888812dd2ae0
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Collocated Domain Types Modules for Contract Isolation: Service Implementations Storage Adapters Protocol Handlers

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-DOM-001** MUST: Service implementations, storage adapters, and protocol handlers MUST import data contracts from the collocated types module and MUST NOT declare ad-hoc exported domain interface definitions within operational implementation files.

### Verify

```bash
# Discover and execute the repository type-checking and linting suites configured in the build manifest
# Run the static analysis validation script from repository configuration
```

**Accept when:**
- The discovered repository type-checking suite exits with code zero across all subsystem packages.
- Static analysis confirms that domain interfaces and data models are defined within dedicated types modules and consumed without circular dependencies.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>