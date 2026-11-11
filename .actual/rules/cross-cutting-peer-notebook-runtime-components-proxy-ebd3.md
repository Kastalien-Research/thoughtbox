---
version: 2
name: cross-cutting-peer-notebook-runtime-components-proxy-ebd3
description: "Adoption of the broker-proxy Module for Peer Notebook Mediation: Peer Notebook Runtime Components Proxy Targets"
metadata:
  actual:
    adr_id: ebd32809-2f29-4499-a678-b98b007c4588
    status: accepted
    candidate_group_id: 98235467-e9d2-476e-81fb-f5552d2809eb
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of the broker-proxy Module for Peer Notebook Mediation: Peer Notebook Runtime Components Proxy Targets

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-BPR-001** MUST: All peer notebook runtime components, proxy targets, and broker services MUST mediate dispatch and invocation exclusively through the internal broker-proxy module interface.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated CI and code review.
</enforcement>