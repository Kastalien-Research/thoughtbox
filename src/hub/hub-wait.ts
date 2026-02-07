/**
 * WaitManager — Long-polling mechanism for multi-agent coordination
 *
 * Agents call hub_wait, the server holds the response until a matching
 * hub event fires or timeout expires. Works in every MCP client because
 * it's just a tool call.
 */

import type { HubEvent } from './hub-types.js';

export interface HubWaiter {
  workspaceId: string;
  filter?: string[];
  resolve: (events: HubEvent[]) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
  eventBuffer: HubEvent[];
  coalesceHandle?: ReturnType<typeof setTimeout>;
}

const COALESCE_MS = 100;

export function createWaitManager() {
  const waiters = new Set<HubWaiter>();

  function cleanup(waiter: HubWaiter): void {
    clearTimeout(waiter.timeoutHandle);
    if (waiter.coalesceHandle) clearTimeout(waiter.coalesceHandle);
    waiters.delete(waiter);
  }

  return {
    wait(
      workspaceId: string,
      opts: { timeout?: number; filter?: string[] } = {}
    ): Promise<HubEvent[]> {
      const timeoutSec = Math.min(opts.timeout ?? 55, 55);

      return new Promise<HubEvent[]>((resolve) => {
        const waiter: HubWaiter = {
          workspaceId,
          filter: opts.filter,
          resolve,
          timeoutHandle: setTimeout(() => {
            cleanup(waiter);
            resolve([]);
          }, timeoutSec * 1_000),
          eventBuffer: [],
        };

        waiters.add(waiter);
      });
    },

    notify(event: HubEvent): void {
      for (const waiter of waiters) {
        // Workspace filter
        if (waiter.workspaceId !== event.workspaceId) continue;

        // Type filter
        if (waiter.filter && !waiter.filter.includes(event.type)) continue;

        // Buffer the event
        waiter.eventBuffer.push(event);

        // Reset coalesce window
        if (waiter.coalesceHandle) clearTimeout(waiter.coalesceHandle);
        waiter.coalesceHandle = setTimeout(() => {
          const events = [...waiter.eventBuffer];
          cleanup(waiter);
          waiter.resolve(events);
        }, COALESCE_MS);
      }
    },

    cleanupAll(): void {
      for (const waiter of waiters) {
        clearTimeout(waiter.timeoutHandle);
        if (waiter.coalesceHandle) clearTimeout(waiter.coalesceHandle);
        waiter.resolve([]);
      }
      waiters.clear();
    },

    get pendingCount(): number {
      return waiters.size;
    },
  };
}
