---
version: 2
name: cross-cutting-subsystems-not-define-duplicate-local-81e5
description: "Adopt Persistence Types Module for Cross-Domain Data Contracts: Subsystems Not Define Duplicate Local Variations"
metadata:
  actual:
    adr_id: 81e573bd-ca08-4599-8b20-99fd358fe121
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

# Adopt Persistence Types Module for Cross-Domain Data Contracts: Subsystems Not Define Duplicate Local Variations

Scope: applies to `src/audit/**`, `src/hub/**`, `src/observability/**`.

These rules are ALWAYS ACTIVE for all subsystem modules, storage adapters, audit generators, and gateway handlers interacting with persistent entity state, and internal cross-module interfaces sharing data transfer structures derived from persistent records.

### Rules

- **R-PERSIST-001** MUST_NOT: Subsystems MUST NOT define duplicate or local variations of data entity schemas that represent shared persistent state.

### Verify

```bash
# Discover and run the project type checking script to verify cross-module persistence imports
# Discover and execute the module boundary verification script to ensure no circular dependencies exist
# Discover and run the repository test suite to confirm storage adapters, proposal handlers, and gateway endpoints pass validation
```

**Accept when:**
- All subsystem modules import shared persistence entities from the centralized persistence types module without compiler diagnostics.
- Zero circular dependencies are detected between persistence modules and dependent domain services.
- All boundary adapters and operations handlers pass contract verification tests against the centralized schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>