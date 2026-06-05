# Observatory Reasoning Visualizer — Design Brief

> **Purpose**: This document is a complete context dump for generating a UI/UX design for the Thoughtbox Observatory reasoning visualizer. It describes what Thoughtbox is, what the web app looks like today, what the Observatory reference implementation contains, what the data model is, and what we want to build. The goal is a design that is native to our Next.js/React/Tailwind stack — not a port of vanilla JS.

---

## 1. What Thoughtbox Is

Thoughtbox is an MCP (Model Context Protocol) server that gives AI agents persistent, queryable memory. When an AI agent (e.g., Claude Code, Cursor, or any MCP client) connects to Thoughtbox, every reasoning step the agent takes is captured as a **thought** — a structured record of what the agent was thinking, deciding, observing, or doing at a given moment.

These thoughts form a **reasoning trace**: a linear chain that can branch (when the agent explores alternatives) and revise (when the agent corrects earlier reasoning). A single MCP session produces one reasoning trace. We call a completed session a **run**.

The product's core value proposition: you can go back and see exactly how an AI agent arrived at its conclusions. Not just the final output, but the entire reasoning process — branches explored, decisions made, assumptions formed and updated, actions taken.

## 2. The Web App Today

The web app is a Next.js 15 application (App Router, React 19, TypeScript, Tailwind CSS v3) deployed to Google Cloud Run. It serves both a public marketing site and an authenticated product dashboard.

### Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router |
| UI | React 19, Server Components by default, `'use client'` only where needed |
| Styling | Tailwind CSS v3 with custom `brand` color scale (indigo-based) |
| Fonts | Inter (sans) + JetBrains Mono (mono) via `next/font` |
| Auth | Supabase (`@supabase/ssr`) |
| Testing | Vitest |
| Package manager | pnpm |

### Design language

- **Light theme** by default. White backgrounds (`bg-white`), slate text (`text-slate-900`), slate borders (`border-slate-200`).
- **Dark sidebar** in the workspace: `bg-slate-900` with `text-white` and `text-slate-400` for inactive items.
- **Brand color**: Indigo scale (`brand-500: #6366f1`, `brand-600: #4f46e5` for primary CTAs, `brand-700: #4338ca` for hover).
- Cards use `rounded-xl border border-slate-200 bg-white shadow-sm`.
- Status badges use colored pill shapes: `bg-green-100 text-green-700` for success, `bg-red-100 text-red-700` for failure, `bg-blue-100 text-blue-700` for running.
- No component library (no shadcn, no Radix). All UI is hand-authored Tailwind.
- Sidebar width: 220px via CSS custom property `--sidebar-width`.

### Workspace layout

The authenticated dashboard lives at `/w/[workspaceSlug]/*` with a two-pane shell:

```
+-----------------------------------------------------+
| WorkspaceSidebar (220px, bg-slate-900)               |
|   Workspace header (slug avatar + name)              |
|   Main nav: Dashboard, Projects, Runs, API Keys     |
|   Account: Usage, Billing, Settings                  |
|   Bottom: Connect, Quickstart, Account link          |
+-----------------------------------------------------+
| WorkspaceTopBar (h-14, bg-white)                     |
|   Page title (derived from pathname)                 |
|   Help link, workspace badge, Sign out               |
+-----------------------------------------------------+
| <main> page content (overflow-y-auto, p-6)           |
+-----------------------------------------------------+
```

### Current Runs page (`/w/[slug]/runs`)

Today this page shows a simple table with 2 hardcoded mock rows. Columns: Run ID (monospace), Project, Status (colored badge), Thoughts (count), Started (timestamp), Duration. There's a disabled search input and a disabled status filter dropdown. This is a placeholder waiting for real data.

The table rows are not clickable — there is no run detail page yet.

### What does NOT exist yet

- `/w/[slug]/runs/[runId]` — no run detail route
- No thought visualization components
- No data fetching from the MCP server or Supabase for runs/thoughts
- No dark mode (the app is light-theme only, though the sidebar is dark)

## 3. The Observatory Reference Implementation

The observatory reference implementation was a standalone `observatory.html` file (2678 lines) that connected to a local Thoughtbox MCP server via WebSocket and visualized reasoning in real time. The legacy observatory server and UI have since been removed from the repo; the HTML is preserved in git history at `thoughtbox/src/observatory/ui/observatory.html` (prior to branch `chore/remove-legacy-observatory`). We are not porting this code — we are using it as design reference.

### What the observatory does visually

