---
version: 2
name: cross-cutting-services-communicating-primary-datastore-fbef
description: "Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Services Communicating Primary Datastores Through Supabase"
metadata:
  actual:
    adr_id: fbefb3c1-6588-4c40-b6da-72caf9f35b03
    status: accepted
    candidate_group_id: 41eb9913-8fa1-452a-8799-65e21c795446
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Stateless Client Configuration for @supabase/supabase-js Primary Datastore Access: Services Communicating Primary Datastores Through Supabase

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for stateless service boundaries and edge runtime handlers requiring primary datastore access via @supabase/supabase-js and serverless background functions and request handlers executing in ephemeral runtime environments.

### Rules

- **R-SUPA-001** MUST: Services communicating with primary datastores through @supabase/supabase-js within stateless runtime environments MUST instantiate the datastore client using createClient with auth.persistSession configured to false and auth.autoRefreshToken configured to false.

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