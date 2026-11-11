---
version: 2
name: cross-cutting-broker-coordination-modules-proxy-compon-8820
description: "Internal Repositories Module Interface Adoption: Broker Coordination Modules Proxy Components Not"
metadata:
  actual:
    adr_id: 88208e18-ac4a-49bd-a0dd-730fa09ef6be
    status: accepted
    candidate_group_id: 22f497ff-d640-47c0-85aa-09cd403c0993
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Internal Repositories Module Interface Adoption: Broker Coordination Modules Proxy Components Not

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for subsystem components performing data storage, peer lookup, broker dispatch, proxy routing, and implementations of data persistence adapters and storage client wrappers.

### Rules

- **R-BRK-001** MUST_NOT: Broker coordination modules and proxy components MUST NOT import concrete database client libraries or manage external storage connection credentials directly.

### Verify

```bash
# Discover and run the project type-checking script from the repository configuration to ensure all repository consumers and implementations adhere strictly to the shared module contract.
# Discover and execute the project automated test runner to validate contract compliance across all repository adapter implementations.
# Inspect dependency manifests and imports to verify no forbidden direct database client imports exist within broker orchestration components.
```

**Accept when:**
- The project type-checking validation completes with zero type errors across repository consumers and adapter implementations.
- All unit and contract tests verifying repository operations pass without failure.
- Architecture boundary verification confirms broker and proxy components access storage exclusively via the internal repositories module.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>