# SPEC-SRC-002: Preview Lifecycle Management

> **Status**: Draft
> **Priority**: P0 (Core)
> **Dependencies**: SPEC-SRC-001
> **Source**: srcbook/packages/api/apps/processes.mts

## Summary

Implement process management for app previews spawned from notebooks. This includes starting/stopping Vite dev servers, npm install processes, and other long-running tasks with lifecycle tracking and output streaming.

## Motivation

When notebooks spawn web applications or servers, the system needs to:

- Track process state across the lifecycle (spawning → running → stopped)
- Stream stdout/stderr to Observatory subscribers
- Manage cleanup on stop/error
- Provide preview URLs when available
- Handle concurrent processes per app

## Design

### Process Registry

Central registry tracking all active processes:

```typescript
// src/observatory/processes/registry.ts

export interface ProcessInfo {
  id: string;           // Process identifier
  appId: string;        // Parent app/cell ID
  type: 'vite' | 'npm' | 'node' | 'custom';
  pid: number | null;   // OS process ID
  status: 'spawning' | 'running' | 'stopped' | 'error';
  startedAt: Date;
  stoppedAt?: Date;
  url?: string;         // Preview URL if applicable
  error?: string;       // Error message if failed
}

export class ProcessRegistry {
  private processes: Map<string, ProcessInfo> = new Map();

  register(info: ProcessInfo): void;
  get(id: string): ProcessInfo | undefined;
  getByApp(appId: string): ProcessInfo[];
  update(id: string, updates: Partial<ProcessInfo>): void;
  remove(id: string): void;
  getAllRunning(): ProcessInfo[];
}
```

### Process Manager

Handles spawning and lifecycle management:

```typescript
// src/observatory/processes/manager.ts

import { spawn, ChildProcess } from 'child_process';
import { ProcessRegistry, ProcessInfo } from './registry';
import { WebSocketServer } from '../ws-server';

export interface ProcessCallbacks {
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  onStatus?: (status: ProcessInfo['status']) => void;
  onUrl?: (url: string) => void;
  onExit?: (code: number | null) => void;
}

export class ProcessManager {
  constructor(
    private registry: ProcessRegistry,
    private wss: WebSocketServer,
  ) {}

  async startViteServer(appId: string, cwd: string): Promise<string> {
    // Spawn vite dev server
    // Detect URL from stdout (e.g., "Local: http://localhost:5173/")
    // Broadcast preview:status events
    // Stream preview:log events
  }

  async runNpmInstall(appId: string, cwd: string, packages?: string[]): Promise<void> {
    // Run npm install (optionally specific packages)
    // Broadcast deps:install:status events
    // Stream deps:install:log events
  }

  async stopProcess(processId: string): Promise<void> {
    // Graceful shutdown with SIGTERM
    // Force kill with SIGKILL after timeout
    // Update registry and broadcast status
  }

  async stopAppProcesses(appId: string): Promise<void> {
    // Stop all processes for an app
  }
}
```

### Vite URL Detection

Parse Vite output to extract preview URL:

```typescript
// src/observatory/processes/vite.ts

const VITE_URL_PATTERNS = [
  /Local:\s+(https?:\/\/[^\s]+)/,      // Vite 4+
  /➜\s+Local:\s+(https?:\/\/[^\s]+)/, // Vite with colors
  /Network:\s+(https?:\/\/[^\s]+)/,    // Network URL fallback
];

export function extractViteUrl(output: string): string | null {
  for (const pattern of VITE_URL_PATTERNS) {
    const match = output.match(pattern);
    if (match) return match[1];
  }
  return null;
}
```

### Event Broadcasting

Process manager broadcasts events through Observatory:

```typescript
// In ProcessManager methods:

// Status change
this.wss.broadcast(`app:${appId}`, 'preview:status', {
  appId,
  status: 'running',
  url: extractedUrl,
});

// Log streaming
this.wss.broadcast(`app:${appId}`, 'preview:log', {
  appId,
  log: chunk.toString(),
  stream: 'stdout',
  timestamp: new Date().toISOString(),
});
```

### Handler Integration

Connect to channel handlers from SPEC-SRC-001:

```typescript
// src/observatory/channels/app-handlers.ts

import { ProcessManager } from '../processes/manager';
import type { PreviewStartPayload, PreviewStopPayload, DepsInstallPayload } from '../schemas/app-events';

export async function previewStart(
  payload: PreviewStartPayload,
  context: ChannelContext,
  processManager: ProcessManager,
) {
  const { appId } = payload;
  const appDir = await resolveAppDirectory(appId);

  // Check if already running
  const existing = processManager.getByApp(appId);
  if (existing.some(p => p.type === 'vite' && p.status === 'running')) {
    return; // Already running
  }

  await processManager.startViteServer(appId, appDir);
}

export async function previewStop(
  payload: PreviewStopPayload,
  context: ChannelContext,
  processManager: ProcessManager,
) {
  await processManager.stopAppProcesses(payload.appId);
}

export async function depsInstall(
  payload: DepsInstallPayload,
  context: ChannelContext,
  processManager: ProcessManager,
) {
  const { appId, packages } = payload;
  const appDir = await resolveAppDirectory(appId);

  await processManager.runNpmInstall(appId, appDir, packages);
}
```

### Cleanup on Disconnect

Handle client disconnection gracefully:

```typescript
// In WebSocketServer connection handler:

ws.on('close', () => {
  // Option A: Keep processes running (default)
  // Option B: Stop processes for this client's subscriptions
  // Configurable per-app or globally
});
```

## Files to Create/Modify

| File | Action | Purpose |
| ---- | ------ | ------- |
| `src/observatory/processes/registry.ts` | Create | Process tracking registry |
| `src/observatory/processes/manager.ts` | Create | Process spawning/lifecycle |
| `src/observatory/processes/vite.ts` | Create | Vite-specific helpers |
| `src/observatory/channels/app-handlers.ts` | Create | Channel event handlers |
| `src/observatory/index.ts` | Modify | Export process management |

## Test Scenarios

1. **Vite Server Lifecycle**
   - Start preview → spawns vite process
   - Detects URL from stdout
   - Broadcasts running status with URL
   - Stop preview → process terminated
   - Broadcasts stopped status

2. **npm Install Flow**
   - Request install → spawns npm process
   - Streams install output
   - Broadcasts complete/failed status

3. **Concurrent Processes**
   - Start multiple previews for different apps
   - Each tracked separately
   - Stop one doesn't affect others

4. **Error Handling**
   - Process crashes → error status broadcast
   - Invalid app directory → error status
   - Port already in use → error with message

5. **Cleanup**
   - Server shutdown → all processes terminated
   - App deleted → associated processes terminated

## Acceptance Criteria

- [ ] ProcessRegistry tracks all active processes
- [ ] ProcessManager spawns/stops processes correctly
- [ ] Vite URL detection works across Vite versions
- [ ] Events broadcast to correct app subscribers
- [ ] Graceful shutdown with timeout for force kill
- [ ] Process cleanup on server shutdown
- [ ] Concurrent process support verified

## Security Considerations

- Process spawning should be sandboxed/limited
- Only allow spawning in designated directories
- Rate limit process creation
- Validate appId before resolving to filesystem path

## References

- Srcbook process management: `srcbook/packages/api/apps/processes.mts`
- Srcbook app handlers: `srcbook/packages/api/server/channels/app.mts`
- Node.js child_process: https://nodejs.org/api/child_process.html
