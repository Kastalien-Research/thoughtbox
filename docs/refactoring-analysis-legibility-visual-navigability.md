# Thoughtbox Refactoring Analysis: Legibility, Visual Experience, Navigability

> **Source**: Thoughtbox session `850a7780-043f-4ad4-99b9-93e2e8c060d1` — 65 structured thoughts across three axes.
> **Date**: 2026-03-24
> **Scope**: Full codebase analysis. No behavior changes proposed — structure and presentation only.

---

## Codebase Profile

| Metric | Value |
|--------|-------|
| Source files | 223 TypeScript files |
| Total lines | ~39,400 |
| Largest file | `server-factory.ts` (1,774 lines) |
| Second largest | `thought-handler.ts` (1,193 lines) |
| src/ top-level entries | 30 (files + directories) |
| Root directory entries | 82 |
| MCP surface | 2 Code Mode tools (search + execute) + ~10 individual tools |
| Visual surface | Observatory (single HTML file, inline CSS/JS) |

---

## Axis 1: Legibility

### L1. The `server-factory.ts` Monolith (P0 — the enabling refactor)

At 1,774 lines, `server-factory.ts` is the single biggest legibility obstacle. The function `createMcpServer` is ~1,600 lines long — a single function that:

- Creates the MCP server instance
- Configures storage backends
- Initializes all handlers (thought, session, knowledge, notebook, protocol, hub, observability)
- Registers all tools (~15)
- Registers all prompts (6)
- Registers all resources (15+)
- Registers all resource templates (10+)
- Wires up event handlers and Code Mode catalog

**The 86-line import block** at the top (lines 1-86, importing from 30+ modules) is the code smell that confirms the file does too many things.

**Decomposition plan:**

1. Extract the `registerTool` helper to `server/register-helper.ts`
2. Each domain module gets a `register.ts` that exports a `registerXXXTools(server, deps)` function:
   - `thought/register.ts`
   - `sessions/register.ts`
   - `knowledge/register.ts`
   - `notebook/register.ts`
   - `protocol/register.ts`
   - `hub/register.ts`
   - `observability/register.ts`
3. Extract prompt registration to `prompts/register.ts`
4. Extract resource registration to `resources/register.ts`
5. `server-factory.ts` becomes ~200 lines: create server, create handlers, call register functions, return server

This is mechanical — no logic changes, just moving code. The 86-line import block collapses to ~8 registration function imports.

### L2. The `thought-handler.ts` Monolith (P2)

At 1,193 lines, `ThoughtHandler` has too many responsibilities: type definitions, session management, thought processing, branch management, guide generation, pattern matching, auto-numbering, formatting, persistence coordination, sampling integration, and event emission.

**Decomposition plan:**

| Extract to | Content | ~Lines |
|------------|---------|--------|
| `thought/types.ts` | ThoughtData, ThoughtResponse, related interfaces | 80 |
| `thought/formatter.ts` | formatThought(), formatGuide(), formatMetadata() — pure functions | 200 |
| `thought/auto-number.ts` | Auto-numbering logic | 50 |
| `thought/branch-manager.ts` | Branch creation, lookup, storage | 100 |
| `thought-handler.ts` | Initialization, processThought() orchestration, persistence | 300 |

### L3. Import Soup and Naming Inconsistency

- **Handler vs Tool naming**: The split is intentional (handler = business logic, tool = MCP schema wrapper) but undocumented. `ObservabilityGatewayHandler` violates the convention by acting as a tool.
- **Resource content files**: 10+ files in `resources/` embed multi-hundred-line markdown strings in `.ts` files. These should be `.md` files loaded at build/runtime — easier to read, edit, and diff.
- **Inline type definitions**: `ThoughtData` is defined in `thought-handler.ts`, the persistence layer has its own variant, and the observatory has another. These should converge on a canonical type hierarchy in `thought/types.ts` with projection types for storage, display, and transport.

### L4. Error Handling Inconsistency

