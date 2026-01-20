# Core Concepts

Understanding how Thoughtbox structures and manages reasoning.

---

## The Reasoning Ledger

Thoughtbox treats thinking as **data**, not just process. Every thought an agent produces is:

- **Persisted** to disk as structured JSON
- **Linked** to previous thoughts in a chain
- **Timestamped** for temporal analysis
- **Exportable** in multiple formats

This creates a "reasoning ledger" — an auditable history of how conclusions were reached.

---

## Sessions

A **session** is a container for a coherent reasoning chain. Think of it as a document that captures one problem-solving journey.

```
Session: "Debug authentication flow"
├── Thought 1: "Users report 401 errors after token refresh..."
├── Thought 2: "Tracing the code, I see the refresh token is stored but..."
├── Thought 3: "Found it — the old token isn't invalidated..."
├── Thought 4: "The fix is to clear the token cache on refresh..."
└── Thought 5: "Verified: no more 401 errors after the change."
```

### Session Metadata

Each session tracks:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `title` | Human-readable name |
| `tags` | Categorization labels |
| `thoughtCount` | Total thoughts in chain |
| `branchCount` | Alternative paths explored |
| `createdAt` | When reasoning started |
| `updatedAt` | Last modification time |

### Session Lifecycle

```
start_new → Active Session → (thoughts added) → Export/Archive
                ↑                                    ↓
                └──────── load_context ←────────────┘
```

---

## Thoughts

A **thought** is a single reasoning step. It's the atomic unit of the ledger.

### Thought Structure

```typescript
{
  thought: string        // The actual reasoning content
  thoughtNumber: number  // Position in the chain (1-indexed)
  totalThoughts: number  // Estimated total for this session
  nextThoughtNeeded: boolean  // More reasoning required?

  // Automatically added
  timestamp: string      // ISO 8601 datetime
}
```

### Thought Numbering

Thoughts are numbered sequentially within a session:

```
Thought 1 → Thought 2 → Thought 3 → Thought 4 → Thought 5
```

The `totalThoughts` field is an **estimate** — agents can adjust as reasoning evolves.

### Signaling Completion

When `nextThoughtNeeded: false`, the agent indicates the reasoning chain is complete. This doesn't prevent adding more thoughts later, but marks a logical stopping point.

---

## Branches

Sometimes you need to explore **alternative paths**. Branches let you fork from any thought to pursue a different direction.

```
Main chain:    1 → 2 → 3 → 4 → 5
                       ↓
Branch A:              3 → 4a → 5a
                       ↓
Branch B:              3 → 4b
```

### Creating a Branch

```json
{
  "operation": "thought",
  "args": {
    "thought": "Alternative approach: what if we use Redis instead?",
    "thoughtNumber": 4,
    "branchFromThought": 3,
    "branchId": "redis-approach"
  }
}
```

### Branch Properties

| Field | Description |
|-------|-------------|
| `branchFromThought` | Which thought to fork from |
| `branchId` | Unique identifier for this branch |

### When to Branch

- Exploring mutually exclusive options
- Testing hypotheses before committing
- Comparing different solutions
- Preserving the main chain while experimenting

---

## Revisions

Sometimes earlier reasoning was **wrong** or **incomplete**. Revisions let you update past thoughts with new understanding.

```
Original:  1 → 2 → 3 → 4 → 5
                   ↓
Revision:          3' (corrects thought 3)
```

### Creating a Revision

```json
{
  "operation": "thought",
  "args": {
    "thought": "Correction: the issue isn't in the token handling, it's in the session middleware.",
    "thoughtNumber": 6,
    "isRevision": true,
    "revisesThought": 3
  }
}
```

### Revision Properties

| Field | Description |
|-------|-------------|
| `isRevision` | Marks this as a correction |
| `revisesThought` | Which thought is being updated |

### Revisions vs. Branches

| Revisions | Branches |
|-----------|----------|
| Correct errors | Explore alternatives |
| Update understanding | Compare options |
| Keep one truth | Maintain multiple paths |

