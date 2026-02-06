/**
 * Template rendering and JSON extraction utilities
 */

import { promises as fs } from 'fs';
import { Proposal, ProposalsPayload } from '../types.js';
import type { SignalItem } from './sources/types.js';

/**
 * Simple template renderer (Mustache-like)
 * Replaces {{PLACEHOLDER}} with values from context
 */
export function renderTemplate(
  template: string,
  context: Record<string, string>
): string {
  let result = template;

  // Replace all placeholders
  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value);
  }

  // Check for unreplaced placeholders
  const unreplaced = result.match(/\{\{[A-Z_]+\}\}/g);
  if (unreplaced) {
    throw new Error(
      `Template contains unreplaced placeholders: ${unreplaced.join(', ')}`
    );
  }

  return result;
}

/**
 * Extract proposals JSON from GitHub issue body
 * Looks for AGENTOPS_META_BEGIN block and proposals.json code fence
 */
export function extractProposals(issueBody: string): ProposalsPayload {
  // Find AGENTOPS_META_BEGIN block
  const metaMatch = issueBody.match(
    /<!-- AGENTOPS_META_BEGIN([\s\S]*?)AGENTOPS_META_END -->/
  );
  if (!metaMatch) {
    throw new Error(
      'No AGENTOPS_META_BEGIN block found in issue body'
    );
  }

  // Extract metadata
  const metaJson = metaMatch[1].trim();
  let metadata: Record<string, string>;
  try {
    metadata = JSON.parse(metaJson);
  } catch (err) {
    throw new Error(`Failed to parse metadata JSON: ${(err as Error).message}`);
  }

  // Find proposals.json code block
  // Look for ```json after the details/summary block
  const jsonMatch = issueBody.match(/```json\s+([\s\S]*?)\s+```/);
  if (!jsonMatch) {
    throw new Error('No proposals.json code block found in issue body');
  }

  // Parse proposals JSON
  let proposalsData: ProposalsPayload;
  try {
    proposalsData = JSON.parse(jsonMatch[1]);
  } catch (err) {
    throw new Error(
      `Failed to parse proposals JSON: ${(err as Error).message}`
    );
  }

  // Validate structure
  if (!proposalsData.proposals || !Array.isArray(proposalsData.proposals)) {
    throw new Error('proposals.json missing "proposals" array');
  }

  return proposalsData;
}

/**
 * Extract implementation metadata from evidence comment
 */
export function extractImplementationMeta(
  commentBody: string
): Record<string, string> {
  const metaMatch = commentBody.match(
    /<!-- AGENTOPS_IMPL_META_BEGIN([\s\S]*?)AGENTOPS_IMPL_META_END -->/
  );
  if (!metaMatch) {
    throw new Error(
      'No AGENTOPS_IMPL_META_BEGIN block found in comment body'
    );
  }

  const metaJson = metaMatch[1].trim();
  try {
    return JSON.parse(metaJson);
  } catch (err) {
    throw new Error(
      `Failed to parse implementation metadata: ${(err as Error).message}`
    );
  }
}

/**
 * Format proposals into human-readable sections
 */
export function formatProposalsSummary(proposals: Proposal[]): string {
  const sections = proposals.map((p, idx) => {
    const lines = [
      `### Proposal ${idx + 1} — ${p.title}`,
      '',
      `**Category:** ${p.category}`,
      `**Effort:** ${p.effort_estimate}`,
      `**Risk:** ${p.risk}`,
      `**Approval label:** \`approved:${p.proposal_id}\``,
      '',
      '**Why now**',
      ...p.why_now.map((item) => `- ${item}`),
      '',
      '**Expected impact**',
      `- **Users:** ${p.expected_impact.users.join(', ')}`,
      `- **Outcome:** ${p.expected_impact.outcome}`,
      '',
      '**Design sketch**',
      `${p.design_sketch}`,
      '',
      '**Touch points**',
      ...p.touch_points.map((item) => `- \`${item}\``),
      '',
      '**Test plan**',
      ...p.test_plan.map((item) => `- [ ] ${item}`),
      '',
      '**Rollback**',
      `${p.rollback}`,
      '',
      '---',
      '',
    ];
    return lines.join('\n');
  });

  return sections.join('\n');
}