**GitHub dark theme**: Uses GitHub's dark mode design tokens throughout:
```
--color-canvas-default: #0d1117  (background)
--color-canvas-subtle:  #161b22  (surface)
--color-canvas-inset:   #010409  (recessed areas)
--color-border-default: #30363d
--color-fg-default:     #e6edf3  (primary text)
--color-fg-muted:       #8b949e  (secondary text)
--color-accent-fg:      #58a6ff  (links, action_report, progress)
--color-success-fg:     #3fb950  (success, main lane)
--color-danger-fg:      #f85149  (failure, errors)
--color-attention-fg:   #d29922  (warnings, assumption_update)
--color-done-fg:        #a371f7  (decision_frame, branch lanes)
--color-sponsors-fg:    #db61a2  (belief_snapshot)
```

**5-tab layout**: Sessions, Problems, Proposals, Activity, Digest. Only the **Sessions** tab is relevant to us.

#### Sessions view — the git-log commit list

The Sessions view is a vertical list of thoughts styled like `git log --graph`. It has two side-by-side columns:

1. **Left: SVG graph rail** — A narrow SVG column showing branch lanes as colored vertical lines with dots at each thought position. The main chain occupies lane 0 (green). Each branch gets its own lane (purple, blue, amber, pink, red — cycling through `laneColors`). Fork lines are bezier curves from the main lane to the branch lane at the point of divergence.

   Layout constants: `rowHeight: 48px`, `laneWidth: 20px`, `laneOffset: 30px`. Each thought gets a 4px radius colored dot. Vertical lane lines connect the first to last thought in each lane. Fork curves use cubic beziers: `M fromX,fromY C fromX+10,fromY+20 toX-10,toY-20 toX,toY`.

2. **Right: Commit rows** — Each thought is a `CommitRow` list item containing:
   - **Message**: First 120 chars of thought content (first line only), preceded by a branch label (`BranchName` pill) if on a branch, and a `TypeIndicator` pill if the thought has a non-reasoning `thoughtType`.
   - **Meta**: Short hash (first 7 chars of ID) + relative timestamp ("2m ago", "1h ago").
   - Clicking a row navigates to the commit detail view.

**Timestamp gap separators**: Between any two thoughts with >5 minutes gap, a `TimestampGap` element is inserted — a horizontal line with a centered label like "5m gap" or "1h 23m gap".

**Session selector**: Button row at the top for switching between sessions. Active session is highlighted.

#### Commit detail view

Clicking a commit row shows `renderCommitDetail()`:

- **Back button**: "Back to sessions"
- **Header**: "Thought #N" + branch label pill + type badge pill
- **Meta row**: Short hash + relative time + "Step N of M"
- **Structured card**: If the thought has a `thoughtType`, a type-specific card renders above the raw content (see below)
- **Raw content**: The thought text in a monospace code block
- **MCP metadata**: Collapsible `<details>` showing thoughtNumber, totalThoughts, nextThoughtNeeded, branchId, branchFromThought, thoughtType as formatted JSON

#### Structured thought type cards

`renderStructuredCard()` dispatches on `thought.thoughtType` to render type-specific cards. All cards share a `ThoughtCard` wrapper with a header (containing type badge + metadata badges) and a body:

**DecisionCard** (`decision_frame`):
- Header: Purple "Decision" type badge + confidence badge (high=green, medium=amber, low=red)
- Body: Options list — each option is a row with a circular indicator (checkmark if selected, empty if not), label text, and optional reason. Selected options have a green-tinted background.

**ActionCard** (`action_report`):
- Header: Blue "Action" badge + success/failure result badge (green checkmark or red X) + reversibility badge ("Reversible" / "Irreversible" / "Partially reversible" in a muted outline pill)
- Body: Metadata row showing tool name and target. Optional side effects list below.

**ProgressCard** (`progress`):
- Header: Blue "Progress" badge + status badge (Pending=gray, In Progress=blue, Done=green, Blocked=red)
- Body: Task description text + optional note in muted text.

**BeliefCard** (`belief_snapshot`):
- Header: Pink "Beliefs" badge
- Body: Entity list (name -> state pairs). Optional constraints line. Optional risks line in danger color.

**AssumptionCard** (`assumption_update`):
- Header: Amber "Assumption" badge
- Body: Assumption text, then a status transition display: `oldStatus -> newStatus` with color-coded status labels (believed=green, uncertain=amber, refuted=red). Optional trigger explanation. Optional downstream affected thoughts list.

**ContextCard** (`context_snapshot`):
- Header: Gray "Context" badge
- Body: Key-value grid showing model ID, system prompt hash, tools available, constraints, data sources accessed.

#### Badge and card CSS patterns

All badges share the same shape: `inline-flex, padding: 2px 8px, font-size: 11px, font-weight: 600, border-radius: 16px, uppercase`. Each type gets a distinct `background: rgba(color, 0.15)` with matching text color from the design tokens.

