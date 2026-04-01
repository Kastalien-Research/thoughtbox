import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import { collectBeadsSignals } from '../runner/lib/sources/beads.js';
import { collectAssumptionsSignals } from '../runner/lib/sources/assumptions.js';
import { collectSessionHandoffSignals } from '../runner/lib/sources/session-handoff.js';
import { parseJsonlSafe } from '../runner/lib/sources/jsonl.js';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: vi.fn(),
    },
  };
});

const mockReadFile = vi.mocked(fs.readFile);

beforeEach(() => {
  vi.clearAllMocks();
});

// === parseJsonlSafe ===

describe('parseJsonlSafe', () => {
  it('parses valid JSONL lines', () => {
    const result = parseJsonlSafe<{ a: number }>(
      '{"a":1}\n{"a":2}\n'
    );
    expect(result).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('skips malformed lines', () => {
    const result = parseJsonlSafe<{ a: number }>(
      '{"a":1}\nBAD LINE\n{"a":3}\n'
    );
    expect(result).toEqual([{ a: 1 }, { a: 3 }]);
  });

  it('returns empty array for empty input', () => {
    expect(parseJsonlSafe('')).toEqual([]);
  });
});

// === Beads ===

describe('collectBeadsSignals', () => {
  const recentClose = new Date(
    Date.now() - 2 * 60 * 60 * 1000
  ).toISOString(); // 2h ago
  const oldClose = new Date(
    Date.now() - 48 * 60 * 60 * 1000
  ).toISOString(); // 48h ago

  const issuesJsonl = [
    JSON.stringify({
      id: 'tb-1',
      title: 'Fix gateway timeout',
      status: 'closed',
      priority: 1,
      issue_type: 'bug',
      closed_at: recentClose,
      close_reason: 'Fixed in PR #201',
    }),
    JSON.stringify({
      id: 'tb-2',
      title: 'Old closed issue',
      status: 'closed',
      priority: 2,
      issue_type: 'task',
      closed_at: oldClose,
      close_reason: 'Done',
    }),
    JSON.stringify({
      id: 'tb-3',
      title: 'High priority open',
      status: 'open',
      priority: 1,
      issue_type: 'feature',
    }),
    JSON.stringify({
      id: 'tb-4',
      title: 'Low priority open',
      status: 'open',
      priority: 4,
      issue_type: 'chore',
    }),
  ].join('\n');

  it('returns recently closed issues within lookback', async () => {
    mockReadFile.mockResolvedValue(issuesJsonl);
    const signals = await collectBeadsSignals({
      closedLookbackHours: 24,
      readyMaxPriority: 2,
    });
    const closed = signals.filter((s) => s.source === 'beads_closed');
    expect(closed).toHaveLength(1);
    expect(closed[0].title).toBe('Fix gateway timeout');
  });

  it('excludes closed issues outside lookback window', async () => {
    mockReadFile.mockResolvedValue(issuesJsonl);
    const signals = await collectBeadsSignals({
      closedLookbackHours: 24,
      readyMaxPriority: 2,
    });
    const titles = signals.map((s) => s.title);
    expect(titles).not.toContain('Old closed issue');
  });

  it('returns open issues at or below priority threshold', async () => {
    mockReadFile.mockResolvedValue(issuesJsonl);
    const signals = await collectBeadsSignals({
      closedLookbackHours: 24,
      readyMaxPriority: 2,
    });
    const ready = signals.filter((s) => s.source === 'beads_ready');
    expect(ready).toHaveLength(1);
    expect(ready[0].title).toBe('High priority open');
  });

  it('excludes open issues above priority threshold', async () => {
    mockReadFile.mockResolvedValue(issuesJsonl);
    const signals = await collectBeadsSignals({
      closedLookbackHours: 24,
      readyMaxPriority: 2,
    });
    const titles = signals.map((s) => s.title);
    expect(titles).not.toContain('Low priority open');
  });

  it('returns empty array when file missing', async () => {
    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file')
    );
    const signals = await collectBeadsSignals({
      closedLookbackHours: 24,
      readyMaxPriority: 2,
    });
    expect(signals).toEqual([]);
  });
});

// === Assumptions ===

describe('collectAssumptionsSignals', () => {
  const staleDate = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString(); // 30 days ago
  const freshDate = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000
  ).toISOString(); // 3 days ago

  const registryJsonl = [
    JSON.stringify({
      id: 'a1',
      category: 'api',
      claim: 'Supabase JWT uses HS256',
      evidence: 'Tested manually',
      last_verified: staleDate,
      status: 'active',
      blast_radius: 'All auth flows break',
    }),
    JSON.stringify({
      id: 'a2',
      category: 'infra',
      claim: 'Cloud Run maxScale=1',
      evidence: 'Deployed and verified',
      last_verified: freshDate,
      status: 'active',
    }),
    JSON.stringify({
      id: 'a3',
      category: 'api',
      claim: 'Deprecated assumption',
      evidence: 'Old',
      last_verified: staleDate,
      status: 'retired',
    }),
  ].join('\n');

  it('returns stale active assumptions', async () => {
    mockReadFile.mockResolvedValue(registryJsonl);
    const signals = await collectAssumptionsSignals({
      staleDays: 14,
    });
    expect(signals).toHaveLength(1);
    expect(signals[0].title).toBe('Supabase JWT uses HS256');
    expect(signals[0].source).toBe('assumptions_stale');
  });

  it('excludes recently verified assumptions', async () => {
    mockReadFile.mockResolvedValue(registryJsonl);
    const signals = await collectAssumptionsSignals({
      staleDays: 14,
    });
    const titles = signals.map((s) => s.title);
    expect(titles).not.toContain('Cloud Run maxScale=1');
  });

  it('excludes non-active assumptions', async () => {
    mockReadFile.mockResolvedValue(registryJsonl);
    const signals = await collectAssumptionsSignals({
      staleDays: 14,
    });
    const titles = signals.map((s) => s.title);
    expect(titles).not.toContain('Deprecated assumption');
  });

  it('includes blast_radius in summary', async () => {
    mockReadFile.mockResolvedValue(registryJsonl);
    const signals = await collectAssumptionsSignals({
      staleDays: 14,
    });
    expect(signals[0].summary).toContain('All auth flows break');
  });

  it('returns empty array when file missing', async () => {
    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file')
    );
    const signals = await collectAssumptionsSignals({
      staleDays: 14,
    });
    expect(signals).toEqual([]);
  });
});