Error handling patterns vary across modules: ThoughtHandler catches and logs, SessionHandler propagates, KnowledgeHandler wraps in result objects, Code Mode returns `{ error: message }`. For a system used by LLM agents, every error should include: what operation failed, what input triggered it, and what the caller should do differently. A unified `ThoughtboxError` type with code and context would standardize this.

### L5. Dead Code Risk

The `multi-agent/` directory (cipher-extension, claim-parser, thought-diff, content-hash, conflict-detection) was built for multi-agent thought attribution. The `hub/` directory now handles multi-agent coordination. Verify which `multi-agent/` exports are actually used — dead code is a major legibility drain.

---

## Axis 2: Visual Experience

### V1. Observatory: Type-Aware Thought Rendering (P1)

The Observatory renders all 8 thought types identically — text blocks with a type badge. Each type carries fundamentally different information and should render differently:

| Thought Type | Proposed Rendering |
|-------------|-------------------|
| `reasoning` | Standard card, optional confidence indicator (border color intensity) |
| `decision_frame` | Options as a visual list with selected/rejected styling (poll result) |
| `action_report` | Compact card with success/failure indicator, tool badge, reversibility icon |
| `belief_snapshot` | Entity table with state columns, constraints as a bordered list |
| `assumption_update` | Diff-like display: old status -> new status with trigger context |
| `context_snapshot` | Metadata grid (tools, model, constraints) |
| `progress` | Checklist with status icons (pending=circle, in_progress=half, done=filled, blocked=x) |
| `action_receipt` | Compact inline with match/mismatch indicator |

### V2. Agent Identity Visualization

The CSS defines agent profile colors (`--color-manager`, `--color-architect`, `--color-debugger`, etc.) but the visual distinction in multi-agent sessions is subtle. Proposals:

- Agent-colored left borders on thought cards
- Agent name/icon badge on each card
- Optional "swim lane" view with one column per agent

### V3. Temporal Animation

When thoughts arrive via WebSocket:

- New thoughts slide in from below with a brief highlight glow (the `slide-up` animation exists in CSS)
- Thoughts start slightly transparent, fade to full opacity over 300ms
- Revisions trigger a brief pulse on the revised thought
- Branch creation shows a visual fork indicator

These are CSS-only enhancements — no framework needed.

### V4. Session Timeline / Minimap

For long sessions (50+ thoughts), a timeline/minimap view would show the shape of a session at a glance: burst locations, revision clusters, branch points. The data is already available (thoughtNumber, timestamps, branchId, isRevision).

### V5. Knowledge Graph Visualization

The knowledge module manages entities, observations, and relations — a graph with no visual representation. A force-directed graph view in the Observatory (entities as nodes, relations as edges, colored by type) would make the knowledge layer tangible.

### V6. Session Export Quality

Markdown export is currently a linear dump of thought text. Type-aware export would produce publishable documents:

- Header with session metadata (title, tags, duration, thought count, participants)
- Table of contents for long sessions
- Decision frames as tables, progress as checklists, beliefs as entity lists
- Revision annotations showing what was revised and why

### V7. Observatory Decomposition

The monolithic HTML file should become a lightweight component system (no framework — ES modules and custom elements):

- `observatory.html` — shell with layout grid and script imports
- `observatory.css` — extracted styles organized by component
- `thought-card.js` — renders a single thought with type-aware formatting
- `session-list.js` — sidebar session browser
- `timeline.js` — minimap
- `connection-status.js` — WebSocket state indicator
- `filter-bar.js` — thought type and agent filters

### V8. Smaller Visual Wins

- **Typography**: Thought content should have more generous line height (1.6-1.75), max-width ~65ch
- **Confidence encoding**: Border intensity or subtle background gradient for high/medium/low
- **Revision connections**: Visual line or indent connecting revisions to their parent
- **Connection status**: Prominent green/red/reconnecting indicator for WebSocket state
- **Light mode**: Add `prefers-color-scheme` media query with alternate token values

---

## Axis 3: Navigability

### N1. Flat `src/` Directory (P3 — defer)

30 top-level entries with no grouping. A reader can't tell domain modules from infrastructure from presentation. Proposed tiers:

