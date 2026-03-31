# Codebase as API: Code Mode for Codebase Interaction

> Status: Design brief
> Date: 2026-03-25
> Precursors: chatgpt-003.md (Three-Plane Design), facades-results.md (experiment data)

## Thesis

Agents don't learn. Between sessions, weights are frozen. Memory (context files, knowledge graphs, session histories) is retrieval, not learning — the agent reconstructs understanding every session from loaded context.

But code changes. Code that's been edited is different code. When an agent reads a codebase improved by previous agents, it reads a better codebase. The patterns are clearer. The operations are more explicit. The types are tighter. The next agent is more effective not because it learned, but because **the environment learned.**

The codebase is the substrate that persists and improves. Agents are stateless visitors that interact with it through a typed interface. Each visitor leaves the codebase slightly better than they found it — not by remembering, but by committing.

This is project memory. Not agent memory. Project memory.

## Core Idea

Thoughtbox exposes the codebase as a typed SDK surface. Agents write TypeScript against `tb.codebase.*` to interact with the codebase. Thoughtbox mediates every read and write, capturing complete traces by construction. No hooks needed. No lossy observation.

The codebase is just another service behind the Thoughtbox proxy — the same way `tb.knowledge.*` proxies the knowledge graph and `tb.session.*` proxies session storage.

```typescript
async () => {
  // discover structure
  const mod = await tb.catalog.describeModule("gateway");

  // read through Thoughtbox
  const handler = await tb.codebase.read("src/code-mode/execute-tool.ts");

  // edit through Thoughtbox
  await tb.codebase.edit("src/code-mode/execute-tool.ts", {
    after: "observability: async",
    insert: "catalog: { listModules: async () => ... }",
  });

  // all traced as one composed operation
}
```

## Why Code as the Interface

Two arguments:

### 1. Configuration, not preference

MCP clients (Claude Code, Cline, etc.) can be configured so `thoughtbox_execute` is the **only** tool available. The agent must go through `tb.codebase.*`. This isn't a suggestion — it's a constraint. Every operation is traced, no exceptions. The learning loop closes by construction.

### 2. Information density

A codebase can contain anything — any language, any framework, any convention. The search space is unbounded. But TypeScript code against a typed SDK is a constrained, familiar medium. The agent reads the interface, knows what methods exist, knows what arguments they take, writes code.

The facades experiment measured this directly: 82 tool uses (raw exploration) vs 29 tool uses (curated facade) for a complex additive task. The reduction came from presenting information in a denser, more navigable form. `tb.codebase.*` takes this to its logical conclusion — the entire codebase interaction is through a typed API.

TypeScript is the universal reduction target:
- Relational data reduces to code (Supabase generates TS types from Postgres schemas)
- API surfaces reduce to code (OpenAPI generates TS clients)
- Codebase structure reduces to code (ts-morph extracts the semantic model)

It is easier for structured information to reduce to code than the other way around.

## Scope Constraint

**TypeScript codebases only.** This is a design decision, not a limitation. ts-morph provides the full semantic model: exports, imports, types, call sites, references. You can generate a typed SDK surface from a TypeScript codebase the same way Supabase generates typed clients from Postgres schemas. Reliable cross-language support is a future problem.

## Three Planes (from chatgpt-003)

### Catalog Plane — what the codebase is

The indexer (ts-morph) extracts the semantic model and produces a typed SDK surface:

```typescript
tb.catalog.listModules()
tb.catalog.describeModule("gateway")  // → ModuleManifest
tb.catalog.dependents("storage")
tb.catalog.operations("gateway")      // → named operations for this module
```

Two grains:
- **Source module** = one file with exports
- **Logical module** = curated/inferred group of files forming one conceptual unit

Logical module boundaries for this codebase: directory convention (`src/code-mode/`, `src/knowledge/`, `src/sessions/`, etc.), each with an `index.ts` barrel.

### Knowledge Plane — what the codebase should be

**DecisionCards** — constraints anchored to modules/files. The "do NOT":

```typescript
interface DecisionCard {
  id: string;
  title: string;
  rationale: string;
  anchors: string[];  // modules, files, symbols
}
```

Example: "setup.ts is internal-only. Language data is available via i18next.options.resources. Do NOT modify setup.ts to export internal state."

**PatternCards** — repeatable recipes for multi-file coordination. The "do THIS":

```typescript
interface PatternCard {
  id: string;
  title: string;
  intent: string;
  why: string;
  anchors: string[];
  requiredFiles?: string[];
  requiredExports?: string[];
  examples: string[];  // trace ids
}
```

Example: "Adding a gateway field requires updating 3 layers: handler passthrough, type cast, schema declaration."

**LessonCards** — discovered truths with promotion pipeline:

```typescript
interface LessonCard {
  id: string;
  statement: string;
  provenance: string[];  // traces, decisions, docs
  confidence: "candidate" | "reviewed" | "canonical";
}
```

### Trace Plane — why this session did what it did

Complete by construction because all operations go through `tb.codebase.*`. The code the agent wrote IS the trace. No hook-based observation needed.