// === Session Handoff ===

describe('collectSessionHandoffSignals', () => {
  const recentTimestamp = new Date(
    Date.now() - 6 * 60 * 60 * 1000
  ).toISOString(); // 6h ago
  const staleTimestamp = new Date(
    Date.now() - 72 * 60 * 60 * 1000
  ).toISOString(); // 72h ago

  const freshHandoff = JSON.stringify({
    session_date: '2026-03-25',
    branch: 'feat/agentops',
    timestamp: recentTimestamp,
    key_decisions: [
      'Use Sonnet 4.5 for daily brief',
      'Pin actions to SHA hashes',
    ],
    open_work: [
      { what: 'Add cross-layer signals', why: 'No internal awareness' },
    ],
  });

  it('returns signals from fresh handoff', async () => {
    mockReadFile.mockResolvedValue(freshHandoff);
    const signals = await collectSessionHandoffSignals({
      maxAgeHours: 48,
    });
    expect(signals).toHaveLength(3);
    const decisions = signals.filter(
      (s) => s.source === 'session_decision'
    );
    const openWork = signals.filter(
      (s) => s.source === 'session_open_work'
    );
    expect(decisions).toHaveLength(2);
    expect(openWork).toHaveLength(1);
  });

  it('returns empty for stale handoff', async () => {
    const staleHandoff = JSON.stringify({
      session_date: '2026-03-20',
      timestamp: staleTimestamp,
      key_decisions: ['Something old'],
    });
    mockReadFile.mockResolvedValue(staleHandoff);
    const signals = await collectSessionHandoffSignals({
      maxAgeHours: 48,
    });
    expect(signals).toEqual([]);
  });

  it('returns empty when file missing', async () => {
    mockReadFile.mockRejectedValue(
      new Error('ENOENT: no such file')
    );
    const signals = await collectSessionHandoffSignals({
      maxAgeHours: 48,
    });
    expect(signals).toEqual([]);
  });

  it('includes branch in summary for decisions', async () => {
    mockReadFile.mockResolvedValue(freshHandoff);
    const signals = await collectSessionHandoffSignals({
      maxAgeHours: 48,
    });
    const decision = signals.find(
      (s) => s.source === 'session_decision'
    );
    expect(decision?.summary).toContain('feat/agentops');
  });
});
