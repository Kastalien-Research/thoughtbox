/**
 * Shared audit data aggregation logic.
 * Used by audit_summary (AUDIT-002) and session manifest (AUDIT-003).
 */
import type { ThoughtData } from '../persistence/types.js';

export interface AuditGap {
  type: 'decision_without_action' | 'critique_override';
  thoughtNumber: number;
  description: string;
}

export interface AuditData {
  sessionId: string;
  generatedAt: string;

  thoughtCounts: {
    total: number;
    reasoning: number;
    decision_frame: number;
    action_report: number;
    belief_snapshot: number;
    assumption_update: number;
    context_snapshot: number;
    progress: number;
    action_receipt: number;
  };

  decisions: {
    total: number;
    byConfidence: {
      high: number;
      medium: number;
      low: number;
    };
  };

  actions: {
    total: number;
    successful: number;
    failed: number;
    reversible: number;
    irreversible: number;
    partiallyReversible: number;
  };

  assumptions: {
    totalUpdates: number;
    flips: number;
    currentlyRefuted: number;
  };

  gaps: AuditGap[];

  critiques: {
    generated: number;
    addressed: number;
    overridden: number;
  };
}

type ThoughtType = ThoughtData['thoughtType'];

const THOUGHT_TYPES: ThoughtType[] = [
  'reasoning',
  'decision_frame',
  'action_report',
  'belief_snapshot',
  'assumption_update',
  'context_snapshot',
  'progress',
  'action_receipt',
];

function countByType(
  thoughts: ThoughtData[]
): AuditData['thoughtCounts'] {
  const counts: Record<string, number> = {};
  for (const t of THOUGHT_TYPES) {
    counts[t] = 0;
  }
  for (const t of thoughts) {
    counts[t.thoughtType] = (counts[t.thoughtType] || 0) + 1;
  }
  return {
    total: thoughts.length,
    reasoning: counts['reasoning'],
    decision_frame: counts['decision_frame'],
    action_report: counts['action_report'],
    belief_snapshot: counts['belief_snapshot'],
    assumption_update: counts['assumption_update'],
    context_snapshot: counts['context_snapshot'],
    progress: counts['progress'],
    action_receipt: counts['action_receipt'],
  };
}

function aggregateDecisions(
  thoughts: ThoughtData[]
): AuditData['decisions'] {
  const decisions = thoughts.filter(
    (t) => t.thoughtType === 'decision_frame'
  );
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const d of decisions) {
    if (d.confidence === 'high') high++;
    else if (d.confidence === 'medium') medium++;
    else if (d.confidence === 'low') low++;
  }
  return {
    total: decisions.length,
    byConfidence: { high, medium, low },
  };
}

function aggregateActions(
  thoughts: ThoughtData[]
): AuditData['actions'] {
  const actions = thoughts.filter(
    (t) => t.thoughtType === 'action_report'
  );
  let successful = 0;
  let failed = 0;
  let reversible = 0;
  let irreversible = 0;
  let partiallyReversible = 0;
  for (const a of actions) {
    if (a.actionResult?.success) successful++;
    else failed++;
    if (a.actionResult?.reversible === 'yes') reversible++;
    else if (a.actionResult?.reversible === 'no') irreversible++;
    else if (a.actionResult?.reversible === 'partial') {
      partiallyReversible++;
    }
  }
  return {
    total: actions.length,
    successful,
    failed,
    reversible,
    irreversible,
    partiallyReversible,
  };
}

function countAssumptions(
  thoughts: ThoughtData[]
): AuditData['assumptions'] {
  const updates = thoughts.filter(
    (t) => t.thoughtType === 'assumption_update'
  );
  let flips = 0;
  const latestStatus = new Map<string, string>();
  for (const u of updates) {
    const change = u.assumptionChange;
    if (!change) continue;
    const isFlip =
      (change.oldStatus === 'believed' &&
        change.newStatus === 'refuted') ||
      (change.oldStatus === 'refuted' &&
        change.newStatus === 'believed');
    if (isFlip) flips++;
    latestStatus.set(change.text, change.newStatus);
  }
  let currentlyRefuted = 0;
  for (const status of latestStatus.values()) {
    if (status === 'refuted') currentlyRefuted++;
  }
  return {
    totalUpdates: updates.length,
    flips,
    currentlyRefuted,
  };
}

function detectGaps(thoughts: ThoughtData[]): AuditGap[] {
  const gaps: AuditGap[] = [];
  for (let i = 0; i < thoughts.length; i++) {
    const t = thoughts[i];
    if (t.thoughtType !== 'decision_frame') continue;
    const window = thoughts.slice(i + 1, i + 6);
    const hasAction = window.some(
      (w) => w.thoughtType === 'action_report'
    );
    if (!hasAction) {
      gaps.push({
        type: 'decision_without_action',
        thoughtNumber: t.thoughtNumber,
        description: `Decision at thought ${t.thoughtNumber} has no action_report within next 5 thoughts`,
      });
    }
  }
  return gaps;
}

function extractCritiqueWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
    .filter((w) => w.length >= 4);
}

function analyzeCritiques(
  thoughts: ThoughtData[]
): { critiques: AuditData['critiques']; gaps: AuditGap[] } {
  let generated = 0;
  let addressed = 0;
  let overridden = 0;
  const gaps: AuditGap[] = [];

  for (let i = 0; i < thoughts.length; i++) {
    const t = thoughts[i];
    if (!t.critique?.text) continue;
    generated++;

    const nextThought = thoughts[i + 1];
    if (!nextThought) {
      overridden++;
      gaps.push({
        type: 'critique_override',
        thoughtNumber: t.thoughtNumber,
        description: `Critique at thought ${t.thoughtNumber} was not addressed (no following thought)`,
      });
      continue;
    }

    const critiqueWords = extractCritiqueWords(t.critique.text);
    const nextText = nextThought.thought.toLowerCase();
    const referenced = critiqueWords.some((w) =>
      nextText.includes(w)
    );

    if (referenced) {
      addressed++;
    } else {
      overridden++;
      gaps.push({
        type: 'critique_override',
        thoughtNumber: t.thoughtNumber,
        description: `Critique at thought ${t.thoughtNumber} was not addressed in following thought`,
      });
    }
  }

  return {
    critiques: { generated, addressed, overridden },
    gaps,
  };
}

export function generateAuditData(
  sessionId: string,
  thoughts: ThoughtData[]
): AuditData {
  const critiqueResult = analyzeCritiques(thoughts);
  const decisionGaps = detectGaps(thoughts);
  return {
    sessionId,
    generatedAt: new Date().toISOString(),
    thoughtCounts: countByType(thoughts),
    decisions: aggregateDecisions(thoughts),
    actions: aggregateActions(thoughts),
    assumptions: countAssumptions(thoughts),
    gaps: [...decisionGaps, ...critiqueResult.gaps],
    critiques: critiqueResult.critiques,
  };
}

/**
 * AUDIT-003: Transform internal AuditData to stored AuditManifest shape.
 * Flattens assumptions.flips to top-level assumptionFlips field.
 */
export function toAuditManifest(
  data: AuditData
): import('../persistence/types.js').AuditManifest {
  return {
    sessionId: data.sessionId,
    generatedAt: data.generatedAt,
    thoughtCounts: data.thoughtCounts,
    decisions: data.decisions,
    actions: data.actions,
    gaps: data.gaps,
    assumptionFlips: data.assumptions.flips,
    critiques: data.critiques,
  };
}
