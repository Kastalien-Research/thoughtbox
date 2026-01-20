# Glossary

Terminology and concepts used in Thoughtbox.

---

## Core Concepts

### Thought

A single reasoning step in a session. The atomic unit of the reasoning ledger.

A thought captures:
- The reasoning content itself
- Its position in the chain (`thoughtNumber`)
- Whether more reasoning is needed (`nextThoughtNeeded`)
- Metadata (timestamp, branches, revisions)

**Related:** ThoughtData, ThoughtNode

---

### ThoughtData

The content and metadata of a thought, as stored and transmitted.

```typescript
{
  thought: string           // The reasoning content
  thoughtNumber: number     // Position in chain (1-indexed)
  totalThoughts: number     // Estimated total
  nextThoughtNeeded: boolean
  timestamp: string         // ISO 8601
  // Optional fields for branches, revisions, critique
}
```

**Related:** Thought, ThoughtNode

---

### ThoughtNode

The internal representation of a thought in the linked graph structure. Includes pointers for traversal.

```typescript
{
  id: ThoughtNodeId         // "sessionId:thoughtNumber"
  data: ThoughtData         // The thought content
  prev: ThoughtNodeId       // Previous thought
  next: ThoughtNodeId[]     // Following thoughts (array for branches)
  // Revision and branch pointers
}
```

**Related:** Thought, ThoughtData, Thought Graph

---

### Session

A container for a coherent reasoning chain. One problem, one investigation, one session.

Sessions track:
- Identity (ID, title, tags)
- Statistics (thought count, branch count)
- Timing (created, updated, last accessed)
- Project association

**Related:** Project, Thought

---

### Project

A namespace for organizing sessions. Sessions belong to exactly one project.

Default project: `_default`

Use cases:
- Per-repository reasoning
- Per-team separation
- Per-client isolation

**Related:** Session, Partition

---

### Partition

A time-based grouping of sessions within a project. Used for filesystem organization.

Granularities:
- `monthly`: `2025-01/`
- `weekly`: `2025-W03/`
- `daily`: `2025-01-15/`
- `none`: flat structure

**Related:** Project, Session

---

### Branch

An alternative reasoning path forking from an existing thought. Used to explore options without abandoning the main chain.

Created by specifying `branchFromThought` and `branchId` when adding a thought.

```
Main:    1 → 2 → 3 → 4
                 ↓
Branch:          3 → 4a → 5a
```

**Related:** Thought, Revision

---

### Revision

A correction or update to earlier reasoning. Preserves the original while linking to the correction.

Created by specifying `isRevision: true` and `revisesThought` when adding a thought.

Unlike a branch, a revision explicitly corrects earlier thinking rather than exploring an alternative.

**Related:** Thought, Branch

---

### Thought Graph

The internal data structure representing all thoughts in a session. A directed graph (not just a list) to support branches and revisions.

Enables:
- O(1) thought lookup by ID
- Efficient traversal
- Complex reasoning structures

**Related:** ThoughtNode, LinkedThoughtStore

---

### Reasoning Ledger

The conceptual model behind Thoughtbox: treating thinking as persistent, auditable data rather than ephemeral process.

Like a financial ledger records transactions, a reasoning ledger records reasoning steps.

---

## Progressive Disclosure

### Disclosure Stage

The current level of tool access. Stages unlock progressively as the agent follows the proper initialization flow.

| Stage | Name | Tools Available |
|-------|------|-----------------|
| 0 | Entry | init operations, gateway |
| 1 | Init Complete | + cipher, session |
| 2 | Cipher Loaded | + thought, notebook |
| 3 | Domain Active | + mental_models |

**Related:** Gateway, Tool Registry

---

### Gateway

A single MCP tool that routes all operations internally. Solves the problem of MCP clients not refreshing tool lists dynamically.

Two gateways:
- `thoughtbox_gateway`: Core reasoning operations
- `observability_gateway`: Monitoring (no init required)

**Related:** Disclosure Stage, Operation

---

### Operation

A specific action within a gateway. The `operation` parameter determines which subsystem handles the request.

Examples: `start_new`, `load_context`, `thought`, `cipher`, `session`

**Related:** Gateway

---

## Cipher & Mental Models

### Cipher

The "deep thinking primer" — guidance on effective reasoning patterns loaded at Stage 1.

The name evokes decoding or unlocking: loading the cipher "unlocks" deeper reasoning capabilities.

Content includes:
- Forward/backward thinking patterns
- Branching and revision strategies
- Quality indicators

**Related:** Disclosure Stage, Mental Model

---

### Mental Model

A structured reasoning framework. 15 models are available covering debugging, planning, decision-making, and more.

Examples:
- **Five Whys**: Root cause analysis
- **Pre-mortem**: Risk identification
- **Trade-off Matrix**: Option comparison

Each model provides a process, prompts, and examples.

**Related:** Cipher

---

## Critique & Sampling

### Critique

An autonomous LLM review of reasoning, requested via MCP sampling.

