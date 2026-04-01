# SPEC-SIL-104: Event Stream

> **Status**: Draft
> **Priority**: CRITICAL (First Iteration Bootstrap)
> **Week**: 0 (Pre-SIL)
> **Phase**: SIL Infrastructure
> **Estimated Effort**: 2-3 hours
> **Source**: 200-thought exploration S116-118, S154, S188

## Summary

Write JSON event files on key operations: session_created, session_completed, thought_added, branch_created, export_requested. External processes (SIL components) can poll/watch these files. Enables loose coupling between Thoughtbox and improvement loop.

## Problem Statement

SIL needs to know when things happen in Thoughtbox:
- When sessions complete → trigger evaluation
- When thoughts are added → real-time monitoring
- When branches are rejected → capture failure patterns
- When exports occur → audit trail

Without events:
- SIL must poll sessions repeatedly
- No real-time awareness
- Tight coupling between components
- Missing improvement signals

With event stream:
- Write-once events are append-only (simple)
- External watchers react to events
- Loose coupling via file system
- Foundation for webhooks later

## Scope

### In Scope
- Event emission on key operations
- JSON event format with metadata
- File-based storage in `/data/thoughtbox/events/`
- Event types: session_created, session_completed, thought_added, branch_created, export_requested

### Out of Scope
- Webhook delivery
- Event replay/streaming API
- Event aggregation/windowing
- Real-time push notifications

## Requirements

### R1: Event Types

```typescript
type EventType =
  | 'session_created'
  | 'session_completed'
  | 'thought_added'
  | 'branch_created'
  | 'export_requested';
```

### R2: Event Format

```typescript
interface ThoughtboxEvent {
  eventId: string;           // UUID
  eventType: EventType;
  timestamp: string;         // ISO 8601
  sessionId: string;
  data: Record<string, any>; // Type-specific payload
}

// Examples:
interface SessionCreatedEvent extends ThoughtboxEvent {
  eventType: 'session_created';
  data: {
    title: string;
    project?: string;
  };
}

interface ThoughtAddedEvent extends ThoughtboxEvent {
  eventType: 'thought_added';
  data: {
    thoughtNumber: number;
    cipherType?: string;     // H, E, C, Q, etc.
    branchId?: string;
  };
}

interface SessionCompletedEvent extends ThoughtboxEvent {
  eventType: 'session_completed';
  data: {
    thoughtCount: number;
    branchCount: number;
    duration_ms: number;
    exportPath?: string;
  };
}
```

### R3: File Storage

Events written to configurable directory: `{EVENTS_DIR}/{date}/{timestamp}-{eventType}.json`

**Path Resolution** (in order of precedence):
1. `process.env.THOUGHTBOX_EVENTS_DIR` - explicit override
2. `path.join(process.env.THOUGHTBOX_DATA_DIR, 'events')` - relative to data dir
3. `/data/thoughtbox/events` - fallback default

```typescript
const EVENTS_DIR = process.env.THOUGHTBOX_EVENTS_DIR
  || path.join(process.env.THOUGHTBOX_DATA_DIR || '/data/thoughtbox', 'events');
```

**Example structure**:
```
{EVENTS_DIR}/
└── 2026-01-20/
    ├── 2026-01-20T05-30-00-123Z-session_created.json
    ├── 2026-01-20T05-30-05-456Z-thought_added.json
    ├── 2026-01-20T05-30-10-789Z-thought_added.json
    └── 2026-01-20T05-45-00-000Z-session_completed.json
```

### R4: Atomic Writes

Events must be atomically written (write to temp file, then rename) to prevent partial reads by watchers.

## Technical Approach

### Task 1: EventEmitter Module

```typescript
// src/events/event-emitter.ts

import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync, renameSync } from 'fs';
import { join } from 'path';

const EVENTS_DIR = process.env.THOUGHTBOX_EVENTS_DIR
  || join(process.env.THOUGHTBOX_DATA_DIR || '/data/thoughtbox', 'events');

interface ThoughtboxEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  sessionId: string;
  data: Record<string, any>;
}

export function emitEvent(
  eventType: string,
  sessionId: string,
  data: Record<string, any>
): void {
  const event: ThoughtboxEvent = {
    eventId: randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    sessionId,
    data
  };

  const dateDir = event.timestamp.split('T')[0];
  const dirPath = join(EVENTS_DIR, dateDir);
  mkdirSync(dirPath, { recursive: true });

  const filename = `${event.timestamp.replace(/[:.]/g, '-')}-${eventType}.json`;
  const filePath = join(dirPath, filename);
  const tempPath = `${filePath}.tmp`;

  // Atomic write: write to temp, then rename
  writeFileSync(tempPath, JSON.stringify(event, null, 2));
  renameSync(tempPath, filePath);
}
```

### Task 2: Emit from Handlers

#### Session Created
```typescript
// src/init/tool-handler.ts - handleStartNew

const session = await this.storage.createSession(args);
emitEvent('session_created', session.id, {
  title: args.title,
  project: args.project
});
```

#### Thought Added
```typescript
// src/thought-handler.ts - processThought

await this.storage.addNode(/* ... */);
emitEvent('thought_added', this.currentSessionId, {
  thoughtNumber: assignedNumber,
  cipherType: extractCipherType(thought),
  branchId: validatedInput.branchId
});
```

#### Branch Created
```typescript
// src/thought-handler.ts - when new branch detected

if (willCreateNewBranch) {
  emitEvent('branch_created', this.currentSessionId, {
    branchId: validatedInput.branchId,
    branchFromThought: validatedInput.branchFromThought
  });
}
```

