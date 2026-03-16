# Thoughtbox Web App — Codebase Specification

> Generated: 2026-03-15  
> Scope: `thoughtbox-webpage-2026` — the unified Next.js marketing + product dashboard.

---

## 1. Project Overview

A single Next.js 15 application that serves two distinct surfaces:

| Surface | URL prefix | Purpose |
|---|---|---|
| **Public marketing site** | `/`, `/pricing`, `/docs`, `/support`, `/terms`, `/privacy` | Pre-auth acquisition funnel |
| **Authenticated app** | `/w/[workspaceSlug]/*` | Post-auth product dashboard |
| **Auth flows** | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | Supabase-backed identity |
| **Platform** | `/health`, `/api/auth/callback` | Infrastructure endpoints |

The app is deployed to **Google Cloud Run** via Docker using Next.js `output: 'standalone'`. Auth is handled by **Supabase** (`@supabase/ssr`). Redis is provisioned for ISR cache in multi-instance deployments but is not yet actively used by application code.

---

## 2. Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js App Router | `^15.2.0` |
| Language | TypeScript | `^5.8.2` |
| Runtime | Node.js | `22` |
| Styling | Tailwind CSS | `^3.4.17` |
| Fonts | Inter + JetBrains Mono via `next/font` | — |
| Auth | Supabase (`@supabase/ssr`) | `^0.9.0` |
| Supabase JS client | `@supabase/supabase-js` | `^2.99.1` |
| Testing | Vitest | `^4.1.0` (installed, no tests written yet) |
| Deployment | Cloud Run (`output: 'standalone'`) | — |

---

## 3. Directory Structure

```
thoughtbox-webpage-2026/
├── .env.example                  # Required env vars template
├── .gitignore
├── .dockerignore
├── .specs/
│   ├── codebase-spec.md              # This document
│   └── deployment/               # Deployment specs (Cloud Run, Supabase schema, v1 initiative, Vercel)
├── Dockerfile                    # Cloud Run production image
├── next.config.ts                # standalone output, poweredByHeader off
├── tailwind.config.ts            # brand colour palette, font variables
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── middleware.ts                 # Supabase session refresh + route guards
└── src/
    ├── app/
    │   ├── layout.tsx            # Root layout — fonts, metadata, viewport
    │   ├── globals.css           # Tailwind directives, CSS vars, focus ring
    │   ├── error.tsx             # Segment-level error boundary
    │   ├── global-error.tsx      # Root-level error boundary
    │   ├── not-found.tsx         # 404 page
    │   ├── actions.ts            # Global server action: signOut
    │   ├── health/
    │   │   └── route.ts          # GET /health — Cloud Run liveness check
    │   ├── api/
    │   │   └── auth/
    │   │       └── callback/
    │   │           └── route.ts  # GET /api/auth/callback — Supabase PKCE exchange
    │   ├── app/
    │   │   └── page.tsx          # /app — redirects to /w/demo/dashboard
    │   ├── (public)/             # Route group — wraps public marketing pages
    │   │   ├── layout.tsx        # PublicNav + PublicFooter wrapper
    │   │   ├── page.tsx          # / — homepage (hero, code preview, features, CTA)
    │   │   ├── pricing/
    │   │   │   └── page.tsx      # /pricing — Free / Pro / Enterprise plan cards
    │   │   ├── docs/
    │   │   │   ├── page.tsx      # /docs — documentation index
    │   │   │   └── quickstart/
    │   │   │       └── page.tsx  # /docs/quickstart — public quickstart guide
    │   │   ├── support/
    │   │   │   └── page.tsx      # /support
    │   │   ├── terms/
    │   │   │   └── page.tsx      # /terms
    │   │   └── privacy/
    │   │       └── page.tsx      # /privacy
    │   ├── (auth)/               # Route group — wraps auth identity pages
    │   │   ├── layout.tsx        # Minimal header + centered card + links to terms/privacy
    │   │   ├── actions.ts        # Server actions: signIn, signUp, forgotPassword, resetPassword
    │   │   ├── sign-in/
    │   │   │   ├── page.tsx      # /sign-in — card shell
    │   │   │   └── SignInForm.tsx # 'use client' — useActionState form
    │   │   ├── sign-up/
    │   │   │   ├── page.tsx
    │   │   │   └── SignUpForm.tsx
    │   │   ├── forgot-password/
    │   │   │   ├── page.tsx
    │   │   │   └── ForgotPasswordForm.tsx
    │   │   └── reset-password/
    │   │       ├── page.tsx
    │   │       └── ResetPasswordForm.tsx
    │   └── w/
    │       └── [workspaceSlug]/  # Dynamic workspace segment
    │           ├── layout.tsx    # WorkspaceSidebar + WorkspaceTopBar shell
    │           ├── dashboard/
    │           │   └── page.tsx  # Stats grid + quick actions + recent runs placeholder
    │           ├── projects/
    │           │   └── page.tsx  # Empty state (projects created via MCP)
    │           ├── runs/
    │           │   └── page.tsx  # Table with placeholder mock data (WS-04/05 pending)
    │           ├── api-keys/
    │           │   └── page.tsx  # Empty table + info banner (ADR-AUTH-02 pending)
    │           ├── usage/
    │           │   └── page.tsx  # Usage meters — Free plan, all zeros (WS-06 pending)
    │           ├── billing/
    │           │   └── page.tsx  # Plan comparison + disabled Stripe CTA (ADR-BILL-01 pending)
    │           ├── settings/
    │           │   ├── account/
    │           │   │   └── page.tsx  # Profile / password / danger zone (all fields disabled)
    │           │   └── workspace/
    │           │       └── page.tsx  # Name, slug, members table, danger zone (all disabled)
    │           └── docs/
    │               └── quickstart/
    │                   └── page.tsx  # In-app quickstart (workspace-contextual links)
    ├── components/
    │   └── nav/
    │       ├── public-nav.tsx        # 'use client' — sticky nav, mobile hamburger
    │       ├── public-footer.tsx     # Server component — 3-column footer
    │       ├── workspace-sidebar.tsx # 'use client' — dark sidebar, active-link detection
    │       └── workspace-top-bar.tsx # 'use client' — derives page title from pathname, signOut
    └── lib/
        └── supabase/
            ├── server.ts   # createClient() for Server Components / Actions / Route Handlers
            └── client.ts   # createClient() for Client Components (browser)
```

