import { describe, it, expect } from 'vitest';
import { createProxy } from '../proxy.js';
import type { ClientCapabilities } from '../hub-types.js';

describe('Proxy', () => {
  // T-PX-1: Client with Tasks support gets pass-through
  it('client with Tasks support gets CreateTaskResult', async () => {
    const capabilities: ClientCapabilities = {
      tasks: {
        requests: {
          tools: { call: {} },
        },
      },
    };
    const proxy = createProxy(capabilities);

    const result = proxy.handleToolCall({
      operation: 'workspace_status',
      args: { workspaceId: 'abc123' },
    });

    expect(result.type).toBe('task');
    expect(result.status).toBe('working');
  });

  // T-PX-2: Client without Tasks support gets direct response
  it('client without Tasks support gets direct response', async () => {
    const capabilities: ClientCapabilities = {};
    const proxy = createProxy(capabilities);

    const result = proxy.handleToolCall({
      operation: 'workspace_status',
      args: { workspaceId: 'abc123' },
    });

    expect(result.type).toBe('direct');
  });

  // T-PX-3: Capability detection — Tasks supported
  it('detects Tasks capability when present', () => {
    const capabilities: ClientCapabilities = {
      tasks: {
        requests: {
          tools: { call: {} },
        },
      },
    };
    const proxy = createProxy(capabilities);

    expect(proxy.capabilities.supportsTasks).toBe(true);
  });

  // T-PX-4: Capability detection — Tasks not supported
  it('detects Tasks not supported when absent', () => {
    const capabilities: ClientCapabilities = {};
    const proxy = createProxy(capabilities);

    expect(proxy.capabilities.supportsTasks).toBe(false);
  });

  // T-PX-5: Capability detection — Resources subscribe supported
  it('detects Resources subscribe capability when present', () => {
    const capabilities: ClientCapabilities = {
      resources: {
        subscribe: true,
      },
    };
    const proxy = createProxy(capabilities);

    expect(proxy.capabilities.supportsSubscribe).toBe(true);
  });
});
