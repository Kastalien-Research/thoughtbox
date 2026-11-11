---
version: 2
name: cross-cutting-when-integrating-external-versioned-runt-3334
description: "Adoption of the broker-proxy Module for Peer Notebook Mediation: When Integrating External Versioned Runtime Dependencies"
metadata:
  actual:
    adr_id: 33349c8d-b488-45f6-9223-ac1094c96e6b
    status: accepted
    candidate_group_id: 98235467-e9d2-476e-81fb-f5552d2809eb
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of the broker-proxy Module for Peer Notebook Mediation: When Integrating External Versioned Runtime Dependencies

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for peer notebook runtime provider implementations, proxy target dispatch modules, and broker communication and coordination services.

### Rules

- **R-BP-001** MUST: When integrating external or versioned runtime dependencies supporting the broker proxy, consumers MUST discover the repository dependency manifest and inspect the authoritative resolution lock artifact to verify exact versions before implementation.

### Verify

```bash
# Discover and run project static analysis and linting scripts to verify broker-proxy boundary constraints
# Discover and execute repository unit and integration test suite to validate broker-proxy dispatch and mediation behavior
# Discover and run architecture boundary checker script to detect unauthorized direct dependencies between runtime providers and proxy targets
```

**Accept when:**
- Static analysis confirms zero direct coupling between runtime providers and proxy targets outside the broker-proxy interface.
- All unit and integration tests for broker dispatch and proxy target resolution complete without errors.
- Repository test and build suites succeed under clean execution.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>