---

## 4. Route Architecture

### 4.1 Route Groups

Route groups (`(public)` and `(auth)`) are parenthesised folders — they share a layout without adding a URL segment.

| Group | Layout file | What it adds |
|---|---|---|
| `(public)` | `PublicNav` + `PublicFooter` | Sticky frosted-glass nav with mobile menu; 3-column footer |
| `(auth)` | Minimal header (logo only) + centered main + terms/privacy footer | Centred card layout for identity pages |

### 4.2 Workspace Layout

`/w/[workspaceSlug]/*` uses a two-pane shell:

```
┌─────────────────────────────────────────────────┐
│  WorkspaceSidebar (220 px, bg-slate-900)        │
│  ├── Workspace header (slug avatar + name)      │
│  ├── Main nav: Dashboard · Projects · Runs ·    │
│  │   API Keys                                   │
│  ├── Account section: Usage · Billing ·         │
│  │   Settings                                   │
│  └── Bottom: Quickstart · Account link          │
├─────────────────────────────────────────────────┤
│  WorkspaceTopBar (h-14, bg-white)               │
│  ├── Page title (derived from pathname)         │
│  └── Help · workspace badge · Sign out          │
├─────────────────────────────────────────────────┤
│  <main> — page content (overflow-y-auto, p-6)  │
└─────────────────────────────────────────────────┘
```

The sidebar width is set via the CSS custom property `--sidebar-width: 220px` (defined in `globals.css`).

---

## 5. Authentication & Middleware

### 5.1 Middleware (`middleware.ts`)

Runs on the Edge for matched paths. Performs:

1. Creates a `@supabase/ssr` server client, forwarding/refreshing session cookies.
2. Calls `supabase.auth.getUser()` to get the current user.
3. **Protected paths** (`/w/*`, `/app`): redirects to `/sign-in` if no user.
4. **Auth-only pages** (`/sign-in`, `/sign-up`, `/forgot-password`): redirects to `/app` if already authenticated.

