---
version: 2
name: cross-cutting-runtime-providers-proxy-targets-not-fee1
description: "Adoption of the broker-proxy Module for Peer Notebook Mediation: Runtime Providers Proxy Targets Not Bypass"
metadata:
  actual:
    adr_id: fee19a83-1e85-47cf-821a-da5858c62431
    status: accepted
    candidate_group_id: 98235467-e9d2-476e-81fb-f5552d2809eb
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of the broker-proxy Module for Peer Notebook Mediation: Runtime Providers Proxy Targets Not Bypass

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-BRK-001** MUST_NOT: Runtime providers and proxy targets MUST NOT bypass the broker-proxy boundary to establish direct coupled communication channels between each other.

### Verify

```bash
# Discover and run the project static analysis and linting scripts to verify that module imports adhere to broker-proxy boundary constraints.
# Discover and execute the repository unit and integration test suite to validate broker-proxy dispatch and mediation behavior.
# Discover and run the architecture boundary checker script to detect unauthorized direct dependencies between runtime providers and proxy targets.
```

**Accept when:**
- Static analysis confirms zero direct coupling between runtime providers and proxy targets outside the broker-proxy interface.
- All unit and integration tests for broker dispatch and proxy target resolution complete without errors.
- Repository test and build suites succeed under clean execution.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>