/**
 * Load template file from disk
 */
export async function loadTemplate(templatePath: string): Promise<string> {
  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch (err) {
    throw new Error(
      `Failed to load template from ${templatePath}: ${(err as Error).message}`
    );
  }
}

/**
 * Normalize URLs for consistent comparison
 * Handles arXiv variations, trailing slashes, etc.
 */
export function normalizeURL(url: string): string {
  try {
    const parsed = new URL(url);

    // Normalize arXiv URLs (http/https, /abs vs /pdf)
    if (parsed.hostname.includes('arxiv.org')) {
      const match = parsed.pathname.match(/\/(abs|pdf)\/(\d+\.\d+)/);
      if (match) {
        return `https://arxiv.org/abs/${match[2]}`;
      }
    }

    // Remove trailing slashes
    const normalized = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}${parsed.search}`;
    return normalized.replace(/\/$/, '');
  } catch {
    return url; // Return as-is if invalid
  }
}

/**
 * Validate that evidence URLs come from collected signals
 */
export function validateEvidenceProvenance(
  proposals: Proposal[],
  collectedSignals: SignalItem[]
): string[] {
  const errors: string[] = [];

  // Build normalized signal URL set
  const signalUrls = new Set(
    collectedSignals.map(s => normalizeURL(s.url))
  );

  proposals.forEach((p, idx) => {
    if (!p.evidence) return;

    p.evidence.forEach((evidenceUrl, urlIdx) => {
      const normalized = normalizeURL(evidenceUrl);

      if (!signalUrls.has(normalized)) {
        errors.push(
          `Proposal ${idx}, evidence[${urlIdx}]: URL not from collected signals (${evidenceUrl})`
        );
      }
    });
  });

  return errors;
}

/**
 * Validate proposals payload structure
 */
export function validateProposalsPayload(
  payload: ProposalsPayload,
  collectedSignals?: SignalItem[]  // NEW parameter
): string[] {
  const errors: string[] = [];

  if (!payload.run_id) errors.push('Missing run_id');
  if (!payload.repo_ref) errors.push('Missing repo_ref');
  if (!payload.git_sha) errors.push('Missing git_sha');
  if (!payload.generated_at) errors.push('Missing generated_at');
  if (!payload.proposals) errors.push('Missing proposals array');

  if (payload.proposals) {
    if (!Array.isArray(payload.proposals)) {
      errors.push('proposals must be an array');
    } else {
      payload.proposals.forEach((p, idx) => {
        if (!p.proposal_id)
          errors.push(`Proposal ${idx}: missing proposal_id`);
        if (!p.title) errors.push(`Proposal ${idx}: missing title`);
        if (!p.category) errors.push(`Proposal ${idx}: missing category`);
        if (!p.effort_estimate)
          errors.push(`Proposal ${idx}: missing effort_estimate`);
        if (!p.risk) errors.push(`Proposal ${idx}: missing risk`);
        if (!p.evidence || !Array.isArray(p.evidence) || p.evidence.length === 0)
          errors.push(`Proposal ${idx}: missing or empty evidence`);

        // Anti-slop: ban fabricated numeric impact claims
        // Only reject numeric claims with impact units (%, ms, x, times, etc.)
        const outcome = p.expected_impact?.outcome || '';
        const numericImpactPattern =
          /\b\d+(\.\d+)?\s*(%|ms|milliseconds?|seconds?|minutes?|hours?|x|×|times)(\b|$)|by\s+\d+(\.\d+)?\s*(%|ms|x|×|times)/i;
        if (numericImpactPattern.test(outcome)) {
          errors.push(`Proposal ${idx}: outcome contains unsourced numeric claim (${outcome.substring(0, 50)}...)`);
        }

        // Enforce full https:// URLs in evidence
        if (p.evidence) {
          p.evidence.forEach((url, urlIdx) => {
            if (!url.startsWith('https://') && !url.startsWith('http://')) {
              errors.push(`Proposal ${idx}, evidence[${urlIdx}]: must be full URL (got: ${url})`);
            }
          });
        }
      });
    }
  }

  // NEW: Provenance check
  if (collectedSignals && payload.proposals) {
    errors.push(...validateEvidenceProvenance(payload.proposals, collectedSignals));
  }

  return errors;
}
