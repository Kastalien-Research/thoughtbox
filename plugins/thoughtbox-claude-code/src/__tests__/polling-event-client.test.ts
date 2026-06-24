/**
 * PollingEventClient unit tests (SPEC-REASONING-CHANNEL-HOSTED c4).
 *
 * Mocks fetch — no server. Verifies the client primes its cursor to the tail
 * without emitting, then emits only NEW events, advances the cursor across
 * polls, and derives the top-level sessionId from data.session_id (the shape
 * EventFilter and the channel formatters expect).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { PollingEventClient } from '../polling-event-client.js';
import type { ThoughtboxEvent } from '../event-types.js';

interface Page {
  events: Array<{
    cursor: number;
    type: string;
    source: string;
    timestamp: string;
    data: Record<string, unknown>;
  }>;
  cursor: number;
}

function jsonResponse(body: Page): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function row(cursor: number, type: string, sessionId: string, extra: Record<string, unknown> = {}) {
  return {
    cursor,
    type,
    source: 'protocol',
    timestamp: '2026-06-15T00:00:00.000Z',
    data: { session_id: sessionId, ...extra },
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('PollingEventClient', () => {
  it('primes to the tail on connect without emitting, then emits new events', async () => {
    // connect prime: one page of existing history (cursor -> 7), then poll
    // returns a new event at cursor 8.
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ events: [row(7, 'ulysses_init', 's1')], cursor: 7 }))
      .mockResolvedValueOnce(jsonResponse({ events: [], cursor: 7 })) // prime second page (empty -> tail)
      .mockResolvedValueOnce(jsonResponse({ events: [row(8, 'ulysses_outcome', 's1', { S: 2 })], cursor: 8 }))
      .mockResolvedValue(jsonResponse({ events: [], cursor: 8 }));
    vi.stubGlobal('fetch', fetchMock);

    const received: ThoughtboxEvent[] = [];
    const client = new PollingEventClient({
      baseUrl: 'https://hosted.example/',
      apiKey: 'tbx_test',
      pollIntervalMs: 5,
      onEvent: (e) => received.push(e),
    });

    await client.connect();
    expect(received).toHaveLength(0); // primed, no replay of history

    await flush();
    await new Promise((r) => setTimeout(r, 20)); // let two polls fire
    client.close();

    expect(received).toHaveLength(1);
    expect(received[0]!.type).toBe('ulysses_outcome');
    expect(received[0]!.sessionId).toBe('s1'); // derived from data.session_id
    expect(received[0]!.data.S).toBe(2);
  });

  it('sends the API key and changed_since cursor', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ events: [], cursor: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new PollingEventClient({
      baseUrl: 'https://hosted.example',
      apiKey: 'tbx_secret',
      onEvent: () => {},
    });
    await client.connect();
    client.close();

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/protocol/events');
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tbx_secret');
  });

  it('adds the session_id query param when configured', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ events: [], cursor: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new PollingEventClient({
      baseUrl: 'https://hosted.example',
      apiKey: 'tbx_secret',
      sessionId: 'session-123',
      onEvent: () => {},
    });
    await client.connect();
    client.close();

    const [url] = fetchMock.mock.calls[0]!;
    const params = new URL(String(url)).searchParams;
    expect(params.get('session_id')).toBe('session-123');
  });
});
