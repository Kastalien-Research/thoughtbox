/**
 * Session Handoff Signal Source
 * Reads .claude/session-handoff.json for recent session decisions and open work
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { SignalItem } from './types.js';

export interface SessionHandoffConfig {
  maxAgeHours: number;
}

interface SessionHandoff {
  session_date?: string;
  branch?: string;
  key_decisions?: string[];
  open_work?: Array<{
    what: string;
    why?: string;
    priority?: string;
  }>;
  timestamp?: string;
}

export async function collectSessionHandoffSignals(
  config: SessionHandoffConfig
): Promise<SignalItem[]> {
  const handoffPath = path.join(
    process.cwd(),
    '.claude/session-handoff.json'
  );

  let content: string;
  try {
    content = await fs.readFile(handoffPath, 'utf-8');
  } catch {
    return [];
  }

  let handoff: SessionHandoff;
  try {
    handoff = JSON.parse(content);
  } catch {
    return [];
  }

  const timestamp = handoff.timestamp || handoff.session_date;
  if (!timestamp) return [];

  const age = Date.now() - new Date(timestamp).getTime();
  const maxAgeMs = config.maxAgeHours * 60 * 60 * 1000;
  if (age > maxAgeMs) return [];

  const signals: SignalItem[] = [];
  const sessionLabel = `session on ${handoff.session_date || 'unknown'}`;
  const branchLabel = handoff.branch
    ? ` (branch: ${handoff.branch})`
    : '';

  for (const decision of handoff.key_decisions || []) {
    signals.push({
      source: 'session_decision',
      title: decision,
      url: '',
      published_at: timestamp,
      summary: `Key decision from ${sessionLabel}${branchLabel}`,
      tags: ['session_decision'],
    });
  }

  for (const item of handoff.open_work || []) {
    signals.push({
      source: 'session_open_work',
      title: item.what,
      url: '',
      published_at: timestamp,
      summary: item.why || '',
      tags: ['session_open_work', item.priority || ''].filter(Boolean),
    });
  }

  return signals;
}
