/**
 * EventClient (SSE transport) normalization tests.
 *
 * The /events SSE stream sends workspace-scoped events: top-level
 * workspaceId, session id inside data.session_id, no top-level sessionId.
 * Before normalization, EventClient cast the raw JSON to ThoughtboxEvent,
 * so event.sessionId was undefined and a session filter dropped everything.
 * These tests pin the normalized emit shape.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventClient } from '../event-client.js';
import type { ThoughtboxEvent } from '../event-types.js';

function sseResponse(frames: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const frame of frames) {
        controller.enqueue(encoder.encode(frame));
      }
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EventClient', () => {
  it('normalizes server wire events (workspaceId + data.session_id) into sessionId', async () => {
    const wireEvent = {
      source: 'protocol',
      type: 'ulysses_outcome',
      workspaceId: 'ws-1',
      timestamp: '2026-07-01T00:00:00.000Z',
      data: { session_id: 's1', S: 2, assessment: 'FAIL' },
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sseResponse([`data: ${JSON.stringify(wireEvent)}\n\n`]));
    vi.stubGlobal('fetch', fetchMock);

    const received: ThoughtboxEvent[] = [];
    const client = new EventClient({
      baseUrl: 'http://localhost:3000',
      apiKey: 'tbx_test',
      onEvent: (e) => {
        received.push(e);
        client.close(); // stop before the reconnect loop re-fetches
      },
    });

    await client.connect();
    client.close();

    expect(received).toHaveLength(1);
    expect(received[0]!.sessionId).toBe('s1'); // derived from data.session_id
    expect(received[0]!.type).toBe('ulysses_outcome');
    expect(received[0]!.data.S).toBe(2);
  });

  it('emits empty sessionId for unattributed events instead of undefined', async () => {
    const wireEvent = {
      source: 'hub',
      type: 'message_posted',
      workspaceId: 'ws-1',
      timestamp: '2026-07-01T00:00:00.000Z',
      data: { channel: 'general' },
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(sseResponse([`data: ${JSON.stringify(wireEvent)}\n\n`]));
    vi.stubGlobal('fetch', fetchMock);

    const received: ThoughtboxEvent[] = [];
    const client = new EventClient({
      baseUrl: 'http://localhost:3000',
      apiKey: 'tbx_test',
      onEvent: (e) => {
        received.push(e);
        client.close();
      },
    });

    await client.connect();
    client.close();

    expect(received).toHaveLength(1);
    expect(received[0]!.sessionId).toBe('');
  });
});
