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

> Updated 2026-03-16. Revised after AUTH-01 review and decision to skip
> workspace model for initial demo. See `.specs/deployment/auth-01-review.md`.

### 12.1 Design decision: no workspaces for now

The v1 conditions doc describes workspaces as the tenancy/billing boundary. The
`chatgpt-data-model.md` raw material specced out workspace tables, memberships,
and roles. AUTH-01 implemented those tables prematurely — nothing populates them,
nothing reads them, and the RLS rewrite that depended on them broke 33 tests.

**Decision**: Workspaces are deferred. The immediate goal is per-user isolation:
each user signs in, gets a token, connects to the MCP server, and their data is
scoped by `project` (the existing MCP scoping mechanism). The web app's
`/w/[workspaceSlug]` route stays as-is but is cosmetic — it does not resolve to
a real workspace row in the database. Workspace tables remain as inert scaffolding.

This is sufficient for the demo target: Vatsal and Kindred can sign up, get a
connection token, and use Thoughtbox via their MCP client.

### 12.2 Three systems, current state

| System | What works | What's broken or missing |
|---|---|---|
| **Next.js web app** | Marketing pages complete. Auth flows (sign-in/up/reset) wired to Supabase and functional. Workspace UI shells rendered with hardcoded/empty data. | No connection to MCP server data. No token generation page. Sign-in hardcoded to redirect to `/w/demo/dashboard`. |
| **Thoughtbox MCP server** | Deployed on Cloud Run (`thoughtbox-mcp`). Validates OAuth tokens via JWKS (ES256). Per-session Supabase storage isolation. Captures sessions/thoughts to Supabase. FS mode works locally without auth. | RLS on product tables broken (see below). `SUPABASE_JWT_SECRET` on Cloud Run is the JWKS key ID, not the HS256 signing secret (latent bug, not hit in practice because per-session storage always provides `userToken`). |
| **Supabase** (`akjccuoncxlvrrtkvtno`) | Auth active (email/password, PKCE callback). Product tables exist (sessions, thoughts, entities, relations, observations). Workspace/membership tables exist (empty, inert). | `project_isolation` RLS policies were replaced by membership-based policies that require workspace rows. Since nothing populates workspaces/memberships, authenticated users can't read/write product data. OAuth 2.1 Server enablement not confirmed (AUTH-01 H1 was INCONCLUSIVE). |

### 12.3 RLS status

**Problem**: AUTH-01 migration `20260313100000` dropped `project_isolation` policies
(which checked a `project` claim in the JWT) and replaced them with `user_project_access`
policies (which check `workspace_memberships` via `auth.uid()`). Since nothing creates
workspace/membership rows, all data access fails for authenticated users.

**Fix needed**: Revert product table RLS to `project_isolation`. The MCP server's
`SupabaseStorage.refreshClient()` already mints custom JWTs with a `project` claim
for its Supabase client. OAuth validates the user at the HTTP layer; the storage
layer talks to Supabase with a project-scoped JWT. Two separate concerns.

This is a migration in the `thoughtbox-staging` repo. Does not affect the web app.

### 12.4 Demo-critical path

Goal: Vatsal and Kindred can sign up on the web app, get an MCP connection config,
and use Thoughtbox from their MCP client (e.g., Claude Code).

```
Step 1 — Fix RLS (thoughtbox-staging)
│   Write migration restoring project_isolation on product tables.
│   Keeps workspace/membership tables untouched (inert).
│   Unblocks MCP server writing data to Supabase.
│   Unblocks 33 integration tests.
│
Step 2 — Verify hosted services (both repos)
│   Confirm MCP server on Cloud Run accepts requests with valid token.
│   Confirm web app sign-in/sign-up works against hosted Supabase.
│   Confirm Supabase product tables are accessible with project_isolation restored.
│
Step 3 — Build connect page (thoughtbox-webpage-2026)
│   New page: `/connect` (or `/w/demo/connect`)
│   Shows the signed-in user's current Supabase access token.
│   Displays a copy-paste MCP config snippet:
│     {
│       "thoughtbox": {
│         "type": "http",
│         "url": "https://thoughtbox-mcp-....run.app/mcp?token=<TOKEN>"
│       }
│     }
│   Token comes from the user's active Supabase session (already managed
│   by @supabase/ssr middleware — session refresh handles expiry).
│   User refreshes the page if token expires → gets a fresh one.
│
Step 4 — Deploy (both repos)
    Push MCP server with RLS fix to Cloud Run.
    Push web app with connect page to Cloud Run.
    Vatsal and Kindred sign up, visit /connect, copy config, use Thoughtbox.
```

No dependency on workspaces, API keys, billing, usage, or trace explorer.
No changes to MCP server auth — it already accepts `?token=` with Supabase tokens.

### 12.5 Future work (not demo-critical)

These items remain from the original v1 conditions doc. They are ordered by
dependency but none are needed for the immediate demo.

| Item | What it is | Depends on |
|---|---|---|
| Workspace data model (ADR-DATA-02) | Decide what a workspace actually is and when to introduce it | Product decision |
| Workspace auto-provisioning | Create workspace + membership on sign-up | Data model decision |
| Workspace resolution in web app | Replace hardcoded `/w/demo` with real lookup | Auto-provisioning |
| Wire dashboard to Supabase data | Dashboard, projects, runs pages query real data | Workspace resolution |
| API key model (ADR-AUTH-02) | api_keys table, hashed storage, issuance UI | Data model decision |
| API key auth on MCP server | MCP server accepts API keys as auth alternative | API key model |
| Run detail / trace explorer | Open a session, see thoughts in timeline | Dashboard wiring |
| Stripe billing (ADR-BILL-01) | Payment flow, subscription sync, plan enforcement | Workspace model |
| Usage metering | Track and display per-user/workspace usage | API key auth |
| RLS migration to membership model | Rewrite product table RLS to use workspace membership | Workspace model + populated data |
| Team member invitations | Invite users to workspaces | Workspace model |
| Account/workspace settings | Enable disabled form fields | Workspace resolution |
| Account/workspace deletion | Danger zone actions | Workspace resolution |
| Docs content pages | Core concepts, API reference, guides (stubs) | No dependency |
| Deep health checks | Supabase/Redis connectivity in `/health` | No dependency |
| Redis ISR cache handler | Multi-instance cache coherence | No dependency |
