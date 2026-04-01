/**
 * Tests for Phase 1.2: Anti-Slop Hardening + Cost Transparency
 */

import assert from 'assert';
import {
  validateProposalsPayload,
  normalizeURL,
  validateEvidenceProvenance,
} from '../runner/lib/template.js';
import { calculateCost } from '../runner/lib/llm/pricing.js';
import type { Proposal } from '../runner/types.js';
import type { SignalItem } from '../runner/lib/sources/types.js';

// ============================================================================
// P0-1: Evidence Provenance Enforcement
// ============================================================================

console.log('\n=== Testing Evidence Provenance Enforcement ===\n');

// Test: Rejects URLs not in collected signals
{
  const signals: SignalItem[] = [
    {
      url: 'https://arxiv.org/abs/2601.12345',
      title: 'Test Paper',
      source: 'arxiv',
      tags: [],
    },
  ];

  const proposals: Proposal[] = [
    {
      proposal_id: 'test-1',
      title: 'Test',
      category: 'research',
      effort_estimate: 'M',
      risk: 'low',
      evidence: [
        'https://arxiv.org/abs/2601.12345', // ✅ Valid
        'https://example.com/fake-paper', // ❌ Not in signals
      ],
      why_now: ['test'],
      expected_impact: {
        users: ['test'],
        outcome: 'test outcome',
      },
      design_sketch: 'test',
      touch_points: ['test'],
      test_plan: ['test'],
      rollback: 'test',
    },
  ];

  const errors = validateEvidenceProvenance(proposals, signals);
  assert.ok(
    errors.length > 0,
    'Should reject URLs not in collected signals'
  );
  assert.ok(
    errors.some((e) => e.includes('not from collected signals')),
    'Error message should mention provenance issue'
  );
  console.log('✅ Evidence provenance: rejects URLs not in signals');
}

// Test: Normalizes arXiv URLs correctly
{
  const signals: SignalItem[] = [
    {
      url: 'http://arxiv.org/abs/2601.12345v1',
      title: 'Test',
      source: 'arxiv',
      tags: [],
    },
  ];

  const proposals: Proposal[] = [
    {
      proposal_id: 'test-1',
      title: 'Test',
      category: 'research',
      effort_estimate: 'M',
      risk: 'low',
      evidence: ['https://arxiv.org/pdf/2601.12345.pdf'], // Different format, same paper
      why_now: ['test'],
      expected_impact: { users: ['test'], outcome: 'test' },
      design_sketch: 'test',
      touch_points: ['test'],
      test_plan: ['test'],
      rollback: 'test',
    },
  ];

  const errors = validateEvidenceProvenance(proposals, signals);
  assert.strictEqual(
    errors.length,
    0,
    'Should normalize arXiv URLs to same paper'
  );
  console.log('✅ Evidence provenance: normalizes arXiv URLs');
}

// ============================================================================
// P0-2: Fix Numeric Impact Regex
// ============================================================================

console.log('\n=== Testing Numeric Impact Regex ===\n');

// Test: Allows version numbers
{
  const payload = {
    run_id: 'test',
    repo_ref: 'main',
    git_sha: 'abc123',
    generated_at: new Date().toISOString(),
    proposals: [
      {
        proposal_id: 'test-1',
        title: 'Test',
        category: 'infrastructure',
        effort_estimate: 'M',
        risk: 'low',
        evidence: ['https://example.com'],
        why_now: ['test'],
        expected_impact: {
          users: ['test'],
          outcome: 'Upgrade to MCP v2 for better performance',
        },
        design_sketch: 'test',
        touch_points: ['test'],
        test_plan: ['test'],
        rollback: 'test',
      },
    ],
  };

  const errors = validateProposalsPayload(payload, [
    { url: 'https://example.com', title: 'Test', source: 'test', tags: [] },
  ]);
  assert.strictEqual(errors.length, 0, 'Should allow version numbers');
  console.log('✅ Numeric regex: allows version numbers (v2)');
}

// Test: Allows stage numbers
{
  const payload = {
    run_id: 'test',
    repo_ref: 'main',
    git_sha: 'abc123',
    generated_at: new Date().toISOString(),
    proposals: [
      {
        proposal_id: 'test-1',
        title: 'Test',
        category: 'infrastructure',
        effort_estimate: 'M',
        risk: 'low',
        evidence: ['https://example.com'],
        why_now: ['test'],
        expected_impact: {
          users: ['test'],
          outcome: 'Improve stage 2 pipeline gating',
        },
        design_sketch: 'test',
        touch_points: ['test'],
        test_plan: ['test'],
        rollback: 'test',
      },
    ],
  };

  const errors = validateProposalsPayload(payload, [
    { url: 'https://example.com', title: 'Test', source: 'test', tags: [] },
  ]);
  assert.strictEqual(errors.length, 0, 'Should allow stage numbers');
  console.log('✅ Numeric regex: allows stage numbers');
}