Matcher config: `['/w/:path*', '/app', '/sign-in', '/sign-up', '/forgot-password']`

`/reset-password` is intentionally **not** in the matcher — it must be reachable after clicking an email link, even with an in-progress session.

### 5.2 Auth Server Actions (`src/app/(auth)/actions.ts`)

All are `'use server'` and use the `AuthFormState` discriminated union type.

| Action | Supabase call | Success path |
|---|---|---|
| `signInAction` | `auth.signInWithPassword` | `redirect('/w/demo/dashboard')` |
| `signUpAction` | `auth.signUp` with `emailRedirectTo` | Returns `{ success: true }` (email confirmation flow) |
| `forgotPasswordAction` | `auth.resetPasswordForEmail` | Returns `{ success: true }` |
| `resetPasswordAction` | `auth.updateUser({ password })` | `redirect('/w/demo/dashboard')` |

Password validation in `resetPasswordAction`: min 12 chars, must match confirm field.

The `emailRedirectTo` and `resetPasswordForEmail.redirectTo` values are computed from `NEXT_PUBLIC_SITE_URL` → `VERCEL_URL` → `localhost:3000` fallback chain.

### 5.3 Global Sign-Out (`src/app/actions.ts`)

`signOut()` — calls `supabase.auth.signOut()` then redirects to `/sign-in`. Consumed via `<form action={signOut}>` in `WorkspaceTopBar`.

### 5.4 Auth Callback Route (`src/app/api/auth/callback/route.ts`)

`GET /api/auth/callback` — exchanges an OAuth/PKCE code for a session, then redirects to `next` param (default `/w/demo/dashboard`). On error, redirects to `/sign-in?error=auth_callback_error`.

### 5.5 Supabase Client Utilities (`src/lib/supabase/`)

| File | Export | Use context |
|---|---|---|
| `server.ts` | `async createClient()` | Server Components, Server Actions, Route Handlers — uses `cookies()` from `next/headers` |
| `client.ts` | `createClient()` | Client Components — uses `createBrowserClient` |

---

## 6. Components

All components live under `src/components/nav/`. No component library (shadcn, Radix, etc.) is used — all UI is hand-authored with Tailwind.

### `PublicNav` (`'use client'`)

- Sticky, `z-40`, `bg-white/80 backdrop-blur-md`.
- Desktop: logo + nav links (Pricing, Docs, Support) + Sign in / Get started CTAs.
- Mobile: hamburger that toggles a dropdown menu. `useState` for `menuOpen`.
- Active link detection via `usePathname()`.
- Inline SVG icons (close / hamburger).

### `PublicFooter` (Server Component)

- 3-column grid: Product (Pricing, Docs, Quickstart) · Company (Support) · Legal (Terms, Privacy).
- Copyright uses `new Date().getFullYear()`.

### `WorkspaceSidebar` (`'use client'`)

- Dark (`bg-slate-900`) fixed-width aside.
- Navigation sections: main nav, "Account" labelled section, bottom (Quickstart + Account link).
- Active state derived from `usePathname()` — matches exact path or prefix.
- All nav icons are inline SVGs defined as local function components within the file.
- Receives `workspaceSlug` prop to construct workspace-prefixed hrefs.

### `WorkspaceTopBar` (`'use client'`)

- `h-14` white header strip.
- Derives current page title from pathname via `ROUTE_TITLES` lookup map.
- Sign-out form using the `signOut` global server action.
- Workspace badge (slug display, capitalized).
- "Help" link to `/support`.

---

## 7. Page Implementation Status

### Public pages — all rendered, no dynamic data

| Route | Status |
|---|---|
| `/` | Complete — hero, code preview, 6-feature grid, CTA section |
| `/pricing` | Complete — 3 plan cards (Free / Pro / Enterprise) |
| `/docs` | Complete — index with 4 sections; non-quickstart links are `href="#"` stubs (disabled) |
| `/docs/quickstart` | Complete — 4-step guide with code blocks |
| `/support` | Stub page |
| `/terms` | Stub page |
| `/privacy` | Stub page |

### Auth pages — forms functional, wired to Supabase

