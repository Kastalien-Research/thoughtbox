/**
 * Thoughtbox Skills — served as both MCP prompts and resources.
 *
 * Each skill is accessible two ways:
 * - Resource: thoughtbox://skills/{name} — read the full content on demand
 * - Prompt: skill-{name} — actionable version with arguments
 *
 * The skill catalog is at thoughtbox://skills (lists all available skills).
 */

export interface SkillDefinition {
  /** Skill identifier (e.g., "onboard", "research") */
  name: string;
  /** Human-readable title */
  title: string;
  /** When to use this skill */
  description: string;
  /** Prompt argument descriptions */
  args: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  /** The full skill content (markdown) */
  content: string;
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    name: "onboard",
    title: "Thoughtbox Onboarding",
    description:
      "Gateway orientation for agents using Thoughtbox MCP for the first time. Use when you connect to a Thoughtbox MCP server, need to understand what's available, how to structure reasoning sessions, or how to use the tb SDK.",
    args: [
      {
        name: "focus",
        description:
          "Optional area to focus on (e.g., 'branching', 'knowledge graph', 'cipher notation')",
        required: false,
      },
    ],
    content: `# Thoughtbox Onboarding

Thoughtbox is an MCP server that gives you a structured reasoning workspace. It persists your thinking across sessions, lets you branch and revise ideas, and builds a knowledge graph from your insights. This guide gets you productive in 5 minutes.

## What You Have

Seven modules, two tools:

| Module | What it does | Access via |
|--------|-------------|------------|
| **thought** | Record structured reasoning steps with types, branching, revision | \`tb.thought()\` |
| **session** | List, search, resume, export, analyze reasoning sessions | \`tb.session.*\` |
| **knowledge** | Entity graph with observations, relations, traversal | \`tb.knowledge.*\` |
| **notebook** | Literate programming — create cells, execute code, export | \`tb.notebook.*\` |
| **theseus** | Friction-gated refactoring protocol (scope locking, visa system) | \`tb.theseus()\` |
| **ulysses** | Surprise-gated debugging protocol (S-register, forced reflection) | \`tb.ulysses()\` |
| **observability** | Health checks, session monitoring, cost tracking | \`tb.observability()\` |

**Two MCP tools** give you access to everything:
- \`thoughtbox_search\` — query the operation catalog (what's available, schemas, examples)
- \`thoughtbox_execute\` — run JavaScript using the \`tb\` SDK to chain operations

## Quick Start: Your First Session

### 1. Record a thought

\`\`\`javascript
// thoughtbox_execute
async () => {
  return await tb.thought({
    thought: "Analyzing the authentication flow for security gaps",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 10,
    sessionTitle: "Auth Security Review",
    sessionTags: ["security", "auth"]
  });
}
\`\`\`

The first thought creates a session automatically. Subsequent thoughts append to it.

### 2. Branch to explore alternatives

\`\`\`javascript
async () => {
  await tb.thought({
    thought: "Option A: Token rotation with short-lived JWTs",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 4,
    totalThoughts: 10,
    branchFromThought: 3,
    branchId: "jwt-rotation"
  });
}
\`\`\`

### 3. Revise when you learn something new

\`\`\`javascript
async () => {
  await tb.thought({
    thought: "REVISED: JWT rotation won't work — the session store doesn't support atomic swap",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 8,
    totalThoughts: 10,
    isRevision: true,
    revisesThought: 4
  });
}
\`\`\`

### 4. Complete the session

Always complete your sessions — don't leave them dangling:

\`\`\`javascript
async () => {
  await tb.thought({
    thought: "Conclusion: Use opaque reference tokens with server-side validation.",
    thoughtType: "reasoning",
    nextThoughtNeeded: false,
    thoughtNumber: 10,
    totalThoughts: 10
  });
}
\`\`\`

## Thought Types

| Type | When to use | Required extra fields |
|------|------------|----------------------|
| \`reasoning\` | Default — analysis, exploration | None |
| \`decision_frame\` | Choosing between options | \`confidence\`, \`options\` (exactly 1 selected) |
| \`action_report\` | Recording what you did | \`actionResult\` (success, reversible, tool, target) |
| \`belief_snapshot\` | Capturing current understanding | \`beliefs\` (entities array) |
| \`assumption_update\` | Tracking assumption changes | \`assumptionChange\` (text, oldStatus, newStatus) |
| \`context_snapshot\` | Recording environment state | \`contextData\` (toolsAvailable, constraints) |
| \`progress\` | Tracking task status | \`progressData\` (task, status, note) |

## Core Patterns

- **Forward Thinking (1→N)**: Exploration. Start at 1, build incrementally.
- **Backward Thinking (N→1)**: Planning. Start at the goal, work back.
- **Branching**: Compare alternatives. Branch from a common thought, explore independently, synthesize.
- **Revision**: Course correction. Mark thoughts as revisions when you learn new information.
- **Interleaved Thinking**: Tool-heavy tasks. Think, act, reflect, act.

Read \`thoughtbox://patterns-cookbook\` for detailed examples.

## Session Management

\`\`\`javascript
async () => tb.session.list({ limit: 5 })       // List recent
async () => tb.session.search("authentication")  // Search
async () => tb.session.resume("session-uuid")    // Resume
async () => tb.session.export("id", "markdown")  // Export
async () => tb.session.analyze("id")             // Analyze
\`\`\`

## Knowledge Graph

\`\`\`javascript
async () => tb.knowledge.createEntity({ name: "...", type: "Concept", label: "..." })
async () => tb.knowledge.addObservation({ entity_id: "...", content: "..." })
async () => tb.knowledge.createRelation({ from_id: "...", to_id: "...", relation_type: "BUILDS_ON" })
async () => tb.knowledge.queryGraph({ start_entity_id: "...", max_depth: 2 })
\`\`\`

**Entity types**: Concept, Insight, Workflow. **Relation types**: BUILDS_ON, DEPENDS_ON, RELATES_TO.

## Cipher Notation (Long Sessions)

For sessions >20 thoughts, use cipher for 2-4x compression:
\`S5|H|—|API latency ↑ bc db regression\`
Format: \`[ID]|[TYPE]|[REFS]|[CONTENT]\`
Read \`thoughtbox://cipher\` for the full reference.

## Available Skills

| Task | Skill prompt |
|------|-------------|
| Research a topic | \`skill-research\` |
| Make a decision | \`skill-decision\` |
| Debug something | \`skill-debug\` |
| Refactor with discipline | \`skill-refactor\` |
| Review a session | \`skill-session-review\` |
| Query past knowledge | \`skill-knowledge-query\` |
| Evolve prior thoughts | \`skill-evolution\` |

## Gotchas

- \`decision_frame\` requires \`confidence\` AND \`options\` with exactly 1 selected
- \`context_snapshot\` requires \`contextData\` object
- Notebook code cells require a \`filename\` field
- \`tb.theseus()\` and \`tb.ulysses()\` take \`{operation, ...args}\` (flat)
- Thought numbers must be unique per session+branch`,
  },
  {
    name: "research",
    title: "Thoughtbox Research",
    description:
      "Structured research using Thoughtbox IRCoT (Interleaved Retrieval and Chain-of-Thought). Combines session management, structured reasoning, and knowledge graph persistence.",
    args: [
      {
        name: "topic",
        description: "The research question or topic to investigate",
        required: true,
      },
    ],
    content: `# Thoughtbox Research (IRCoT)

Execute structured research using the Interleaved Retrieval and Chain-of-Thought pattern.

## Phase 1: Setup

Create a session and assess available tools.

\`\`\`javascript
async () => {
  await tb.thought({
    thought: "Research question: [TOPIC]. Strategy: breadth-first scan, then depth on promising leads.",
    thoughtType: "context_snapshot",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 30,
    sessionTitle: "Research: [TOPIC]",
    sessionTags: ["research"],
    contextData: { toolsAvailable: ["list available search tools"], constraints: ["primary sources preferred"] }
  });
}
\`\`\`

## Phase 2: IRCoT Loop

Repeat: **Reason** (what gap to fill?) → **Search** (find evidence) → **Integrate** (record findings) → **Synthesis checkpoint** (every 10-15 thoughts).

\`\`\`javascript
// Reason step
async () => {
  await tb.thought({
    thought: "Gap: I know X but not Y. Next search: [query]. Rationale: [why].",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: N,
    totalThoughts: 30
  });
}

// Integration step
async () => {
  await tb.thought({
    thought: "Finding: [what]. Source: [url/path]. Confidence: [level]. Implication: [impact].",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: N,
    totalThoughts: 30
  });
}
\`\`\`

Stop when: question answered, no productive search avenues, or thought budget exhausted.

## Phase 3: Knowledge Persistence

\`\`\`javascript
async () => {
  const entity = await tb.knowledge.createEntity({
    name: "finding-name",
    type: "Insight",
    label: "Description of finding",
    properties: { domain: "...", summary: "..." }
  });
  await tb.knowledge.createRelation({ from_id: entity.id, to_id: "related-id", relation_type: "BUILDS_ON" });
}
\`\`\`

## Phase 4: Delivery

Record final conclusion with \`nextThoughtNeeded: false\`. Export session as markdown. Extract learnings if session was valuable (\`tb.session.analyze()\` then \`tb.session.extractLearnings()\`).

## Anti-Patterns

- Searching without reasoning first — always state what you expect to find
- Skipping synthesis checkpoints — drift compounds
- Orphan knowledge entities — every entity needs at least one relation
- Premature conclusion — check for contradictory evidence first`,
  },
  {
    name: "decision",
    title: "Thoughtbox Decision",
    description:
      "Structure decisions with parallel hypothesis exploration using Thoughtbox branching and knowledge graph persistence.",
    args: [
      {
        name: "decision",
        description:
          "The decision to make, or the options to evaluate",
        required: true,
      },
    ],
    content: `# Thoughtbox Decision

Use branching to explore options in parallel, then converge with evidence.

## Phase 1: Frame

Create session "Decision: [topic]". Thought 1: state the decision, constraints, success criteria. Identify 2-4 options.

## Phase 2: Branch and Explore

For each option, branch from thought 1:

\`\`\`javascript
async () => {
  await tb.thought({
    thought: "Option A: PostgreSQL �� ACID compliance, mature ecosystem, jsonb support",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 2,
    totalThoughts: 15,
    branchFromThought: 1,
    branchId: "postgresql"
  });
}
\`\`\`

Each branch: gather evidence, assess pros/cons, identify risks, note dependencies.

## Phase 3: Cross-Verify

Compare branches pairwise on the main trunk. Where do they agree? Contradict? Which criteria does each win on? Eliminate dominated options.

## Phase 4: Converge

\`\`\`javascript
async () => {
  await tb.thought({
    thought: "PostgreSQL wins: ACID required, jsonb handles our needs, team expertise",
    thoughtType: "decision_frame",
    confidence: "high",
    options: [
      { label: "PostgreSQL", selected: true, reason: "ACID + jsonb + expertise" },
      { label: "MongoDB", selected: false, reason: "ACID trade-off unacceptable" }
    ],
    nextThoughtNeeded: false,
    thoughtNumber: 15,
    totalThoughts: 15
  });
}
\`\`\`

Note: exactly ONE option must have \`selected: true\`.

## Phase 5: Persist

Create Insight entity for the decision. Add observations with rationale. Create relations to affected entities.

For architectural decisions, bridge to an ADR via the HDD workflow.`,
  },
  {
    name: "debug",
    title: "Thoughtbox Debug",
    description:
      "Surprise-gated debugging using the Ulysses protocol. Prevents reactive debugging spirals by forcing structured hypotheses after repeated surprises.",
    args: [
      {
        name: "problem",
        description: "Description of the unexpected behavior or bug",
        required: true,
      },
    ],
    content: `# Thoughtbox Debug (Ulysses Protocol)

The S-register prevents debugging spirals. Each unexpected outcome increments S. At S=2, you MUST form a falsifiable hypothesis before continuing.

## Phase 1: Initialize

\`\`\`javascript
async () => {
  return await tb.ulysses({
    operation: "init",
    problem: "[PROBLEM DESCRIPTION]",
    constraints: ["list hard limits on what you can change"]
  });
}
\`\`\`

## Phase 2: Plan-Act-Assess Loop

**Plan** with pre-committed recovery:
\`\`\`javascript
async () => tb.ulysses({ operation: "plan", primary: "Check CI env vars vs local", recovery: "If same, check node version" })
\`\`\`

**Execute** the primary action using whatever tools are needed.

**Assess** the outcome:
\`\`\`javascript
async () => tb.ulysses({ operation: "outcome", assessment: "unexpected", severity: "minor", details: "Env vars identical" })
\`\`\`

## Phase 3: Forced Reflection (S=2)

Protocol blocks further plans until you reflect:
\`\`\`javascript
async () => tb.ulysses({
  operation: "reflect",
  hypothesis: "CI failure caused by timing race — db not ready when tests start",
  falsification: "If adding 5s delay doesn't fix it, hypothesis is false"
})
\`\`\`

Resets S to 0. Continue with focused hypothesis.

## Phase 4: Resolution

\`\`\`javascript
async () => tb.ulysses({ operation: "complete", terminalState: "resolved", summary: "Root cause: async db seeding not awaited" })
\`\`\`

Terminal states: resolved, abandoned, deferred.

## When to Use

Use when: first attempt failed, behavior is surprising, going in circles, multiple interacting systems.
Skip for: obvious errors, well-understood failures, quick first-try fixes.`,
  },
  {
    name: "refactor",
    title: "Thoughtbox Refactor",
    description:
      "Friction-gated refactoring using the Theseus protocol. Prevents scope creep by enforcing file scope boundaries, visa-based expansion, and a brittleness counter.",
    args: [
      {
        name: "scope",
        description:
          "Files to refactor and description of structural change",
        required: true,
      },
    ],
    content: `# Thoughtbox Refactor (Theseus Protocol)

Prevents scope creep by locking your file scope upfront, requiring justification to expand, and tracking test breakage.

## Phase 1: Declare Scope

\`\`\`javascript
async () => tb.theseus({ operation: "init", scope: ["src/auth/handler.ts", "src/auth/types.ts"], description: "Extract token validation" })
\`\`\`

## Phase 2: Work Within Scope

After each logical change:
1. Checkpoint: \`tb.theseus({ operation: "checkpoint", diffHash: "...", commitMessage: "...", approved: true })\`
2. Test outcome: \`tb.theseus({ operation: "outcome", testsPassed: true, details: "47 tests pass" })\`

B-counter increments on test failures. B >= 3 means stop and reassess.

## Phase 3: Expand Scope (If Needed)

\`\`\`javascript
async () => tb.theseus({ operation: "visa", filePath: "src/routes/login.ts", justification: "Need to update import path", antiPatternAcknowledged: true })
\`\`\`

Many visas = wrong initial scope. >5 visas = probably a rewrite, not a refactor.

## Phase 4: Complete

\`\`\`javascript
async () => tb.theseus({ operation: "complete", terminalState: "completed", summary: "3 files changed, 1 visa, B=0" })
\`\`\`

## Discipline

| Signal | Action |
|--------|--------|
| B = 0 | Clean — proceed |
| B >= 3 | Stop and reassess |
| Visas > 2 | Scope too narrow |
| Visas > 5 | It's a rewrite |`,
  },
  {
    name: "session-review",
    title: "Thoughtbox Session Review",
    description:
      "Analyze completed sessions to extract patterns, anti-patterns, and learnings for the knowledge graph. The learning loop that makes Thoughtbox improve over time.",
    args: [
      {
        name: "sessionId",
        description:
          "Session ID to review, or 'latest' for most recent",
        required: true,
      },
    ],
    content: `# Thoughtbox Session Review

Turn completed sessions into reusable knowledge.

## Phase 1: Retrieve and Measure

\`\`\`javascript
async () => tb.session.analyze("session-uuid")
// Returns: linearityScore, revisionRate, maxDepth, convergence, isComplete
\`\`\`

| Metric | High means | Look for |
|--------|-----------|----------|
| revisionRate > 0.15 | Many corrections | Anti-patterns |
| linearityScore < 0.7 | Heavy branching | Exploration strategies |
| hasConvergence = true | Branches resolved | Decision patterns |

## Phase 2: Identify Key Moments

Retrieve full session, scan for: pivots, decisions, insights, revisions, branch points. Rate each by impact (1-10), novelty, transferability.

## Phase 3: Extract Learnings

\`\`\`javascript
async () => tb.session.extractLearnings("session-uuid", [
  { thoughtNumber: 5, type: "decision", significance: 8, summary: "Chose hybrid approach" },
  { thoughtNumber: 12, type: "insight", significance: 9, summary: "Cache invalidation pattern" }
], ["pattern", "anti-pattern", "signal"])
\`\`\`

## Phase 4: Persist to Knowledge Graph

Patterns → Insight entities. Anti-patterns → Insight entities with observations. Connect to existing entities.

## Phase 5: Report

Present metrics, key moments, patterns, anti-patterns, and knowledge graph updates.`,
  },
  {
    name: "knowledge-query",
    title: "Thoughtbox Knowledge Query",
    description:
      "Cross-session knowledge retrieval from the Thoughtbox knowledge graph. Searches entities, traverses relations, and synthesizes findings from past sessions.",
    args: [
      {
        name: "topic",
        description: "Topic or question to search for",
        required: true,
      },
    ],
    content: `# Thoughtbox Knowledge Query

Retrieve and synthesize accumulated knowledge from the graph.

## Phase 1: Search

\`\`\`javascript
async () => tb.session.search("topic", 10)     // Search sessions
async () => tb.knowledge.listEntities({ name_pattern: "topic", types: ["Concept", "Insight"], limit: 20 })
async () => tb.knowledge.stats()                // Graph overview
\`\`\`

## Phase 2: Traverse

\`\`\`javascript
async () => tb.knowledge.queryGraph({ start_entity_id: "uuid", max_depth: 2, relation_types: ["BUILDS_ON", "DEPENDS_ON"] })
async () => tb.knowledge.getEntity("uuid")      // Get observations
\`\`\`

## Phase 3: Retrieve Session Context

For deep dives, use the subagent-summarize pattern to retrieve sessions without context pollution (10x reduction).

## Phase 4: Synthesize

Combine entities, relations, observations, and session summaries. Note gaps — missing knowledge is itself useful information.

## Phase 5: Bridge (Optional)

Create relations for newly discovered connections between entities.`,
  },
  {
    name: "evolution",
    title: "Thoughtbox Evolution",
    description:
      "A-Mem thought evolution — check which prior thoughts need updating when a significant new insight arrives. Uses subagent pattern for cost efficiency.",
    args: [
      {
        name: "insight",
        description:
          "The new insight that may require updating prior thoughts",
        required: true,
      },
      {
        name: "sessionId",
        description: "Session containing prior thoughts to check",
        required: false,
      },
    ],
    content: `# Thought Evolution (A-Mem Pattern)

When a new insight arrives, check which prior thoughts should evolve. Based on A-Mem (arxiv.org/abs/2502.12110).

## When to Trigger

On thoughts that: resolve ambiguity, contradict assumptions, add implementation detail, or synthesize threads. Not every thought — only significant ones.

## Phase 1: Retrieve Session

\`\`\`javascript
async () => {
  const session = await tb.session.get("session-id");
  return session.thoughts.map(t => ({ number: t.thoughtNumber, content: t.thought.slice(0, 200) }));
}
\`\`\`

## Phase 2: Classify (via subagent)

Spawn a Haiku subagent with prior thoughts + new insight. Returns compact list: S1: UPDATE/NO_UPDATE per thought. ~50 tokens in your context vs ~800 for full evaluation.

## Phase 3: Apply Revisions

\`\`\`javascript
async () => {
  await tb.thought({
    thought: "EVOLVED: [original] — Now: [how new insight relates]",
    thoughtType: "reasoning",
    isRevision: true,
    revisesThought: N,
    thoughtNumber: M,
    totalThoughts: T,
    nextThoughtNeeded: true
  });
}
\`\`\`

## Phase 4: Update Knowledge Graph

Add observations to entities affected by the new insight.

## Sliding Window

For sessions >30 thoughts, check only the last 10-15 — not the entire history.`,
  },
];

/**
 * Get the skill catalog as a markdown listing.
 */
export function getSkillCatalog(): string {
  const lines = [
    "# Thoughtbox Skills",
    "",
    "Available as prompts (`skill-{name}`) and resources (`thoughtbox://skills/{name}`).",
    "",
    "| Skill | Description |",
    "|-------|-------------|",
  ];
  for (const skill of SKILL_DEFINITIONS) {
    lines.push(`| \`${skill.name}\` | ${skill.description.split(".")[0]}. |`);
  }
  lines.push(
    "",
    "## Usage",
    "",
    "**As a prompt**: invoke `skill-onboard`, `skill-research`, etc. with arguments.",
    "**As a resource**: read `thoughtbox://skills/onboard`, `thoughtbox://skills/research`, etc.",
    "**Catalog**: read `thoughtbox://skills` for this listing.",
  );
  return lines.join("\n");
}

/**
 * Find a skill by name.
 */
export function getSkill(name: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS.find((s) => s.name === name);
}