## Codebase Operations as Catalog Entries

The catalog doesn't just describe structure — it discovers **what the codebase affords.** PatternCards aren't documentation. They're operations in the catalog:

```typescript
const op = await tb.catalog.operation("addRoute", { name: "health" });
// Returns:
// {
//   files: ["src/routes/health.ts (create)", "src/routes/index.ts (modify)"],
//   pattern: PatternCard,
//   constraints: DecisionCard[],
//   examples: TraceId[],
// }
```

Operations emerge from traces:
1. First agent explores from scratch → raw trace
2. Second agent gets a candidate pattern (repeated file signature detected)
3. Third agent gets a canonical operation with recipe and examples

The catalog grows its operation surface from trace evidence, not from hand-authored patterns.

## The Learning Loop

The loop is Bayesian updating over code artifacts:

A PatternCard is a prior: "when you add a route, touch these 3 files."
A trace is an observation: agent applied it, tests passed or didn't.

| Outcome | Update |
|---------|--------|
| Pattern applied, tests pass | Reinforce (increase confidence) |
| Pattern applied, agent needed extra file | Update (add file to pattern) |
| Pattern applied, tests fail | Revise (something in the pattern is wrong) |
| Pattern not applied, agent succeeded | Weaken (pattern may be too specific) |

The "prior" is a PatternCard with `requiredFiles` and `constraints`. The "update" is a commit. The "posterior" is the new version of the code. Bayesian properties with version control properties — history, rollback, review.

### Convergence Metric

The map (catalog) and the territory (codebase) should converge over time:

- **Primary signal:** Are discovery queries trending down for repeated task types?
- **Quality signal:** How often does an agent acting on the catalog's model succeed without surprise?
- **Violation signal:** How often does an agent deviate from a DecisionCard?

If agents are still doing 40 reads/greps before their first edit on a module that's been worked on 10 times, the loop isn't closing.

### Task Types

Bootstrap from known categories, discover finer-grained types from traces:

**Coarse types** (inferred from commit type):
- **Additive** (`feat`) — add a new module/tool/field/route
- **Corrective** (`fix`) — fix a bug in existing behavior
- **Structural** (`refactor`) — move, rename, restructure

**Discovered types** (from trace motif clustering):
- Emerge naturally: "all additive traces touching code-mode/ form a 3-file cluster"
- Surface as candidate PatternCards after N repetitions
- Coarse types give the metric; discovered clusters give the PatternCards

### Loop Triggers

1. **Session end** — diff trace against existing PatternCards. Reinforce, update, or revise.
2. **Violation detection** — edit to a DecisionCard-protected file. Either card is wrong or agent ignored it.
3. **Candidate surfacing** — after N sessions, present discovered patterns for review. Explicit "confirm or reject."
4. **Decay** — unconfirmed candidates demote to example-only after M sessions.

## Proxy Architecture

Thoughtbox as proxy to any service the agent needs:

```
tb.codebase.*    → local filesystem (TypeScript codebase)
tb.knowledge.*   → Supabase (knowledge graph)
tb.session.*     → Supabase (session storage)
tb.remote.*      → external MCP servers (Docker containers, APIs)
```

The agent writes TypeScript against typed SDKs. One medium, one search space, one trace format. Every interaction mediated, every operation traced.

## Build Order

1. **Catalog MVP** — ts-morph indexer producing ModuleManifests, `tb.catalog.*` on local server
2. **Codebase proxy** — `tb.codebase.read()`, `.edit()`, `.search()` on local server
3. **Trace capture** — the execute tool already captures code; connect traces to catalog entities
4. **Knowledge cards** — DecisionCard and PatternCard types, anchored to catalog modules
5. **Loop MVP** — session-end trace diffing, candidate pattern surfacing
6. **Convergence metrics** — discovery query trends, surprise rate tracking

## Experiment Grounding

From `.specs/experiments/facades-results.md` (18 trials, Sonnet 4.6):

- Generated facades (≈ catalog plane alone): 42% reduction in tool use
- Curated facades (≈ catalog + knowledge planes): 56% reduction in tool use
- The one violation in 18 trials was caused by catalog without knowledge layer
- Primary value is efficiency, not correctness (with capable models)
- Agents use the facade when provided — no friction observed

These results validate:
- The catalog has real value (efficiency)
- The knowledge plane closes the remaining gap (violation prevention + 23% more efficiency)
- The trace plane is untested but the metric is clear (discovery query trends)

## Relationship to Existing Architecture

- **Code Mode** (`src/code-mode/`) — `tb.catalog` and `tb.codebase` are new namespaces added to the existing execute tool SDK surface
- **Knowledge graph** (`src/knowledge/`) — DecisionCards and PatternCards may live here or in a new `src/catalog/` module. They're knowledge entities anchored to codebase structure.
- **Interceptor framing** — preserved. Thoughtbox mediates but does not validate, gatekeep, or enforce. `tb.codebase.edit()` performs the edit and records it. Period.
- **Supabase persistence** — catalog metadata and traces persist to Supabase. The indexer reads from local disk; everything else goes through Supabase.