| Route | Status |
|---|---|
| `/sign-in` | Functional — `useActionState` + `signInAction` |
| `/sign-up` | Functional — `useActionState` + `signUpAction` + confirmation message |
| `/forgot-password` | Functional — `useActionState` + `forgotPasswordAction` |
| `/reset-password` | Functional — `useActionState` + `resetPasswordAction` (12-char min) |

### Workspace pages — UI shells, all data hardcoded/empty

| Route | Status | Blocking ADR/WS |
|---|---|---|
| `/w/[slug]/dashboard` | UI complete — stats show `—`, runs section empty | WS-04, WS-05 |
| `/w/[slug]/projects` | Empty state — "New project" button disabled | ADR-AUTH-02 |
| `/w/[slug]/runs` | Table renders with **2 hardcoded mock rows** | WS-04, WS-05 |
| `/w/[slug]/api-keys` | Empty table, "Create key" disabled | ADR-AUTH-02 |
| `/w/[slug]/usage` | Meters rendered, all usage values are `0` | WS-06 |
| `/w/[slug]/billing` | Plan comparison rendered, Stripe button disabled | ADR-BILL-01 |
| `/w/[slug]/settings/account` | All form fields disabled | ADR-FE-02 |
| `/w/[slug]/settings/workspace` | All form fields disabled, 1 hardcoded member row | ADR-FE-02 |
| `/w/[slug]/docs/quickstart` | Complete — workspace-contextual links | — |

---

## 8. API / Route Handlers

| Handler | Method | Path | Purpose |
|---|---|---|---|
| `health/route.ts` | `GET` | `/health` | Cloud Run liveness — returns `{ status: "ok", timestamp }` |
| `api/auth/callback/route.ts` | `GET` | `/api/auth/callback` | PKCE/OAuth code exchange, redirects to `next` param |

---

## 9. Styling & Design System

### Tailwind Configuration (`tailwind.config.ts`)

- **Font families**: `sans` → `--font-inter` (Inter) · `mono` → `--font-mono` (JetBrains Mono)
- **Brand colour scale** (`brand.*`): Indigo-based, full 50–950 range.

  | Token | Hex |
  |---|---|
  | `brand-50` | `#eef2ff` |
  | `brand-500` | `#6366f1` |
  | `brand-600` | `#4f46e5` (primary CTA) |
  | `brand-700` | `#4338ca` (hover) |

- Content paths: `src/pages`, `src/components`, `src/app`.
- No Tailwind plugins.

### Global CSS (`globals.css`)

- `--sidebar-width: 220px` CSS variable.
- `html { antialiased }` · `body { bg-white text-slate-900 }`.
- `:focus-visible { outline-2 outline-offset-2 outline-brand-500 }` — global focus ring.
- `.prose-code pre` / `.prose-code code` — utility classes for docs code blocks.

### Root Layout (`src/app/layout.tsx`)

- Applies font CSS variables to `<html>`.
- `metadataBase: https://thoughtbox.dev`.
- `themeColor: #4f46e5`.
- Title template: `%s | Thoughtbox`.
- OpenGraph and Twitter card metadata set.

---

## 10. Environment Variables

Defined in `.env.example`; committed values excluded.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key for browser + SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | For privileged operations (not yet used in app code) |
| `REDIS_URL` | Yes (prod) | Next.js ISR cache handler in Cloud Run multi-instance setup |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Used to construct auth redirect URLs; falls back to `VERCEL_URL` → `localhost:3000`. **Not in `.env.example`** — add manually. |
| `NODE_ENV` | Auto | `development` locally; Cloud Run injects `production` |
| `PORT` | Cloud Run injects | Cloud Run sets to `8080`; override locally if needed |

---

## 11. Build & Deployment

### Next.js Config (`next.config.ts`)

- `output: 'standalone'` — minimal Docker image.
- `poweredByHeader: false` — suppresses `X-Powered-By`.
- `images.remotePatterns: []` — no external image domains yet.

### Dockerfile

- Multi-stage: `deps` → `builder` → `runner`.
- Production image runs `node server.js` on port `8080` (standalone output is copied to `/app`; `package.json` `start` script uses the equivalent `node .next/standalone/server.js` for local use).
- `npm run start` (in `package.json`) also runs the standalone server.