---

## Progressive Disclosure

Thoughtbox uses a **staged tool system** to guide agents through proper initialization. This prevents agents from trying to add thoughts before a session exists.

### The Four Stages

| Stage | Name | Tools Available | How to Advance |
|-------|------|-----------------|----------------|
| 0 | Entry | `init`, `thoughtbox_gateway` | Connect to server |
| 1 | Init Complete | + `cipher`, `session` | Call `start_new` or `load_context` |
| 2 | Cipher Loaded | + `thought`, `notebook` | Call `cipher` |
| 3 | Domain Active | + `mental_models` | Domain operations |

### Why Stages?

1. **Prevents errors**: Can't add thoughts without a session
2. **Guides workflow**: Agents naturally follow the correct sequence
3. **Progressive capability**: Advanced tools unlock as context builds

### Stage Flow Example

```
Agent connects → Stage 0
  │
  ├── list_sessions (works at Stage 0)
  │
  └── start_new → Stage 1
        │
        └── cipher → Stage 2
              │
              └── thought (now available)
```

---

## The Thought Graph

Internally, thoughts are stored as a **linked graph** rather than a simple list. This enables O(1) lookups and complex traversals.

### Node Structure

```typescript
{
  id: "session-123:5"        // Unique node ID
  data: ThoughtData          // The thought content
  prev: "session-123:4"      // Previous in chain
  next: ["session-123:6"]    // Following thoughts (array for branches)
  revisesNode: null          // If revision, points to original
  branchOrigin: null         // If branch, points to fork point
  branchId: null             // Branch identifier
}
```

### Graph Relationships

```
         ┌─────────────────────────────────┐
         │                                 │
         ▼                                 │
    ┌────────┐    ┌────────┐    ┌────────┐ │
    │ Node 1 │───▶│ Node 2 │───▶│ Node 3 │─┘
    └────────┘    └────────┘    └────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                      ▼
                    ┌────────┐            ┌────────┐
                    │ Node 4 │            │Node 4a │ (branch)
                    └────────┘            └────────┘
```

---

## Session Storage

Sessions are persisted to the filesystem with time-based partitioning.

### Directory Structure

```
~/.thoughtbox/projects/{project}/sessions/
└── {partition}/           # e.g., "2025-01" (monthly)
    └── {session-id}/
        ├── manifest.json  # Session metadata
        ├── 001.json       # Thought 1
        ├── 002.json       # Thought 2
        └── ...
```

### Partition Granularity

Configure how sessions are grouped:

| Granularity | Example Path | Use Case |
|-------------|--------------|----------|
| `monthly` | `2025-01/` | Default, good for most uses |
| `weekly` | `2025-W03/` | High-volume reasoning |
| `daily` | `2025-01-15/` | Very high volume |
| `none` | (flat) | Small projects |

---

## Autonomous Critique

Thoughtbox supports **self-critique** via MCP sampling. The agent can request an external LLM to review its reasoning.

### How It Works

```json
{
  "operation": "thought",
  "args": {
    "thought": "Based on my analysis, the optimal solution is...",
    "thoughtNumber": 5,
    "critique": true  // Request critique
  }
}
```

The server:
1. Builds context from recent thoughts
2. Requests critique via MCP `sampling/createMessage`
3. Returns the critique to the agent
4. Persists the critique with the thought

### Critique Focus Areas

The critique prompt examines:
- Logical fallacies
- Unstated assumptions
- Alternative approaches
- Edge cases not considered
- Potential improvements

### Critique Data

```typescript
{
  thought: "...",
  critique: {
    text: "This reasoning assumes network reliability...",
    model: "claude-sonnet-4-5-20250929",
    timestamp: "2025-01-15T10:35:00Z"
  }
}
```

---

## Next Steps

- [**Tools Reference**](./tools-reference.md) — Complete API for all operations
- [**Mental Models**](./mental-models.md) — Structured reasoning frameworks
- [**Architecture**](./architecture.md) — Technical implementation details
