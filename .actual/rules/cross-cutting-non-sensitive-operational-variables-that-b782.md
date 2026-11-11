---
version: 2
name: cross-cutting-non-sensitive-operational-variables-that-b782
description: "google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Non Sensitive Operational Variables That Govern"
metadata:
  actual:
    adr_id: b782fba5-902f-409a-96c2-40c069c1cd45
    status: accepted
    candidate_group_id: 64553d8f-35f8-4197-a3c1-189a3f1e5b88
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Non Sensitive Operational Variables That Govern

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for containerized cloud service resource definitions and infrastructure configuration modules managing environment variable injection.

### Rules

- **R-GCR-001** MUST: Non-sensitive operational variables that govern runtime behavior and public routing MUST remain separated into standard environment value blocks.

### Verify

```bash
# Discover and execute repository infrastructure validation scripts to verify container environment declarations conform to secret reference standards
# Run repository configuration policy checker to confirm no plaintext credentials or sensitive keys exist in environment variable definitions
```

**Accept when:**
- Infrastructure validation succeeds with all sensitive environment variables configured via managed secret key references.
- No plaintext secrets or authentication tokens are detected in static container environment definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated infrastructure policy linting and static analysis within continuous integration pipelines enforce these requirements, and pull requests containing direct credential values in environment variable declarations are rejected.
</enforcement>