### Scripts

| Script | Command |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `node .next/standalone/server.js` |
| `lint` | `next lint` |

---

## 12. Integration Status — Web App + MCP Server + Supabase

> Updated 2026-03-16 after AUTH-01 review. See `.specs/deployment/auth-01-review.md`.

### 12.1 Three systems, not yet connected

The web app, MCP server, and Supabase share one Supabase project for auth and data, but do not yet function as a unified product.

| System | What it does now | What's missing |
|---|---|---|
| **Next.js web app** | Marketing pages, auth flows (sign-in/up/reset), workspace UI shells with hardcoded/empty data | No Supabase queries in workspace pages, no workspace resolution, no connection to MCP data |
| **Thoughtbox MCP server** | Captures sessions/thoughts to Supabase, validates OAuth tokens via JWKS, per-session storage isolation | No workspace concept, scopes by `project` text string, no API key validation |
| **Supabase** | Auth (email/password, PKCE callback), product tables (sessions, thoughts, entities, relations, observations), workspace/membership tables (empty) | RLS broken (project_isolation replaced with membership-based policies, nothing populates memberships), OAuth 2.1 Server not confirmed enabled |

### 12.2 What must be true for these systems to work together

Mapped against the 6 irreducible priorities from the conditions doc (§20):

| # | Condition | Current state | What's needed |
|---|---|---|---|
| 1 | Stranger can sign up and get a key | Sign-up works. No key issuance. | API key model (ADR-AUTH-02), key creation UI, key-to-workspace binding |
| 2 | First request succeeds | MCP server works via direct URL + token. No self-service path. | API key auth on MCP server, quickstart that works against hosted service |
| 3 | Run is captured and viewable | MCP server writes sessions/thoughts to Supabase. Web app can't read them. | Workspace resolution, Supabase queries in dashboard/runs pages |
| 4 | Ledger/trace answers "what happened?" | Thought data exists in Supabase. No explorer UI. | Run detail page with thought timeline, session-to-workspace binding |
| 5 | Free vs paid exists | Pricing page rendered. No enforcement, no Stripe. | Stripe integration (ADR-BILL-01), plan enforcement |
| 6 | Operator can revoke keys, inspect failures | Nothing. | Admin tooling or Supabase Studio workflows, key revocation |

### 12.3 Dependency graph

Work items ordered by what must exist before the next thing can start. Items at the same level can be done in parallel.

```
Level 0 — Foundations (no dependencies, do first)
├── [A] Fix RLS: revert product table policies to project_isolation
│       Restores 33 broken integration tests. Keeps workspace/membership
│       tables as inert scaffolding. Auth middleware unaffected.
│       Repo: thoughtbox-staging
│
├── [B] Decide the workspace data model
│       What is a workspace? How does it relate to projects? Is it 1:1
│       with users for v1, or truly multi-tenant? Does sign-up auto-create
│       a workspace + membership row? This is WS-02 scope, not AUTH-01.
│       Output: ADR-DATA-02 (RLS policy design per table)
│
└── [C] Confirm Supabase OAuth 2.1 Server is enabled
        AUTH-01 H1 was INCONCLUSIVE. Manual dashboard step.
        Required for MCP client OAuth flow.

Level 1 — Workspace plumbing (depends on B)
├── [D] Workspace auto-provisioning on sign-up
│       When a user signs up, create a workspace + membership row.
│       Trigger or server action. Makes `/w/[slug]` resolve to real data.
│       Repo: thoughtbox-webpage-2026 (sign-up action) + Supabase (trigger)
│
├── [E] Workspace resolution in web app
│       Replace hardcoded `/w/demo` redirect. After sign-in, look up user's
│       workspace(s) from Supabase, redirect to the real slug.
│       Repo: thoughtbox-webpage-2026
│
└── [F] RLS migration to workspace-membership model
        Once workspaces are populated, rewrite product table RLS from
        project_isolation to membership-based. Update integration tests.
        This is what AUTH-01 tried to do prematurely.
        Repo: thoughtbox-staging (migration + tests)

Level 2 — Data bridge (depends on D, E)
├── [G] Wire dashboard to Supabase data
│       Dashboard page queries sessions/thoughts for the user's workspace.
│       Projects page queries projects table. Runs page queries sessions.
│       Repo: thoughtbox-webpage-2026
│
├── [H] API key model + issuance UI (ADR-AUTH-02)
│       api_keys table, hashed storage, create/revoke in web app,
│       key-to-workspace binding. This is the critical path for Priority 1.
│       Repo: thoughtbox-staging (table + validation) + thoughtbox-webpage-2026 (UI)
│
└── [I] Session/thought display in run detail page
        Open a session, see thoughts in timeline order. This is Priority 4.
        Repo: thoughtbox-webpage-2026

Level 3 — API key auth on MCP server (depends on H)
└── [J] MCP server validates API keys
        Alternative auth path alongside OAuth. Key in Authorization header,
        server looks up key hash in Supabase, resolves workspace + project scope.
        This is what makes "get a key → make a request" work.
        Repo: thoughtbox-staging

Level 4 — Billing + usage (depends on D, J)
├── [K] Stripe integration (ADR-BILL-01)
│       Webhook handler, subscription sync, plan enforcement.
│       Repo: thoughtbox-webpage-2026 + Supabase
│
└── [L] Usage metering
        Track requests per workspace, display in usage page.
        Repo: thoughtbox-staging (metering) + thoughtbox-webpage-2026 (display)

Level 5 — Launch gates (depends on everything above)
└── [M] Stranger test, payment test, failure test, revocation test,
        retention test, supportability test (conditions doc §17)
```

