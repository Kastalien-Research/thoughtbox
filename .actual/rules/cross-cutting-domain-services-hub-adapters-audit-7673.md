---
version: 2
name: cross-cutting-domain-services-hub-adapters-audit-7673
description: "Adopt Persistence Types Module for Cross-Domain Data Contracts: Domain Services Hub Adapters Audit Processors"
metadata:
  actual:
    adr_id: 76735330-3682-4d27-af01-38d00b2957f7
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

# Adopt Persistence Types Module for Cross-Domain Data Contracts: Domain Services Hub Adapters Audit Processors

Scope: applies to `src/audit/**`, `src/hub/**`, `src/observability/**`.

These rules are ALWAYS ACTIVE for all subsystem modules, storage adapters, audit generators, and gateway handlers interacting with persistent entity state, and internal cross-module interfaces sharing data transfer structures derived from persistent records.

### Rules

- **R-PTC-001** MUST: Domain services, hub adapters, audit processors, and boundary handlers MUST import shared persistence entities and data transfer contracts exclusively from the centralized persistence types module.

### Verify

```bash
# Discover and run the project type checking script to verify that all cross-module persistence imports adhere to the centralized types contract without type errors.
# Discover and execute the module boundary verification script to ensure no circular dependencies exist between persistence modules and domain subsystems.
# Discover and run the repository test suite to confirm that storage adapters, proposal handlers, and gateway endpoints pass validation against the centralized entity schemas.
```

**Accept when:**
- All subsystem modules import shared persistence entities from the centralized persistence types module without compiler diagnostics.
- Zero circular dependencies are detected between persistence modules and dependent domain services.
- All boundary adapters and operations handlers pass contract verification tests against the centralized schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is enforced via automated static type analysis, architecture boundary and dependency linting checks, and peer review.
</enforcement>