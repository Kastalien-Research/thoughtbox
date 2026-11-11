---
version: 2
name: cross-cutting-dynamic-secret-bindings-across-container-ad62
description: "google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Dynamic Secret Bindings Across Container Environment"
metadata:
  actual:
    adr_id: ad62ea88-bbbd-44ec-a909-4c14208dd844
    status: accepted
    candidate_group_id: 64553d8f-35f8-4197-a3c1-189a3f1e5b88
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Dynamic Secret Bindings Across Container Environment

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-GCR-001** SHOULD: Dynamic secret bindings across container environment entries SHOULD iterate over structured mappings of environment keys to managed secret identifiers to maintain configuration consistency.

### Verify

```bash
# Discover and execute the repository infrastructure validation scripts to verify that container environment declarations conform to secret reference standards.
# Run the repository configuration policy checker to confirm that no plaintext credentials or sensitive keys exist in environment variable definitions.
```

**Accept when:**
- Infrastructure validation succeeds with all sensitive environment variables configured via managed secret key references.
- No plaintext secrets or authentication tokens are detected in static container environment definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>