### 12.4 What the web app needs, in order

This is the web app's share of the work above, sequenced so nothing starts before its dependencies exist.

| Order | Web app work item | Depends on | Pages affected |
|---|---|---|---|
| 1 | Workspace resolution (sign-in redirects to real workspace) | [D] auto-provisioning | `/app`, middleware, workspace layout |
| 2 | User identity in UI (email in top bar, sign-out) | [E] workspace resolution | `WorkspaceTopBar`, account settings |
| 3 | Dashboard wired to Supabase (session counts, recent activity) | [G] data bridge | `/w/[slug]/dashboard` |
| 4 | Projects page wired to Supabase | [G] data bridge | `/w/[slug]/projects` |
| 5 | Runs page wired to Supabase (session list with filters) | [G] data bridge | `/w/[slug]/runs` |
| 6 | Run detail page (thought timeline) | [I] session display | New page: `/w/[slug]/runs/[sessionId]` |
| 7 | API key creation + revocation UI | [H] API key model | `/w/[slug]/api-keys` |
| 8 | Billing page wired to Stripe | [K] Stripe integration | `/w/[slug]/billing` |
| 9 | Usage page wired to metering | [L] usage metering | `/w/[slug]/usage` |
| 10 | Workspace settings (name, members) | [D] auto-provisioning | `/w/[slug]/settings/workspace` |
| 11 | Account settings (profile, password, deletion) | [E] workspace resolution | `/w/[slug]/settings/account` |

### 12.5 Previously listed items (status update)

| Feature | Previous reference | Updated status |
|---|---|---|
| Auth session wired into workspace UI | ADR-FE-02 | Blocked on [D] workspace auto-provisioning |
| API key issuance & revocation | ADR-AUTH-02 | Blocked on [B] workspace data model decision |
| Real run + thought data | WS-04 / WS-05 | Blocked on [E] workspace resolution + [G] data bridge |
| Stripe billing integration | ADR-BILL-01 | Blocked on [D] + [H] |
| Live usage counters | WS-06 | Blocked on [J] API key auth + [L] metering |
| Deep health checks (Supabase/Redis) | WS-08 | Not on critical path |
| Vitest tests | — | Test suite exists as devDep, no tests written |
| Docs content pages | — | Core concepts, API reference, guides (all `href="#"` stubs) |
| `SUPABASE_SERVICE_ROLE_KEY` usage | — | Imported in env, not used by app code. Will be needed for [D] |
| Redis ISR cache handler | ADR-GCP-01 | Not on critical path |
| Team member invitations | — | Blocked on [D] + [F] |
| Account deletion | — | Blocked on [E] |
| Workspace deletion | — | Blocked on [D] |
