---
version: 2
name: cross-cutting-domain-modules-extend-base-persistence-8679
description: "Adopt Persistence Types Module for Cross-Domain Data Contracts: Domain Modules Extend Base Persistence Types"
metadata:
  actual:
    adr_id: 86791664-fea0-4212-8414-7af71cf0a504
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

# Adopt Persistence Types Module for Cross-Domain Data Contracts: Domain Modules Extend Base Persistence Types

Scope: applies to `src/audit/**`, `src/hub/**`, `src/observability/**`.

These rules are ALWAYS ACTIVE for all subsystem modules, storage adapters, audit generators, and gateway handlers interacting with persistent entity state, and internal cross-module interfaces sharing data transfer structures derived from persistent records.

### Rules

- **R-PERSIST-001** MAY: Domain modules MAY extend base persistence types with local view representations or projection types provided they maintain backward compatibility with the core persistence schemas.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>