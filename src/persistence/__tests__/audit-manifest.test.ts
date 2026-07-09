/**
 * AUDIT-003: audit manifest durable persistence.
 *
 * Verifies the manifest generated at session close survives a process
 * restart (fresh storage instance reads it back) and is included in
 * toLinkedExport — the retrieval path behind session_export (json).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileSystemStorage } from '../filesystem-storage.js';
import { InMemoryStorage } from '../storage.js';
import { ThoughtHandler } from '../../thought-handler.js';
import { thoughtEmitter } from '../../events/thought-emitter.js';
import type { AuditManifest, ThoughtData } from '../types.js';

const PROJECT = 'audit-manifest-test';

function makeThought(thoughtNumber: number, overrides: Partial<ThoughtData> = {}): ThoughtData {
  return {
    thought: `Thought ${thoughtNumber}`,
    thoughtNumber,
    totalThoughts: 3,
    nextThoughtNeeded: thoughtNumber < 3,
    timestamp: new Date().toISOString(),
    thoughtType: 'reasoning',
    ...overrides,
  };
}

function makeManifest(sessionId: string): AuditManifest {
  return {
    sessionId,
    generatedAt: new Date().toISOString(),
    thoughtCounts: {
      total: 3,
      reasoning: 2,
      decision_frame: 1,
      action_report: 0,
      belief_snapshot: 0,
      assumption_update: 0,
      context_snapshot: 0,
      progress: 0,
      action_receipt: 0,
      finding: 0,
      synthesis: 0,
      question: 0,
      conclusion: 0,
    },
    decisions: { total: 1, byConfidence: { high: 1, medium: 0, low: 0 } },
    actions: {
      total: 0,
      successful: 0,
      failed: 0,
      reversible: 0,
      irreversible: 0,
      partiallyReversible: 0,
    },
    gaps: [
      {
        type: 'decision_without_action',
        thoughtNumber: 2,
        description: 'Decision at thought 2 has no action_report within next 5 thoughts',
      },
    ],
    assumptionFlips: 1,
  };
}

describe('FileSystemStorage audit manifest persistence', () => {
  let basePath: string;
  let storage: FileSystemStorage;

  beforeEach(async () => {
    basePath = await mkdtemp(join(tmpdir(), 'tb-audit-manifest-'));
    storage = new FileSystemStorage({ basePath });
    await storage.initialize();
    await storage.setProject(PROJECT);
  });

  afterEach(async () => {
    await rm(basePath, { recursive: true, force: true });
  });

  it('persists the manifest across a simulated restart', async () => {
    const session = await storage.createSession({ title: 'Restart Test' });
    await storage.saveThought(session.id, makeThought(1));
    const manifest = makeManifest(session.id);
    await storage.saveAuditManifest(session.id, manifest);

    // Simulate process restart: fresh instance over the same base path
    const restarted = new FileSystemStorage({ basePath });
    await restarted.initialize();
    await restarted.setProject(PROJECT);

    const restored = await restarted.getAuditManifest(session.id);
    expect(restored).toEqual(manifest);
  });

  it('includes the manifest in toLinkedExport (session_export json path)', async () => {
    const session = await storage.createSession({ title: 'Export Test' });
    await storage.saveThought(session.id, makeThought(1));
    const manifest = makeManifest(session.id);
    await storage.saveAuditManifest(session.id, manifest);

    const exported = await storage.toLinkedExport(session.id);
    expect(exported.auditManifest).toEqual(manifest);
  });

  it('returns null when no manifest has been saved', async () => {
    const session = await storage.createSession({ title: 'No Manifest' });
    expect(await storage.getAuditManifest(session.id)).toBeNull();

    const exported = await storage.toLinkedExport(session.id);
    expect(exported.auditManifest).toBeUndefined();
  });

  it('rejects saving a manifest for a nonexistent session', async () => {
    await expect(
      storage.saveAuditManifest('nonexistent-session', makeManifest('nonexistent-session')),
    ).rejects.toThrow('not found');
  });
});

describe('InMemoryStorage audit manifest persistence', () => {
  let storage: InMemoryStorage;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    await storage.initialize();
  });

  it('saves, retrieves, and exports the manifest', async () => {
    const session = await storage.createSession({ title: 'In-Memory Test' });
    await storage.saveThought(session.id, makeThought(1));
    const manifest = makeManifest(session.id);
    await storage.saveAuditManifest(session.id, manifest);

    expect(await storage.getAuditManifest(session.id)).toEqual(manifest);

    const exported = await storage.toLinkedExport(session.id);
    expect(exported.auditManifest).toEqual(manifest);
  });

  it('returns null when no manifest exists and clears on delete', async () => {
    const session = await storage.createSession({ title: 'Cleanup Test' });
    expect(await storage.getAuditManifest(session.id)).toBeNull();

    await storage.saveAuditManifest(session.id, makeManifest(session.id));
    await storage.deleteSession(session.id);
    expect(await storage.getAuditManifest(session.id)).toBeNull();
  });

  it('rejects saving a manifest for a nonexistent session', async () => {
    await expect(
      storage.saveAuditManifest('missing', makeManifest('missing')),
    ).rejects.toThrow('not found');
  });

  it('returns null when getting a manifest for an unknown session', async () => {
    expect(await storage.getAuditManifest('unknown-session')).toBeNull();
  });
});

describe('ThoughtHandler session close — manifest persistence failure honesty', () => {
  let storage: InMemoryStorage;
  let handler: ThoughtHandler;
  let endedEvents: Array<{ sessionId: string; auditManifest?: AuditManifest }>;
  const onSessionEnded = (payload: { sessionId: string; auditManifest?: AuditManifest }) => {
    endedEvents.push(payload);
  };

  function parseToolResult(raw: { content: Array<{ type: string; text: string }> }) {
    return JSON.parse(raw.content[0].text);
  }

  beforeEach(async () => {
    storage = new InMemoryStorage();
    await storage.initialize();
    handler = new ThoughtHandler(true, storage);
    endedEvents = [];
    thoughtEmitter.on('session:ended', onSessionEnded);
  });

  afterEach(() => {
    thoughtEmitter.off('session:ended', onSessionEnded);
    vi.restoreAllMocks();
  });

  it('carries the manifest in the close response and session:ended when persistence succeeds', async () => {
    await handler.processThought({
      thought: 'open the session',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    });
    const sessionId = handler.getCurrentSessionId();

    const result = parseToolResult(await handler.processThought({
      thought: 'close the session',
      thoughtType: 'reasoning',
      nextThoughtNeeded: false,
    }));

    expect(result.sessionClosed).toBe(true);
    expect(result.auditManifest).toBeDefined();
    expect(endedEvents).toHaveLength(1);
    expect(endedEvents[0].auditManifest).toBeDefined();
    expect(await storage.getAuditManifest(sessionId!)).toEqual(result.auditManifest);
  });

  it('omits the manifest from the close response and session:ended when persistence fails', async () => {
    vi.spyOn(storage, 'saveAuditManifest').mockRejectedValue(new Error('disk full'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler.processThought({
      thought: 'open the session',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    });
    const sessionId = handler.getCurrentSessionId();

    const result = parseToolResult(await handler.processThought({
      thought: 'close the session',
      thoughtType: 'reasoning',
      nextThoughtNeeded: false,
    }));

    expect(result.sessionClosed).toBe(true);
    expect(result.auditManifest).toBeUndefined();
    expect(endedEvents).toHaveLength(1);
    expect(endedEvents[0].auditManifest).toBeUndefined();
    expect(await storage.getAuditManifest(sessionId!)).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AUDIT-003] Manifest persistence failed'),
      'disk full',
    );
  });
});
