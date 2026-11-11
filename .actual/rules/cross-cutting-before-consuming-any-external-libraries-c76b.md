---
version: 2
name: cross-cutting-before-consuming-any-external-libraries-c76b
description: "Adopt Persistence Types Module for Cross-Domain Data Contracts: Before Consuming Any External Libraries Runtime"
metadata:
  actual:
    adr_id: c76b75b8-3d73-4ee6-9f8f-52758393daee
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

# Adopt Persistence Types Module for Cross-Domain Data Contracts: Before Consuming Any External Libraries Runtime

Scope: applies to `src/audit/**`, `src/hub/**`, `src/observability/**`.

These rules are ALWAYS ACTIVE for all subsystem modules, storage adapters, audit generators, and gateway handlers interacting with persistent entity state, and internal cross-module interfaces sharing data transfer structures derived from persistent records.

### Rules

- **R-PR-001** MUST: Before consuming any external libraries or runtime validation dependencies associated with shared type contracts, consumers MUST inspect the repository lock artifact to resolve and adhere to the exact locked dependency version.
- **R-PR-002** MUST: Discover the designated persistence types module within the repository and ensure all new domain adapters import shared entity interfaces directly from this contract module.
- **R-PR-003** MUST: Ensure boundary handlers validate all incoming external payloads against schemas reflecting the persistence type definitions prior to domain processing.

### Verify

```bash
# Discover and run the project type checking script to verify cross-module persistence imports
# Discover and execute the module boundary verification script to ensure no circular dependencies
# Discover and run the repository test suite to confirm storage adapters and handlers pass validation against centralized entity schemas
```

**Accept when:**
- All subsystem modules import shared persistence entities from the centralized persistence types module without compiler diagnostics.
- Zero circular dependencies are detected between persistence modules and dependent domain services.
- All boundary adapters and operations handlers pass contract verification tests against the centralized schemas.

<enforcement>
Claude Code MUST NOT skip or defer verification. Pull requests introducing duplicate persistence type definitions or circular dependencies must be blocked from merging.
</enforcement>