---
version: 2
name: cross-cutting-modules-requiring-cross-boundary-contrac-55fe
description: "Collocated Domain Types Modules for Contract Isolation: Modules Requiring Cross Boundary Contracts Import"
metadata:
  actual:
    adr_id: 55feecd2-4b4b-4876-8278-bf4f77c0ae7a
    status: accepted
    candidate_group_id: 6fb76454-77db-42d4-a2b7-888812dd2ae0
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Collocated Domain Types Modules for Contract Isolation: Modules Requiring Cross Boundary Contracts Import

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all domain subsystems, repositories, storage backends, protocol handlers, and validation modules requiring cross-boundary contracts.

### Rules

- **R-DOMAIN-001** MUST: Modules requiring cross-boundary contracts MUST import those interfaces directly from the target domain types module rather than importing from concrete service or storage files.

### Verify

```bash
# Discover and execute the repository type-checking and linting suites configured in the build manifest
# Run the discovered static analysis validation script from repository configuration
```

**Accept when:**
- The discovered repository type-checking suite exits with code zero across all subsystem packages.
- Static analysis confirms that domain interfaces and data models are defined within dedicated types modules and consumed without circular dependencies.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated static analysis and type checking.
</enforcement>