/**
 * Synthesis Tests
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { validateProposalsPayload } from '../runner/lib/template.js';

test('Proposal validation requires evidence', () => {
  const payload = {
    run_id: 'test',
    repo_ref: 'main',
    git_sha: 'abc123',
    generated_at: '2024-01-01T00:00:00Z',
    proposals: [
      {
        proposal_id: 'p1',
        title: 'Test',
        category: 'UX' as const,
        effort_estimate: 'S' as const,
        risk: 'low' as const,
        evidence: [], // Empty - should fail
        why_now: ['reason'],
        expected_impact: { users: ['all'], outcome: 'better' },
        design_sketch: 'sketch',
        touch_points: ['file.ts'],
        test_plan: ['test'],
        rollout: 'ship it',
        rollback: 'revert',
        acceptance: ['works'],
      },
    ],
  };

  const errors = validateProposalsPayload(payload);
  assert.ok(errors.length > 0);
  assert.ok(errors.some(e => e.includes('evidence')));
});

test('Proposal validation passes with evidence', () => {
  const payload = {
    run_id: 'test',
    repo_ref: 'main',
    git_sha: 'abc123',
    generated_at: '2024-01-01T00:00:00Z',
    proposals: [
      {
        proposal_id: 'p1',
        title: 'Test',
        category: 'UX' as const,
        effort_estimate: 'S' as const,
        risk: 'low' as const,
        evidence: ['https://example.com/issue/1'], // Valid
        why_now: ['reason'],
        expected_impact: { users: ['all'], outcome: 'better' },
        design_sketch: 'sketch',
        touch_points: ['file.ts'],
        test_plan: ['test'],
        rollout: 'ship it',
        rollback: 'revert',
        acceptance: ['works'],
      },
    ],
  };

  const errors = validateProposalsPayload(payload);
  assert.strictEqual(errors.length, 0);
});

test('Proposal validation rejects fabricated numeric claims', () => {
  const fabricatedOutcomes = [
    'Reduce debugging time by 40%',
    'Improve performance by 2x',
    'Reduce latency by 100ms',
  ];

  for (const outcome of fabricatedOutcomes) {
    const payload = {
      run_id: 'test',
      repo_ref: 'main',
      git_sha: 'abc123',
      generated_at: '2024-01-01T00:00:00Z',
      proposals: [
        {
          proposal_id: 'p1',
          title: 'Test',
          category: 'UX' as const,
          effort_estimate: 'S' as const,
          risk: 'low' as const,
          evidence: ['https://example.com/issue/1'],
          why_now: ['reason'],
          expected_impact: { users: ['all'], outcome },
          design_sketch: 'sketch',
          touch_points: ['file.ts'],
          test_plan: ['test'],
          rollout: 'ship it',
          rollback: 'revert',
          acceptance: ['works'],
        },
      ],
    };

    const errors = validateProposalsPayload(payload);
    assert.ok(errors.length > 0, `Should reject: "${outcome}"`);
    assert.ok(errors.some(e => e.includes('unsourced numeric claim')));
  }
});

test('Proposal validation rejects non-URL evidence', () => {
  const payload = {
    run_id: 'test',
    repo_ref: 'main',
    git_sha: 'abc123',
    generated_at: '2024-01-01T00:00:00Z',
    proposals: [
      {
        proposal_id: 'p1',
        title: 'Test',
        category: 'UX' as const,
        effort_estimate: 'S' as const,
        risk: 'low' as const,
        evidence: ['commit/abc123'], // Invalid - not full URL
        why_now: ['reason'],
        expected_impact: { users: ['all'], outcome: 'better' },
        design_sketch: 'sketch',
        touch_points: ['file.ts'],
        test_plan: ['test'],
        rollout: 'ship it',
        rollback: 'revert',
        acceptance: ['works'],
      },
    ],
  };

  const errors = validateProposalsPayload(payload);
  assert.ok(errors.length > 0);
  assert.ok(errors.some(e => e.includes('must be full URL')));
});

console.log('✅ Synthesis tests passed');