// Test: Rejects percentage claims
{
  const payload = {
    run_id: 'test',
    repo_ref: 'main',
    git_sha: 'abc123',
    generated_at: new Date().toISOString(),
    proposals: [
      {
        proposal_id: 'test-1',
        title: 'Test',
        category: 'performance',
        effort_estimate: 'M',
        risk: 'low',
        evidence: ['https://example.com'],
        why_now: ['test'],
        expected_impact: {
          users: ['test'],
          outcome: 'Reduce debugging time by 40%',
        },
        design_sketch: 'test',
        touch_points: ['test'],
        test_plan: ['test'],
        rollback: 'test',
      },
    ],
  };

  const errors = validateProposalsPayload(payload, [
    { url: 'https://example.com', title: 'Test', source: 'test', tags: [] },
  ]);
  assert.ok(
    errors.some((e) => e.includes('unsourced numeric claim')),
    'Should reject percentage claims'
  );
  console.log('✅ Numeric regex: rejects percentage claims (40%)');
}

// Test: Rejects multiplier claims at end of string
{
  const payload = {
    run_id: 'test',
    repo_ref: 'main',
    git_sha: 'abc123',
    generated_at: new Date().toISOString(),
    proposals: [
      {
        proposal_id: 'test-1',
        title: 'Test',
        category: 'performance',
        effort_estimate: 'M',
        risk: 'low',
        evidence: ['https://example.com'],
        why_now: ['test'],
        expected_impact: {
          users: ['test'],
          outcome: 'Make it 2x faster',
        },
        design_sketch: 'test',
        touch_points: ['test'],
        test_plan: ['test'],
        rollback: 'test',
      },
    ],
  };

  const errors = validateProposalsPayload(payload, [
    { url: 'https://example.com', title: 'Test', source: 'test', tags: [] },
  ]);
  assert.ok(
    errors.some((e) => e.includes('unsourced numeric claim')),
    'Should reject multiplier claims at end'
  );
  console.log('✅ Numeric regex: rejects multiplier claims (2x)');
}

// ============================================================================
// P0-4: Cost Calculation Transparency
// ============================================================================

console.log('\n=== Testing Cost Calculation ===\n');

// Test: Sonnet 4.5 standard pricing (≤200K)
{
  const { costUsd, metadata } = calculateCost(
    'claude-sonnet-4-5-20250929',
    100_000,
    50_000
  );

  // 100K * $3/M + 50K * $15/M = $0.30 + $0.75 = $1.05
  assert.strictEqual(costUsd, 1.05);
  assert.strictEqual(metadata.inputPricePerMToken, 3.0);
  assert.strictEqual(metadata.outputPricePerMToken, 15.0);
  assert.strictEqual(metadata.model, 'claude-sonnet-4-5-20250929');
  console.log('✅ Cost calculation: Sonnet 4.5 standard pricing');
}

// Test: Sonnet 4.5 large context pricing (>200K)
{
  const { costUsd, metadata } = calculateCost(
    'claude-sonnet-4-5-20250929',
    300_000,
    100_000
  );

  // 300K * $6/M + 100K * $22.50/M = $1.80 + $2.25 = $4.05
  assert.strictEqual(costUsd, 4.05);
  assert.strictEqual(metadata.inputPricePerMToken, 6.0);
  assert.strictEqual(metadata.outputPricePerMToken, 22.5);
  console.log('✅ Cost calculation: Sonnet 4.5 large context pricing');
}

// Test: Opus 4.5 pricing
{
  const { costUsd } = calculateCost('claude-opus-4-5-20251101', 100_000, 50_000);

  // 100K * $5/M + 50K * $25/M = $0.50 + $1.25 = $1.75
  assert.strictEqual(costUsd, 1.75);
  console.log('✅ Cost calculation: Opus 4.5 pricing');
}

// Test: Unknown model fallback
{
  const { costUsd, metadata } = calculateCost(
    'claude-unknown-model',
    100_000,
    50_000
  );

  // Should fallback to Sonnet 4.5 pricing
  assert.strictEqual(costUsd, 1.05);
  assert.strictEqual(metadata.model, 'claude-unknown-model');
  console.log('✅ Cost calculation: unknown model fallback');
}

// ============================================================================
// Test URL Normalization
// ============================================================================

console.log('\n=== Testing URL Normalization ===\n');

{
  // Test arXiv normalization
  assert.strictEqual(
    normalizeURL('http://arxiv.org/abs/2601.12345'),
    'https://arxiv.org/abs/2601.12345'
  );
  assert.strictEqual(
    normalizeURL('https://arxiv.org/pdf/2601.12345.pdf'),
    'https://arxiv.org/abs/2601.12345'
  );
  assert.strictEqual(
    normalizeURL('http://arxiv.org/abs/2601.12345v2'),
    'https://arxiv.org/abs/2601.12345'
  );
  console.log('✅ URL normalization: arXiv URLs');

  // Test trailing slash removal
  assert.strictEqual(
    normalizeURL('https://example.com/'),
    'https://example.com'
  );
  assert.strictEqual(
    normalizeURL('https://example.com/path/'),
    'https://example.com/path'
  );
  console.log('✅ URL normalization: trailing slashes');
}

console.log('\n✨ All Phase 1.2 tests passed!\n');
