---
version: 2
name: cross-cutting-engineers-discover-project-dependency-ma-2024
description: "Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Engineers Discover Project Dependency Manifest Inspect"
metadata:
  actual:
    adr_id: 202446e7-2f22-4702-a0e0-97981b2dea65
    status: accepted
    candidate_group_id: 41eb9913-8fa1-452a-8799-65e21c795446
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Engineers Discover Project Dependency Manifest Inspect

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPABASE-001** MUST: Engineers MUST discover the project dependency manifest and inspect the authoritative lock artifact to verify the exact resolved version of @supabase/supabase-js before implementing or modifying datastore client interactions.

### Verify

```bash
# Discover and run the project test verification script defined in repository configuration
# Discover and execute project static analysis and linting scripts to verify datastore client instantiation patterns
```

**Accept when:**
- Project verification test suite passes with zero errors.
- Static analysis confirms all primary datastore client initializations explicitly set session persistence and auto-refresh to false.
- No client instances persist authentication state across request lifecycles.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>