#### Session Completed
```typescript
// src/thought-handler.ts - when nextThoughtNeeded: false

if (!validatedInput.nextThoughtNeeded) {
  emitEvent('session_completed', this.currentSessionId, {
    thoughtCount: this.thoughtHistory.length,
    branchCount: Object.keys(this.branches).length,
    duration_ms: Date.now() - this.sessionStartTime,
    exportPath: exportResult.path
  });
}
```

#### Export Requested
```typescript
// src/session/export-handler.ts

const result = await this.storage.exportSession(sessionId, format);
emitEvent('export_requested', sessionId, {
  format,
  path: result.path,
  size_bytes: result.size
});
```

### Task 3: Cipher Type Extraction

Helper to extract type marker from cipher-formatted thoughts:

```typescript
function extractCipherType(thought: string): string | null {
  // Pattern: S1|H|S0|content
  const match = thought.match(/^S\d+\|([HECQRPOAX])\|/);
  return match ? match[1] : null;
}
```

### Task 4: Event Watcher Utility (Optional)

Simple utility for SIL components to watch events:

```typescript
// dgm-specs/utils/event-watcher.ts

import { watch } from 'chokidar';

export function watchEvents(
  eventTypes: string[],
  callback: (event: ThoughtboxEvent) => void
): void {
  const watcher = watch('/data/thoughtbox/events/**/*.json', {
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('add', (path) => {
    if (!path.endsWith('.tmp')) {
      const event = JSON.parse(readFileSync(path, 'utf-8'));
      if (eventTypes.includes(event.eventType)) {
        callback(event);
      }
    }
  });
}

// Usage:
watchEvents(['session_completed'], (event) => {
  console.log(`Session ${event.sessionId} completed with ${event.data.thoughtCount} thoughts`);
  // Trigger evaluation...
});
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `src/events/event-emitter.ts` | Core event emission logic |
| `src/events/types.ts` | Event type definitions |
| `dgm-specs/utils/event-watcher.ts` | Optional watcher utility |

### Modified Files
| File | Changes |
|------|---------|
| `src/init/tool-handler.ts` | Emit session_created |
| `src/thought-handler.ts` | Emit thought_added, branch_created, session_completed |
| `src/session/export-handler.ts` | Emit export_requested |

### New Directories
| Directory | Purpose |
|-----------|---------|
| `/data/thoughtbox/events/` | Event storage |

## Acceptance Criteria

- [ ] Events written on each operation type
- [ ] Event files are valid JSON
- [ ] Atomic writes prevent partial reads
- [ ] Events include all required metadata
- [ ] Event watcher can consume events
- [ ] No performance impact on normal operations

## Test Cases

```typescript
describe('Event Stream', () => {
  it('emits session_created on new session', async () => {
    await initHandler.handleStartNew({ title: 'Test' });

    const events = readEventsForToday();
    const createEvent = events.find(e => e.eventType === 'session_created');

    expect(createEvent).toBeDefined();
    expect(createEvent.data.title).toBe('Test');
  });

  it('emits thought_added on each thought', async () => {
    await addThought('S1|H|—|Hypothesis');
    await addThought('S2|E|S1|Evidence');

    const events = readEventsForToday();
    const thoughtEvents = events.filter(e => e.eventType === 'thought_added');

    expect(thoughtEvents).toHaveLength(2);
    expect(thoughtEvents[0].data.cipherType).toBe('H');
    expect(thoughtEvents[1].data.cipherType).toBe('E');
  });

  it('emits session_completed when session ends', async () => {
    await addThought('S1|C|—|Conclusion', { nextThoughtNeeded: false });

    const events = readEventsForToday();
    const completeEvent = events.find(e => e.eventType === 'session_completed');

    expect(completeEvent).toBeDefined();
    expect(completeEvent.data.thoughtCount).toBeGreaterThan(0);
  });

  it('writes events atomically', async () => {
    // Rapid event emission
    await Promise.all([
      addThought('Thought 1'),
      addThought('Thought 2'),
      addThought('Thought 3')
    ]);

    // No .tmp files should remain
    const tmpFiles = glob.sync('/data/thoughtbox/events/**/*.tmp');
    expect(tmpFiles).toHaveLength(0);

    // All events should be valid JSON
    const events = readEventsForToday();
    events.forEach(e => {
      expect(() => JSON.stringify(e)).not.toThrow();
    });
  });
});
```

## Gates

### Entry Gate
- File system writable
- SPEC-SIL-100 baseline established

### Exit Gate
- All event types emit correctly
- No .tmp files remain after writes
- Watcher utility works

## Dependencies

- SPEC-SIL-100 (Benchmark Harness)

## Blocked By

- SPEC-SIL-100

## Blocks

- SIL-004 Tiered Evaluator (needs events to trigger)
- SIL-010 Main Loop (needs events for orchestration)
- Future: webhook delivery, real-time dashboards

## Integration with SIL

This event stream becomes the nervous system of SIL:

```
┌─────────────────┐         ┌─────────────────┐
│   Thoughtbox    │  emit   │  Event Stream   │
│   Operations    │ ──────> │  (file-based)   │
└─────────────────┘         └────────┬────────┘
                                     │ watch
                            ┌────────▼────────┐
                            │  SIL Components │
                            │  - Evaluator    │
                            │  - Orchestrator │
                            │  - Analyzer     │
                            └─────────────────┘
```

---

**Created**: 2026-01-20
**Source**: 200-thought exploration S116-118 (webhook/event consideration), S154 (SIL enablers cluster), S188 (first iteration recommendation)
