/**
 * Beads Issue Signal Source
 * Reads .beads/issues.jsonl for recently closed and high-priority open issues
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { SignalItem } from './types.js';
import { parseJsonlSafe } from './jsonl.js';

export interface BeadsConfig {
  closedLookbackHours: number;
  readyMaxPriority: number;
}

interface BeadsIssue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  issue_type: string;
  closed_at?: string;
  close_reason?: string;
}

export async function collectBeadsSignals(
  config: BeadsConfig
): Promise<SignalItem[]> {
  const issuesPath = path.join(process.cwd(), '.beads/issues.jsonl');

  let content: string;
  try {
    content = await fs.readFile(issuesPath, 'utf-8');
  } catch {
    return [];
  }

  const issues = parseJsonlSafe<BeadsIssue>(content);
  const now = Date.now();
  const lookbackMs = config.closedLookbackHours * 60 * 60 * 1000;
  const signals: SignalItem[] = [];

  for (const issue of issues) {
    if (
      issue.status === 'closed' &&
      issue.closed_at &&
      now - new Date(issue.closed_at).getTime() <= lookbackMs
    ) {
      signals.push({
        source: 'beads_closed',
        title: issue.title,
        url: '',
        published_at: issue.closed_at,
        summary: [
          issue.close_reason,
          issue.description?.slice(0, 200),
        ]
          .filter(Boolean)
          .join(' — '),
        tags: [issue.issue_type, `P${issue.priority}`],
      });
    }

    if (
      issue.status === 'open' &&
      issue.priority <= config.readyMaxPriority
    ) {
      signals.push({
        source: 'beads_ready',
        title: issue.title,
        url: '',
        summary: issue.description?.slice(0, 200) || '',
        tags: [issue.issue_type, `P${issue.priority}`],
      });
    }
  }

  return signals;
}
