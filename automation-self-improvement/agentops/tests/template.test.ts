/**
 * Template rendering tests
 */

import { test, expect } from 'vitest';
import {
  renderTemplate,
  formatProposalsSummary,
  validateProposalsPayload,
} from '../runner/lib/template.js';
import type { Proposal, ProposalsPayload } from '../runner/types.js';

test('renderTemplate replaces all placeholders', () => {
  const template = 'Hello {{NAME}}, today is {{DATE}}!';
  const context = {
    NAME: 'World',
    DATE: '2026-01-28',
  };

  const result = renderTemplate(template, context);
  expect(result).toBe('Hello World, today is 2026-01-28!');
});

test('renderTemplate throws on unreplaced placeholders', () => {
  const template = 'Hello {{NAME}}, today is {{DATE}}!';
  const context = {
    NAME: 'World',
    // Missing DATE
  };

  expect(() => renderTemplate(template, context)).toThrow(/unreplaced placeholders/);
});

test('formatProposalsSummary generates markdown sections', () => {
  const proposals: Proposal[] = [
    {
      proposal_id: 'proposal-1',
      title: 'Test Proposal',
      category: 'reliability',
      effort_estimate: 'S',
      risk: 'low',
      evidence: ['https://example.com/issue/1'],
      why_now: ['Reason 1', 'Reason 2'],
      expected_impact: {
        users: ['User 1', 'User 2'],
        outcome: 'Better reliability',
      },
      design_sketch: 'Add tests',
      touch_points: ['src/test.ts'],
      test_plan: ['unit tests'],
      rollout: 'Deploy gradually',
      rollback: 'Revert commit',
      acceptance: ['Tests pass'],
    },
  ];

  const result = formatProposalsSummary(proposals);

  expect(result).toMatch(/### Proposal 1 — Test Proposal/);
  expect(result).toMatch(/\*\*Category:\*\* reliability/);
  expect(result).toMatch(/\*\*Effort:\*\* S/);
  expect(result).toMatch(/\*\*Risk:\*\* low/);
  expect(result).toMatch(/- Reason 1/);
  expect(result).toMatch(/- Reason 2/);
});

test('validateProposalsPayload detects missing fields', () => {
  const invalidPayload = {
    run_id: 'test-run',
    // Missing other required fields
  } as unknown as ProposalsPayload;

  const errors = validateProposalsPayload(invalidPayload);

  expect(errors.length).toBeGreaterThan(0);
  expect(errors.some((e) => e.includes('repo_ref'))).toBe(true);
  expect(errors.some((e) => e.includes('git_sha'))).toBe(true);
});

test('validateProposalsPayload accepts valid payload', () => {
  const validPayload: ProposalsPayload = {
    run_id: 'test-run',
    repo_ref: 'main',
    git_sha: 'abc123',
    generated_at: '2026-01-28T12:00:00Z',
    proposals: [
      {
        proposal_id: 'proposal-1',
        title: 'Test',
        category: 'reliability',
        effort_estimate: 'S',
        risk: 'low',
        evidence: ['https://example.com/1'],
        why_now: [],
        expected_impact: { users: [], outcome: '' },
        design_sketch: '',
        touch_points: [],
        test_plan: [],
        rollout: '',
        rollback: '',
        acceptance: [],
      },
    ],
  };

  const errors = validateProposalsPayload(validPayload);
  expect(errors.length).toBe(0);
});
