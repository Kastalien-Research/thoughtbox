# SPEC-SRC-001: Observatory App Channel

> **Status**: Draft
> **Priority**: P0 (Foundation)
> **Dependencies**: None
> **Source**: srcbook/packages/api/server/channels/app.mts

## Summary

Establish a WebSocket channel in Observatory for observing app/process lifecycles spawned from notebook execution. This enables real-time visibility into web apps, servers, and build processes created by notebooks.

## Motivation

Notebooks can spawn long-running processes (Vite dev servers, Express apps, build processes). Users need:

- Real-time visibility into process status (starting, running, stopped)
- Live console output streaming
- Preview URLs for web applications
- Build/install progress for dependencies

The existing Observatory WebSocket server already uses the `[topic, event, payload]` message format aligned with Srcbook. This spec defines the app-specific channel and event schemas.

## Design

### Channel Topic Pattern

```
app:<appId>
```

Where `appId` is a unique identifier for the spawned process/app (e.g., notebook cell ID or UUID).

### Event Schema (Zod)

```typescript
// src/observatory/schemas/app-events.ts

import { z } from 'zod';

// Preview lifecycle events
export const PreviewStatusSchema = z.enum(['booting', 'running', 'stopped', 'error']);

export const PreviewStartPayloadSchema = z.object({
  appId: z.string(),
});

export const PreviewStopPayloadSchema = z.object({
  appId: z.string(),
});

export const PreviewStatusPayloadSchema = z.object({
  appId: z.string(),
  status: PreviewStatusSchema,
  url: z.string().url().optional(), // Preview URL when running
  error: z.string().optional(),     // Error message if failed
});

export const PreviewLogPayloadSchema = z.object({
  appId: z.string(),
  log: z.string(),
  stream: z.enum(['stdout', 'stderr']).default('stdout'),
  timestamp: z.string().datetime().optional(),
});

// Dependency installation events
export const DepsInstallStatusSchema = z.enum(['installing', 'complete', 'failed']);

export const DepsInstallPayloadSchema = z.object({
  appId: z.string(),
  packages: z.array(z.string()).optional(), // Specific packages to install
});

export const DepsInstallStatusPayloadSchema = z.object({
  appId: z.string(),
  status: DepsInstallStatusSchema,
  error: z.string().optional(),
});

export const DepsInstallLogPayloadSchema = z.object({
  appId: z.string(),
  log: z.string(),
  stream: z.enum(['stdout', 'stderr']).default('stdout'),
});

// Type exports
export type PreviewStatus = z.infer<typeof PreviewStatusSchema>;
export type PreviewStartPayload = z.infer<typeof PreviewStartPayloadSchema>;
export type PreviewStopPayload = z.infer<typeof PreviewStopPayloadSchema>;
export type PreviewStatusPayload = z.infer<typeof PreviewStatusPayloadSchema>;
export type PreviewLogPayload = z.infer<typeof PreviewLogPayloadSchema>;
export type DepsInstallStatus = z.infer<typeof DepsInstallStatusSchema>;
export type DepsInstallPayload = z.infer<typeof DepsInstallPayloadSchema>;
export type DepsInstallStatusPayload = z.infer<typeof DepsInstallStatusPayloadSchema>;
export type DepsInstallLogPayload = z.infer<typeof DepsInstallLogPayloadSchema>;
```

### Event Types

| Event | Direction | Payload | Description |
| ----- | --------- | ------- | ----------- |
| `preview:start` | Client → Server | PreviewStartPayload | Request to start app preview |
| `preview:stop` | Client → Server | PreviewStopPayload | Request to stop app preview |
| `preview:status` | Server → Client | PreviewStatusPayload | Preview status change broadcast |
| `preview:log` | Server → Client | PreviewLogPayload | Console output stream |
| `deps:install` | Client → Server | DepsInstallPayload | Request dependency installation |
| `deps:install:status` | Server → Client | DepsInstallStatusPayload | Install progress broadcast |
| `deps:install:log` | Server → Client | DepsInstallLogPayload | Install output stream |

### Channel Registration Pattern

Following Srcbook's pattern from `server/channels/app.mts`:

```typescript
// src/observatory/channels/app.ts

import { WebSocketServer } from '../ws-server';
import {
  PreviewStartPayloadSchema,
  PreviewStopPayloadSchema,
  DepsInstallPayloadSchema,
} from '../schemas/app-events';
import { previewStart, previewStop, depsInstall } from './app-handlers';

export function registerAppChannel(wss: WebSocketServer) {
  wss
    .channel('app:<appId>')
    .on('preview:start', PreviewStartPayloadSchema, previewStart)
    .on('preview:stop', PreviewStopPayloadSchema, previewStop)
    .on('deps:install', DepsInstallPayloadSchema, depsInstall);
}
```

### Integration with Existing Observatory

The Observatory WS server (`src/observatory/ws-server.ts`) already supports:

- Topic-based subscription
- `[topic, event, payload]` message format
- Broadcast to subscribers

This spec adds the app channel alongside existing Observatory channels.

## Files to Create/Modify

| File | Action | Purpose |
| ---- | ------ | ------- |
| `src/observatory/schemas/app-events.ts` | Create | Zod schemas for app events |
| `src/observatory/channels/app.ts` | Create | Channel registration and routing |
| `src/observatory/channels/app-handlers.ts` | Create | Event handler implementations |
| `src/observatory/ws-server.ts` | Modify | Register app channel |
| `src/observatory/schemas/events.ts` | Modify | Re-export app event schemas |

## Test Scenarios

1. **Channel Subscription**
   - Client subscribes to `app:test-123`
   - Server acknowledges subscription
   - Client receives events only for that app

2. **Preview Lifecycle**
   - Client sends `preview:start`
   - Server broadcasts `preview:status` (booting)
   - Server broadcasts `preview:status` (running) with URL
   - Server streams `preview:log` messages
   - Client sends `preview:stop`
   - Server broadcasts `preview:status` (stopped)

3. **Dependency Installation**
   - Client sends `deps:install` with packages
   - Server broadcasts `deps:install:status` (installing)
   - Server streams `deps:install:log` messages
   - Server broadcasts `deps:install:status` (complete/failed)

4. **Error Handling**
   - Preview fails to start → `preview:status` with error
   - Install fails → `deps:install:status` with error

## Acceptance Criteria

- [ ] Zod schemas exported and documented
- [ ] Channel registration follows Srcbook pattern
- [ ] Events broadcast to correct subscribers only
- [ ] Message format matches `[topic, event, payload]`
- [ ] TypeScript types exported for client usage
- [ ] Integration tests pass for all scenarios

## Future Enhancements

- **Notebook Browser UI**: Observatory interface for scrolling through and browsing notebook content visually
- **Agent Reading Visualization**: Stream agent's notebook reading progress through Observatory for real-time "thinking out loud" display (staggered slower than actual reading speed)
- **Hot Reload Events**: `file:updated` events for live reload coordination
- **Multiple Process Types**: Support for different runtime types (node, deno, bun)

## References

- Srcbook implementation: `srcbook/packages/api/server/channels/app.mts`
- Observatory WS server: `src/observatory/ws-server.ts`
- Srcbook process management: `srcbook/packages/api/apps/processes.mts`