Cards use `ThoughtCard` with border-radius 8px, `border: 1px solid var(--color-border-default)`, subtle background. Header and body are separated by padding.

### What we take from it

- The **git-log layout**: Vertical list with SVG graph rail on the left showing branch lanes — this is the primary visualization pattern
- The **typed card system**: 6 distinct card renderers with consistent badge/pill styling — this is how we differentiate thought types
- The **timestamp gap separators**: Visual breaks in the timeline for significant pauses
- The **commit detail pattern**: Header with badges -> structured card -> raw content -> collapsible metadata
- The **color vocabulary per thought type**: Purple for decisions, blue for actions/progress, pink for beliefs, amber for assumptions, gray for context/reasoning
- The **branch lane colors**: Green for main, then cycling through purple, blue, amber, pink, red
- The **navigation pattern**: List view -> click to detail -> back to list

### What we do NOT take

- The WebSocket client and real-time streaming
- The Problems, Proposals, Activity, Digest tabs (Hub collaboration features)
- Agent avatars and role-colored pills (multi-agent features)
- The GitHub dark theme verbatim (we adapt to our Tailwind design system)
- The hash-based router (we use Next.js App Router)

## 4. The Data Model

From `thoughtbox/src/events/thought-schemas.ts` (Zod schemas; relocated from the removed `src/observatory/schemas/thought.ts`):

### Thought

```typescript
type Thought = {
  id: string                    // Unique identifier
  thoughtNumber: number         // Position in chain (1-indexed)
  totalThoughts: number         // Estimated total in session
  thought: string               // The actual content
  nextThoughtNeeded: boolean    // Whether more thoughts expected
  timestamp: string             // ISO 8601

  // Revision metadata (optional)
  isRevision?: boolean          // Revises a previous thought
  revisesThought?: number       // Which thought number it revises

  // Branch metadata (optional)
  branchId?: string             // Branch identifier
  branchFromThought?: number    // Origin thought number

  // Structured thought type (optional — absent for historical untyped thoughts)
  thoughtType?: 'reasoning' | 'decision_frame' | 'action_report'
    | 'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress'

  // Type-specific metadata (present when thoughtType is set)
  confidence?: 'high' | 'medium' | 'low'
  options?: { label: string; selected: boolean; reason?: string }[]
  actionResult?: {
    success: boolean
    reversible: 'yes' | 'no' | 'partial'
    tool: string
    target: string
    sideEffects?: string[]
  }
  beliefs?: {
    entities: { name: string; state: string }[]
    constraints?: string[]
    risks?: string[]
  }
  assumptionChange?: {
    text: string
    oldStatus: string
    newStatus: 'believed' | 'uncertain' | 'refuted'
    trigger?: string
    downstream?: number[]
  }
  contextData?: {
    toolsAvailable?: string[]
    systemPromptHash?: string
    modelId?: string
    constraints?: string[]
    dataSourcesAccessed?: string[]
  }
  progressData?: {
    task: string
    status: 'pending' | 'in_progress' | 'done' | 'blocked'
    note?: string
  }
}
```

### Session

```typescript
type Session = {
  id: string
  title?: string
  tags: string[]
  createdAt: string             // ISO 8601
  completedAt?: string          // ISO 8601
  status: 'active' | 'completed' | 'abandoned'
}
```

### Branch

```typescript
type Branch = {
  id: string
  name?: string
  fromThoughtNumber: number
  thoughts: Thought[]
}
```

### Thought types (already in the schema, optional)

The `thoughtType` discriminant is already implemented in the Zod schema (`thoughtbox/src/observatory/schemas/thought.ts`) as an optional field, added for backward compatibility with historical untyped thoughts:

| Type | What it represents | Visual treatment idea |
|------|-------------------|----------------------|
| `reasoning` | General reasoning step | Default card — just the thought text |
| `decision_frame` | Agent choosing between options | Options list with selected/unselected indicators, confidence badge |
| `action_report` | Agent took an action (tool call, file write, etc.) | Success/failure badge, reversibility indicator, tool/target metadata |
| `belief_snapshot` | Agent's current understanding of entities | Entity list (name -> state) with constraints/risks |
| `assumption_update` | Agent updating an assumption | Old status -> new status transition |
| `context_snapshot` | Agent's working context | Key-value grid (model, tools, constraints) |
| `progress` | Agent tracking task progress | Task + status badge + note |

All associated metadata fields (`confidence`, `options`, `actionResult`, `beliefs`, `assumptionChange`, `contextData`, `progressData`) are also already in the schema. The field is optional so thoughts without a type (historical data) remain valid. For the visualizer design, the task is type-specific card rendering, not waiting for the server to add type support. A flexible card that degrades gracefully when `thoughtType` is absent is still a valid approach for older thoughts.

