# Auth and Billing

## User Signup

Supabase Auth handles user accounts. When a new user signs up, the `handle_new_user()` database trigger fires and:

1. Creates a `profiles` row (display name derived from email)
2. Creates a `workspaces` row (name: `<username>'s Workspace`, slug: `<username>-<4hex>`, plan: `free`)
3. Creates a `workspace_memberships` row (role: `owner`)
4. Sets the new workspace as the user's `default_workspace_id` on their profile

This is atomic — signup either creates everything or nothing.

## API Key Authentication

MCP clients authenticate with API keys. The format is:

```
tbx_<prefix>_<secret>
```

Example: `tbx_a1b2c3d4_xK9mP2...rest_of_key`

### Auth flow (per request)

```
Client sends: Authorization: Bearer tbx_a1b2c3d4_xK9m...
                              — or —
              POST /mcp?key=tbx_a1b2c3d4_xK9m...

Server:
  1. Extract prefix ("a1b2c3d4")
  2. Query api_keys table: SELECT workspace_id, key_hash, status WHERE prefix = ?
  3. Check status == 'active'
  4. bcrypt.compare(provided_key, key_hash)
  5. Return workspace_id
  6. All storage operations scoped to that workspace_id
```

Implemented in `src/auth/api-key.ts`. The query runs with `service_role` to bypass RLS.

### Key types

| Key | When | Resolves to |
|-----|------|-------------|
| `tbx_*` prefixed | Production | Workspace ID from `api_keys` table |
| Static `THOUGHTBOX_API_KEY` env var match | Legacy/admin | `'default-workspace'` |
| `THOUGHTBOX_API_KEY_LOCAL` env var match | Local dev | `'local-dev-workspace'` |
| No key provided + storage is `supabase` | Hosted | 401 rejected |
| No key provided + storage is `fs` | Local | Allowed (no workspace scoping) |

### Key management

API keys are stored in the `api_keys` table:
- `prefix` for fast lookup (indexed)
- `key_hash` for bcrypt verification (the raw key is never stored)
- `status` for revocation without deletion
- `expires_at` for time-limited keys
- `last_used_at` for activity tracking

Keys are created through the web app and scoped to a workspace. Any workspace member can create keys; keys inherit the workspace's access scope.

## Workspace Roles

| Role | Can do |
|------|--------|
| `owner` | Everything — update workspace, delete workspace, manage members |
| `admin` | Update workspace settings, manage members |
| `member` | Use the workspace (create sessions, thoughts, knowledge) |

Enforced by RLS policies. The `workspaces_update_admin` policy allows UPDATE only for `owner` and `admin` roles. The `workspaces_delete_owner` policy allows DELETE only for the owner.

## Billing (Stripe)

Workspace-level billing via Stripe. The `workspaces` table has:

- `plan_id`: `free` / `pro` / `enterprise`
- `subscription_status`: `active` / `inactive` / `past_due` / `canceled`
- `stripe_customer_id`: Set when the Stripe customer is created
- `stripe_subscription_id`: Set when a subscription starts

New workspaces default to `plan_id: 'free'`, `subscription_status: 'inactive'`.

The Stripe webhook handler (in the web app) updates these fields when subscription events occur. The MCP server reads `plan_id` to determine feature access and rate limits.
