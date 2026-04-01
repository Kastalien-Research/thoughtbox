/**
 * Assumption Registry Signal Source
 * Reads .assumptions/registry.jsonl for stale unverified assumptions
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { SignalItem } from './types.js';
import { parseJsonlSafe } from './jsonl.js';

export interface AssumptionsConfig {
  staleDays: number;
}

interface Assumption {
  id: string;
  category: string;
  claim: string;
  evidence: string;
  last_verified: string;
  status: string;
  blast_radius?: string;
}

export async function collectAssumptionsSignals(
  config: AssumptionsConfig
): Promise<SignalItem[]> {
  const registryPath = path.join(
    process.cwd(),
    '.assumptions/registry.jsonl'
  );

  let content: string;
  try {
    content = await fs.readFile(registryPath, 'utf-8');
  } catch {
    return [];
  }

  const assumptions = parseJsonlSafe<Assumption>(content);
  const now = Date.now();
  const staleMs = config.staleDays * 24 * 60 * 60 * 1000;
  const signals: SignalItem[] = [];

  for (const a of assumptions) {
    if (a.status !== 'active') continue;

    const lastVerified = new Date(a.last_verified).getTime();
    const staleness = now - lastVerified;
    if (staleness < staleMs) continue;

    const daysSince = Math.floor(staleness / (24 * 60 * 60 * 1000));

    signals.push({
      source: 'assumptions_stale',
      title: a.claim,
      url: '',
      summary: [
        `Unverified for ${daysSince} days.`,
        a.blast_radius
          ? `Blast radius: ${a.blast_radius}`
          : undefined,
        a.evidence ? `Evidence: ${a.evidence.slice(0, 150)}` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
      tags: [a.category, 'stale_assumption'],
    });
  }

  return signals;
}
