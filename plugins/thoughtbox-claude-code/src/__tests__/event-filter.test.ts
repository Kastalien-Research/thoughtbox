/**
 * EventFilter + wire normalization tests.
 *
 * Server events are workspace-scoped: the wire shape carries a top-level
 * workspaceId and puts the Thoughtbox session id inside data.session_id.
 * These tests pin the fix for the silent-drop bug where a sessionId filter
 * dropped every event because event.sessionId was never populated.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventFilter } from '../event-filter.js';
import { extractSessionId, type ThoughtboxEvent } from '../event-types.js';

function evt(sessionId: string, type: ThoughtboxEvent['type'] = 'ulysses_outcome'): ThoughtboxEvent {
  return {
    source: 'protocol',
    type,
    sessionId,
    timestamp: '2026-07-01T00:00:00.000Z',
    data: { session_id: sessionId },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extractSessionId', () => {
  it('prefers a top-level sessionId when present', () => {
    expect(
      extractSessionId({ sessionId: 's-top', data: { session_id: 's-data' } }),
    ).toBe('s-top');
  });

  it('derives the session id from data.session_id (server wire shape)', () => {
    expect(
      extractSessionId({ data: { session_id: 's-data', workspace: 'w1' } }),
    ).toBe('s-data');
  });

  it('returns empty string for unattributed events', () => {
    expect(extractSessionId({ data: { foo: 'bar' } })).toBe('');
    expect(extractSessionId({})).toBe('');
    expect(extractSessionId({ sessionId: 42, data: { session_id: 7 } })).toBe('');
  });
});

describe('EventFilter', () => {
  it('forwards everything when no session filter is set', () => {
    const filter = new EventFilter({});
    expect(filter.shouldForward(evt('any-session'))).toBe(true);
    expect(filter.shouldForward(evt(''))).toBe(true);
  });

  it('forwards only matching sessions when a filter is set', () => {
    const filter = new EventFilter({ sessionId: 's1' });
    expect(filter.shouldForward(evt('s1'))).toBe(true);
    expect(filter.shouldForward(evt('s2'))).toBe(false);
  });

  it('drops unattributed events under a session filter, warning once (not silently)', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const filter = new EventFilter({ sessionId: 's1' });

    expect(filter.shouldForward(evt(''))).toBe(false);
    expect(filter.shouldForward(evt(''))).toBe(false);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('no session attribution');
  });

  it('setSessionId activates filtering after construction', () => {
    const filter = new EventFilter({});
    filter.setSessionId('s9');
    expect(filter.shouldForward(evt('s9'))).toBe(true);
    expect(filter.shouldForward(evt('other'))).toBe(false);
  });
});