## 5. Where This Lives in the App

**Route**: `/w/[workspaceSlug]/runs/[runId]`

This is a run detail page. The user navigates here by clicking a row in the runs table at `/w/[slug]/runs`. It shows the complete reasoning trace for a single MCP session.

### Information hierarchy

1. **Run header**: Run ID, project name, status badge, start time, duration, thought count
2. **Reasoning trace**: The main visualization — a chronological list of thoughts showing the reasoning process, with branch points visible
3. **Thought detail**: Clicking/selecting a thought shows its full content and metadata

### Key UX questions for the design

- **List vs. graph**: Should the primary view be a vertical list (git-log style, scrollable, dense) or a spatial graph (the observatory's approach)? The list is more natural for Next.js/React and works better with server components. The graph is more visually striking but requires client-side rendering.
- **Branch visualization**: How do we show branches in a list view? A left-side rail with SVG lane lines? Indentation? Collapsible sections?
- **Thought expansion**: Click-to-expand inline? Slide-out panel? Full page navigation?
- **Timestamp handling**: Show absolute times? Relative times? Gap indicators between thoughts that had significant pauses?
- **Dark vs. light**: The main app is light-themed. Should the reasoning trace use a dark theme (like the observatory) for visual contrast and to signal "this is agent output"? Or should it stay consistent with the rest of the app?
- **Responsive**: The sidebar is fixed at 220px. The content area needs to work in the remaining space. How does the thought list + detail work on smaller viewports?

## 6. Design Constraints

1. **Next.js App Router native**: Server Components for the page shell, data fetching, and static parts. Client Components only for interactive elements (thought selection, branch toggling, expand/collapse).
2. **Tailwind CSS**: All styling via Tailwind utility classes. Use our existing `brand` color scale and `slate` neutrals. Extend with new semantic colors if needed (e.g., thought-type colors), but define them in `tailwind.config.ts`.
3. **No heavy dependencies**: No D3, no Mermaid, no graph layout libraries. SVG for the branch rail is fine if kept simple. Prefer CSS/HTML layout over programmatic SVG positioning.
4. **Progressive disclosure**: The initial view should be scannable and fast. Detail loads on interaction. Don't render all thought content upfront.
5. **Accessible**: Keyboard navigable, proper heading hierarchy, screen-reader-friendly thought descriptions.
6. **Hand-authored components**: No component library. Match the existing app's visual language — `rounded-xl`, `shadow-sm`, `border-slate-200`, Inter font, JetBrains Mono for code/thought content.

## 7. What We Want From This Design

### Deliverables

1. **Component hierarchy**: What React components make up this page? How do they nest? Which are Server Components vs. Client Components?
2. **Layout design**: How is the page structured? What does the thought list look like? What does a single thought card look like? How does the detail view work?
3. **Branch visualization approach**: A concrete proposal for how branches appear in the list. This is the hardest design problem.
4. **Thought type cards**: Either specific card designs for each thought type, or a flexible card design that accommodates typed metadata gracefully.
5. **Interaction model**: What happens when you click a thought? How do you navigate branches? How do you go back to the runs list?
6. **Color and typography**: Specific Tailwind classes and color tokens for each element. Should be copy-pasteable into component code.
7. **Mobile/responsive behavior**: How does this work when the viewport is narrow?

### Non-goals

- Real-time streaming (the observatory does this via WebSocket; the web app will load completed runs from Supabase)
- Multi-agent features (agent avatars, role pills, collaboration views)
- Problems/Proposals/Activity/Digest tabs from the observatory
- Actual data fetching implementation (that's a separate task)
- Working code (we want the design, not the implementation)

## 8. Visual References

For the designer's reference, here are the closest analogies to what we're building:

- **GitHub commit history**: The vertical list with a left-side graph rail showing branches and merges. Each row is a commit (thought) with a hash (ID), message (content preview), timestamp, and author (agent). Branches are color-coded lanes.
- **Linear.app issue detail**: Clean, minimal, lots of whitespace. Metadata in a right sidebar or top bar. Main content area is focused on the primary object.
- **Vercel deployment logs**: A chronological list of events with timestamps, expandable detail, and status indicators. The "build step" cards are analogous to typed thought cards.
- **GitHub PR conversation view**: A vertical timeline mixing different types of events (comments, reviews, commits, status checks) with type-specific rendering for each.

The ideal design takes the density and scannability of a git log, the type-specific card rendering of a GitHub PR conversation, and the clean minimal aesthetic of Linear, all implemented in our existing Tailwind/Next.js design language.
