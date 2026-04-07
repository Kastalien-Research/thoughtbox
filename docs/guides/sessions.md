# Session Lifecycle

## How Sessions Work

A session starts automatically when the first thought includes a `sessionTitle`.
Subsequent thoughts append to the active session. Each session tracks:

- **Title** -- set on creation, describes the reasoning objective
- **Tags** -- searchable labels for categorization
- **Status** -- `active`, `completed`, or `abandoned`
- **Thought count** -- number of thoughts recorded
- **Timestamps** -- created and last updated

There is no explicit "create session" call. Record a thought with a
`sessionTitle` and the session exists.

## Listing and Searching

List recent sessions:

```javascript
async () => tb.session.list({ limit: 10 })
```

Filter by tag:

```javascript
async () => tb.session.list({ tags: ["research"] })
```

Full-text search across session content:

```javascript
async () => tb.session.search("authentication", 10)
```

The second argument caps the number of results returned.

## Resuming

Load a previous session so new thoughts append to it:

```javascript
async () => {
  await tb.session.resume("session-uuid-here");
  // Now tb.thought() calls append to the resumed session
}
```

Resume before recording thoughts. Without it, a new `sessionTitle`
creates a new session instead of continuing the existing one.

## Exporting

Export a session in two formats:

**Markdown** -- human-readable, full fidelity:

```javascript
async () => tb.session.export("session-uuid", "markdown")
```

**Cipher** -- 2-4x compressed notation for context-constrained agents
(see `thoughtbox://cipher` for the grammar):

```javascript
async () => tb.session.export("session-uuid", "cipher")
```

Use cipher format when importing session history into a new context
window. Use markdown for documentation or human review.

## Analyzing

Return structural metrics about reasoning quality:

```javascript
async () => tb.session.analyze("session-uuid")
```

The response includes:

| Metric | What it means |
|--------|--------------|
| `linearityScore` | 1.0 = perfectly linear, lower = more branching |
| `revisionRate` | Fraction of thoughts that are revisions (high = many corrections) |
| `maxDepth` | Deepest branch nesting level |
| `thoughtDensity` | How much reasoning per thought (higher = more substantive) |
| `hasConvergence` | Whether branches resolved to a decision |
| `isComplete` | Whether the session was closed properly |

High `revisionRate` combined with low `hasConvergence` signals a
session that struggled without resolution. High `thoughtDensity` with
low `maxDepth` indicates focused linear reasoning.

## Extracting Learnings

Identify key moments in a session and extract reusable patterns:

```javascript
async () => {
  return await tb.session.extractLearnings(
    "session-uuid",
    [
      {
        thoughtNumber: 5,
        type: "decision",
        significance: 8,
        summary: "Chose event-driven architecture"
      },
      {
        thoughtNumber: 12,
        type: "insight",
        significance: 9,
        summary: "Cache invalidation via event bus"
      }
    ],
    ["pattern", "anti-pattern", "signal"]
  );
}
```

The first array marks key moments with their thought number, type,
significance (1-10), and a one-line summary. The second array lists
categories to classify the extracted learnings into.

Feed the output into the knowledge graph to persist learnings across
sessions.

## Session Hygiene

- Title meaningfully -- "Debug rate limiter race condition" not
  "Session 47"
- Tag for searchability -- use consistent tag vocabularies across
  sessions (`research`, `debug`, `architecture`, `spike`)
- Always complete sessions -- set `nextThoughtNeeded: false` on the
  final thought so the session status moves to `completed`
- Resume existing sessions instead of creating duplicates -- search
  first, resume if a matching session exists
- Export to cipher before context compaction so reasoning history
  survives the window boundary
