---
version: 2
name: cross-cutting-modules-importing-persistence-types-modu-f85b
description: "Adopt Persistence Types Module for Cross-Domain Data Contracts: Modules Importing Persistence Types Module Not"
metadata:
  actual:
    adr_id: f85b8e50-813e-43f2-a0ed-f4f65e532965
    status: accepted
    candidate_group_id: 7cac724f-731d-4dae-85b3-9841a21eb763
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/audit/**
      - src/hub/**
      - src/observability/**
---

# Adopt Persistence Types Module for Cross-Domain Data Contracts: Modules Importing Persistence Types Module Not

Scope: applies to `src/audit/**`, `src/hub/**`, `src/observability/**`.

These rules are ALWAYS ACTIVE for all subsystem modules, storage adapters, audit generators, and gateway handlers interacting with persistent entity state.

### Rules

- **R-PERSIST-001** MUST_NOT: Modules importing the persistence types module MUST NOT introduce circular dependencies between storage driver implementations and domain logic.

### Verify

```bash
# Discover and run the project type checking script to verify cross-module persistence imports
# Discover and execute the module boundary verification script to ensure no circular dependencies exist
# Discover and run the repository test suite to confirm storage adapters and handlers pass validation
```

**Accept when:**
- All subsystem modules import shared persistence entities from the centralized persistence types module without compiler diagnostics.
- Zero circular dependencies are detected between persistence modules and dependent domain services.
- All boundary adapters and operations handlers pass contract verification tests against the centralized schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>