| Tier | Contents | Role |
|------|----------|------|
| `core/` | thought/, sessions/, knowledge/, notebook/, protocol/, hub/ | Business logic |
| `infra/` | persistence/, auth/, events/, observability/, code-mode/, init/, operations-tool/, sampling/ | Plumbing |
| `surface/` | observatory/, resources/, prompts/, channel/ | Presentation |
| `src/` root | server-factory.ts, index.ts | Composition |

**Decision**: Defer full restructuring (high import churn cost). Use a hybrid approach instead — group only the largest subsystems, leave atomic modules flat.

### N2. Inconsistent Barrel Exports (P1)

Some modules have `index.ts` barrel exports, others don't. Those that exist vary in style. Every module should have an `index.ts` that exports its public API and nothing else.

### N3. Module READMEs (P1)

Every directory under `src/` should have documentation (in `index.ts` header or a README) answering:

1. What does this module do? (one sentence)
2. What are its public exports? (list)
3. What does it depend on? (sibling modules)
4. Who depends on it?

### N4. The Dual Tool Surface Problem

Agents connecting to Thoughtbox see both Code Mode tools (search + execute) AND individual tools (thoughtbox_thought, etc.). The server instructions say "Two tools" but the tool list shows 10+.

**Decision**: Keep both surfaces, annotate individual tools with `{ audience: 'internal' }` so smart clients can hide them. No breaking changes.

### N5. The `operations.ts` Pattern

The operations catalog is the Code Mode navigation layer. Current coverage: session (7 ops), thought (1 op), knowledge (7 ops), notebook (9 ops), theseus (6 ops), ulysses (6 ops), observability (6 ops). Thought having only 1 operation for the core feature is suspicious — review and expand.

### N6. Root Directory Cleanup

82 entries in the project root. Candidates for consolidation:

| Current | Proposed |
|---------|----------|
| `agentic-dev-team/`, `agentops/`, `ai_docs/` | `.dev/` or `tooling/` |
| `benchmarks/`, `self-improvement/`, `reports/` | `.dev/quality/` |
| `dgm-specs/`, `specs/`, `.specs/`, `.specification-suite/` | Consolidate into `.specs/` |
| `pain/`, `future-improvements/` | Fold into beads issues |
| `code-review-comments/`, `demo/`, `staging/` | Assess and archive |

Target root: `src/`, `dist/`, `docs/`, `supabase/`, `infra/`, `scripts/`, `tests/`, config files.

### N7. The Persistence Interface Width

`ThoughtboxStorage` has 20+ methods conflating storage CRUD, querying, project management, and migration. Splitting into composed interfaces (`SessionStore + ThoughtStore + ProjectStore + MigrationStore`) would make implementations more focused and testable.

---

## Refactoring Sequence

Each phase is independently valuable. Each builds on the previous. The Theseus Protocol gates each phase.

| Phase | Target | Axis | Effort | Risk |
|-------|--------|------|--------|------|
| **1** | `server-factory.ts` decomposition | Legibility | Medium | Low (mechanical extraction) |
| **2** | Observatory type-aware renderers | Visual | Medium | Low (additive, no backend change) |
| **3** | Module barrel exports + READMEs | Navigability | Low | None |
| **4** | `thought-handler.ts` decomposition | Legibility | Medium | Medium (regression risk) |
| **5** | Root directory cleanup | Navigability | Low | Low (file moves only) |

**Phase 1 is the enabling refactor** — it makes the composition root legible and unblocks all subsequent phases by establishing the module registration pattern.

### Incremental Safety Protocol

Each extraction step follows:

1. Extract code to new file
2. Re-export from original location (backward compatibility)
3. Run full test suite — verify no regressions
4. Update imports across codebase
5. Remove re-export

Steps 1-3 are safe and reversible. Steps 4-5 are a separate commit.

---

## Key Insight

The three axes converge on a single architectural move: **decompose the monoliths into modular, self-describing units**. This simultaneously improves legibility (smaller files, clear responsibilities), visual experience (each module can own its rendering, the Observatory can be componentized), and navigability (modules have explicit boundaries, the catalog reflects the true architecture).
