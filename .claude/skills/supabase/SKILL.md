---
name: supabase
description: Manage Supabase local and hosted infrastructure. Migrations, schema diff, status, reset, push, and inspection. Wraps the Supabase CLI with project-specific context and gotcha avoidance.
argument-hint: <status|migrate|diff|push|pull|reset|inspect|link> [args]
user-invocable: true
allowed-tools: Bash, Read, Glob, Grep, Write
---

Manage Supabase: $ARGUMENTS

## Project Context

- **Linked project**: Thoughtbox (`akjccuoncxlvrrtkvtno`, West US Oregon)
- **Local DB URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Migrations dir**: `supabase/migrations/`
- **Config**: `supabase/config.toml`

## Commands

Parse the first word of $ARGUMENTS to determine the command:

### `status` — Show local and hosted state

1. Run `supabase status` for local container health
2. Run `supabase migration list` to show local vs remote migration drift
3. Report: which migrations are local-only, remote-only, or synced

### `migrate` — Create a new migration

Parse remaining arguments for the migration name.

1. Run `supabase migration new <name>` to create the file
2. Open the created file path for editing
3. Remind: after writing SQL, run `/supabase diff` to verify, then `/supabase push` to deploy

### `diff` — Diff local schema against migrations

1. Run `supabase db diff` to show schema changes not captured in migrations
2. If changes exist, offer to create a migration capturing them
3. If clean, report "Schema in sync with migrations"

### `push` — Push migrations to hosted project

1. Run `supabase migration list` to show what will be pushed
2. List the pending migrations and their filenames
3. **Ask for confirmation before proceeding** — this modifies the hosted database
4. Run `supabase db push` to apply
5. Run `supabase migration list` again to confirm sync

### `pull` — Pull remote schema to local migrations

1. Run `supabase db pull` to generate a migration from remote schema changes
2. Show the generated migration file
3. Remind: review the SQL before committing

### `reset` — Reset local database to migrations

1. Confirm the user wants to destroy local data
2. Run `supabase db reset` to drop and re-apply all migrations
3. Report success and migration count

### `inspect` — Inspect hosted database

Parse remaining arguments for the inspection type. Default to `db-stats`.

Available inspections:
- `db-stats` — Size, cache hit rates, WAL size
- `table-stats` — Table sizes and row counts
- `index-stats` — Index usage and bloat
- `outliers` — Slowest queries
- `locks` — Active locks
- `bloat` — Table and index bloat estimates
- `role-stats` — Role information

Run: `supabase inspect db <type> --linked`

### `link` — Link or re-link to hosted project

1. Run `supabase link --project-ref akjccuoncxlvrrtkvtno`
2. Run `supabase services` to verify version alignment
3. Report any version mismatches between local and remote

## Gotchas (learned from experience)

| Gotcha | Detail |
|--------|--------|
| PG version mismatch | CLI upgrades can change local PG version (e.g., 15→17). Old volumes fail with "incompatible data directory". Fix: `supabase stop --no-backup`, remove volume, `supabase start`. |
| `--linked` flag inconsistency | Some commands use `--linked` (e.g., `inspect db`), others don't support it (e.g., `db execute`, `status`). Check `--help` before assuming. |
| Migration ordering | Migrations sort lexicographically by filename. Use `YYYYMMDDHHMMSS_` prefix (supabase CLI does this automatically with `migration new`). |
| RLS policies | New tables have RLS enabled by default. Forgetting policies means zero rows returned, not errors. Always add policies in the same migration that creates the table. |
| `db push` is irreversible | There is no `db unpush`. Test migrations locally with `db reset` first. |
| Service role vs anon key | Admin operations (user management, bypassing RLS) require the service_role key, not the anon/publishable key. Never expose service_role client-side. |
| Local vs hosted auth | Local auth (GoTrue) has different rate limits and email config than hosted. Test auth flows against hosted before shipping. |

## Candidate Slash Commands

These are composable building blocks for workflows:

| Command | Purpose | Implementation |
|---------|---------|----------------|
| `/sb-status` | Quick health check | `supabase status && supabase migration list` |
| `/sb-new-migration` | Create + open migration | `supabase migration new <name>` then open file |
| `/sb-sync-check` | Drift detection | `supabase migration list` + diff analysis |
| `/sb-reset-local` | Clean slate local DB | `supabase db reset` with confirmation |
| `/sb-push` | Deploy migrations | `supabase db push` with pre-flight check |

## Candidate Hooks

These can be wired into `.claude/settings.json`:

| Event | Hook | Purpose |
|-------|------|---------|
| `PreToolUse:Bash` | Guard `supabase db push` | Require confirmation before pushing to hosted |
| `PostToolUse:Write` | Auto-lint on `supabase/migrations/*.sql` | Run `supabase db lint` after writing migration files |
| `SessionStart` | Migration drift check | Run `supabase migration list` on session start if supabase dir exists |
| `PreToolUse:Bash` | Block `supabase stop --no-backup` | Prevent accidental data loss without explicit intent |

## Workflow Compositions

### New feature with schema changes
```
/sb-status → /sb-new-migration → [write SQL] → /sb-reset-local → [test] → /sb-push
```

### Debug hosted schema issues
```
/supabase inspect db-stats → /supabase inspect outliers → /supabase inspect bloat
```

### Sync after pulling remote changes
```
git pull → /sb-sync-check → /sb-reset-local (if drifted) → [verify]
```

## Output

Always end with a one-line status summary:

```
Supabase: [local: running|stopped] [migrations: N local, N remote, N pending] [linked: yes|no]
```