When `critique: true` is passed with a thought, Thoughtbox requests an external LLM to analyze the recent reasoning chain for:
- Logical fallacies
- Unstated assumptions
- Missed alternatives
- Edge cases

**Related:** Sampling, MCP

---

### Sampling

The MCP protocol capability for requesting LLM completions. Thoughtbox uses `sampling/createMessage` to request critiques.

If the MCP client doesn't support sampling, critique requests gracefully degrade (no critique returned).

**Related:** Critique, MCP

---

## Storage & Persistence

### Storage Backend

The abstraction layer for persisting sessions and thoughts.

Implementations:
- **FileSystemStorage**: Persistent to disk (default)
- **InMemoryStorage**: Volatile, for testing

**Related:** Session, Thought

---

### Manifest

A JSON file tracking the contents of a session directory.

```json
{
  "sessionId": "...",
  "files": ["001.json", "002.json", ...],
  "version": "1.0"
}
```

Used for integrity checking and efficient loading.

**Related:** Session, Storage Backend

---

### Session Export

A portable JSON format containing a complete session with all thoughts.

```json
{
  "version": "1.0",
  "session": { ... },
  "nodes": [ ... ],
  "exportedAt": "..."
}
```

Can be imported to restore a session.

**Related:** Session, ThoughtNode

---

## Notebooks

### Notebook

A literate programming document combining Markdown and executable code cells.

Supports JavaScript and TypeScript with isolated execution.

**Related:** Cell, .src.md

---

### Cell

A unit within a notebook. Types:
- **TitleCell**: Document title
- **MarkdownCell**: Documentation
- **CodeCell**: Executable code
- **PackageJsonCell**: Dependencies

**Related:** Notebook

---

### .src.md

The file format for notebooks. Enhanced Markdown compatible with [Srcbook](https://github.com/srcbookdev/srcbook).

Code blocks include a `filename` attribute:
```markdown
```typescript filename="example.ts"
console.log('hello');
```
```

**Related:** Notebook, Cell

---

## Observability

### Observatory

The real-time visualization UI for reasoning sessions. Connects via WebSocket to display thoughts as they're added.

Default port: 1729

Features:
- Live graph visualization
- Branch display
- Session switching

**Related:** WebSocket Events

---

### WebSocket Events

Events emitted by the Observatory server:
- `thought_added`: New thought recorded
- `thought_updated`: Revision applied
- `branch_created`: Fork detected
- `session_loaded`: Active session changed

**Related:** Observatory

---

### Observability Gateway

MCP tool for system monitoring. Unlike the main gateway, requires no initialization.

Operations: `health`, `metrics`, `sessions`, `alerts`, `dashboard_url`

**Related:** Gateway, Prometheus

---

## MCP Protocol

### MCP (Model Context Protocol)

The protocol Thoughtbox uses to communicate with AI agents. Defines tools, prompts, resources, and sampling.

Specification: [modelcontextprotocol.io](https://modelcontextprotocol.io)

**Related:** Gateway, Sampling

---

### Tool

An MCP primitive representing an action the agent can invoke. Thoughtbox exposes two tools (the gateways) that route to many operations internally.

**Related:** Gateway, Operation

---

### Prompt

An MCP primitive for pre-defined prompt templates. Thoughtbox provides prompts like `list_mcp_assets` and `interleaved-thinking`.

**Related:** MCP

---

### Resource

An MCP primitive for read-only content. Thoughtbox exposes resources like the patterns cookbook and mental model content.

URIs: `thoughtbox://patterns-cookbook`, `thoughtbox://mental-models/{tag}/{model}`

**Related:** MCP

---

## Transport

### Transport

The communication layer between Thoughtbox and MCP clients.

Options:
- **stdio**: Communication via stdin/stdout (for CLI tools)
- **HTTP**: REST-like endpoint at `/mcp` (for persistent servers)

**Related:** MCP

---

### Stdio Transport

Server communicates via standard input/output. Client launches server as subprocess.

Best for: Claude Code, Cursor, single-client scenarios

**Related:** Transport

---

### HTTP Transport

Server runs independently, clients connect via HTTP.

Best for: Persistent servers, multiple clients, Docker deployments

Default port: 1731

**Related:** Transport

---

## Analysis Metrics

### Linearity Score

A measure of how linear (vs branched) a session is. Range: 0-1.

- 1.0: Perfectly linear (no branches)
- 0.5: Significant branching
- Lower: Highly exploratory

**Related:** Session Analysis

---

### Revision Rate

The ratio of revisions to total thoughts.

High revision rate may indicate:
- Learning and course correction (good)
- Unclear thinking or thrashing (concerning)

**Related:** Session Analysis, Revision

---

### Thought Density

Thoughts per unit time (typically per minute).

Very high density may indicate shallow thinking; very low may indicate stalls.

**Related:** Session Analysis

---

### Convergence

Whether a session returns to the main chain after branching.

`hasConvergence: true` indicates branches were explored and a decision was made.

**Related:** Session Analysis, Branch
