# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Thoughtbox web app — a unified Next.js 15 application serving both the public marketing site and the authenticated product dashboard. Thoughtbox gives AI agents persistent, queryable memory via MCP. This repo is the web frontend; the MCP server itself lives in a sibling repo.

Deployed to Vercel.

## Commands

```bash
pnpm install             # install dependencies
pnpm dev                 # dev server on localhost:3000
pnpm build               # production build
pnpm start               # run production server locally
pnpm lint                # eslint (next/core-web-vitals + next/typescript)
pnpm tsc --noEmit        # type check
pnpm vitest              # run tests
pnpm vitest run <file>   # run a single test file
```

## Stack

- **Next.js 15** (App Router, React 19, TypeScript, `strict: true`)
- **Tailwind CSS v3** with custom `brand` color scale (indigo-based, defined in `tailwind.config.ts`)
- **Supabase Auth** via `@supabase/ssr` — server client, browser client, and middleware session refresh
- **Fonts**: Inter (sans) + JetBrains Mono (mono) via `next/font`, exposed as CSS variables `--font-inter` / `--font-mono`
- **Vitest** for tests

## Architecture

### Route Groups and Layouts

Three route groups with distinct layouts, all under `src/app/`:

| Group | Layout | Purpose |
|-------|--------|---------|
| `(public)/` | `PublicNav` + `PublicFooter` | Marketing pages (`/`, `/pricing`, `/docs`, `/terms`, `/privacy`, `/support`) |
| `(auth)/` | Minimal centered card | Auth forms (`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`) |
| `w/[workspaceSlug]/` | `WorkspaceSidebar` + `WorkspaceTopBar` | Authenticated dashboard (`/dashboard`, `/projects`, `/runs`, `/api-keys`, `/usage`, `/billing`, `/settings/*`) |

### Auth Flow

- **Middleware** (`middleware.ts`): Creates a Supabase server client, calls `auth.getUser()`, redirects unauthenticated users from `/w/*` and `/app` to `/sign-in`, redirects authenticated users away from auth pages to `/app`.
- **Matcher**: Only runs on `/w/:path*`, `/app`, `/sign-in`, `/sign-up`, `/forgot-password`.
- **Server actions** (`src/app/(auth)/actions.ts`): `signInAction`, `signUpAction`, `forgotPasswordAction`, `resetPasswordAction` — all use `@supabase/ssr` server client.
- **OAuth callback** (`src/app/api/auth/callback/route.ts`): PKCE code exchange, redirects to `/w/demo/dashboard` by default.
- **Sign out** (`src/app/actions.ts`): Global `signOut` server action.

### Supabase Client Pattern

Two factory functions in `src/lib/supabase/`:
- `server.ts` — `createServerClient` using `cookies()` from `next/headers` (for Server Components and Server Actions)
- `client.ts` — `createBrowserClient` (for Client Components)

The middleware creates its own Supabase client inline to refresh sessions on every request.

### Key Conventions

- **Next.js 15 async params**: Dynamic route params are `Promise` — always `await params` before destructuring.
- **Server Components by default**: Only files with `'use client'` are Client Components. Auth forms use `useActionState` for progressive enhancement.
- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).
- **`/health`**: Route Handler at `src/app/health/route.ts` (not under `/api/`), returns `{ status: "ok" }` for uptime monitoring.
- **`/app`**: Redirect-only page that sends authenticated users to `/w/demo/dashboard`.

### Environment Variables

Copy `.env.example` to `.env.local`. Required:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only
- `REDIS_URL` — (optional) ISR cache handler for multi-instance deployments

### Product Shape

Single-tier product. The only plan is **Founding Beta** (`$17.29/mo`), defined in `src/lib/stripe/server.ts` as the sole entry in `PLAN_CONFIG`. There is no Free, Pro, or Team tier — anything in the codebase suggesting otherwise is phantom scaffolding and should be removed, not preserved. The `workspaces.plan_id` column still has a CHECK constraint that allows legacy values (`free`, `pro`, `enterprise`, `team`) for now; the UI ignores `plan_id` for display purposes and renders solely off `subscription_status`.

## Specs and Decision Records

- Deployment specs: `.specs/deployment/`
- Spec authority: `.specs/` with frontmatter claims; archived ADRs: `docs/decisions/archive/adr/`
- Code and spec updates belong in the same commit
