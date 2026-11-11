---
version: 2
name: cross-cutting-consumer-inspect-repository-lock-resolut-e97f
description: "google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Consumer Inspect Repository Lock Resolution Artifact"
metadata:
  actual:
    adr_id: e97f98d3-41ce-4a08-a5ef-9eb8a131e3fb
    status: accepted
    candidate_group_id: 64553d8f-35f8-4197-a3c1-189a3f1e5b88
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Consumer Inspect Repository Lock Resolution Artifact

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for containerized cloud service resource definitions and infrastructure configuration modules requiring external API keys, authentication tokens, or storage credentials.

### Rules

- **R-SEC-001** MUST: The consumer MUST inspect the repository lock or resolution artifact to determine the exact resolved dependency version prior to applying or modifying container service declarations.

### Verify

```bash
# Discover and execute repository infrastructure validation scripts
# Run repository configuration policy checker
```

**Accept when:**
- Infrastructure validation succeeds with all sensitive environment variables configured via managed secret key references.
- No plaintext secrets or authentication tokens are detected in static container environment definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated infrastructure policy linting, static analysis, and peer code review enforce these requirements.
</enforcement>