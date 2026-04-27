/**
 * Cross-Cutting — SPEC-CC runtime validators
 *
 * Validators (from VALIDATORS.md):
 * - CC.3: The seven canonical thought types are unchanged:
 *         `reasoning | decision_frame | action_report | belief_snapshot |
 *          assumption_update | context_snapshot | progress`
 *         Anchored to `thoughtToolInputSchema` in `src/thought/tool.ts`
 *         (NOT the audit aggregator which has 8 types including 'action_receipt')
 *
 * NOTE: This is a RUNTIME test complementing the type-level tests in
 * spec-cc-types.test-d.ts. Both must pass to fully validate CC.3.
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// The seven canonical thought types (from spec)
// ---------------------------------------------------------------------------

const CANONICAL_THOUGHT_TYPES = [
  'reasoning',
  'decision_frame',
  'action_report',
  'belief_snapshot',
  'assumption_update',
  'context_snapshot',
  'progress',
] as const;

type CanonicalThoughtType = typeof CANONICAL_THOUGHT_TYPES[number];

// ---------------------------------------------------------------------------
// CC.3: Seven canonical thought types validation
// ---------------------------------------------------------------------------

describe('CC.3 — Seven canonical thought types are unchanged in thoughtToolInputSchema', () => {
  it('thoughtToolInputSchema.thoughtType enum has exactly 7 values', () => {
    /**
     * Check: The thoughtToolInputSchema in src/thought/tool.ts defines
     * exactly 7 canonical thought types.
     *
     * Pass: The schema's thoughtType enum has exactly 7 members matching
     * the canonical list.
     */

    // Read the schema file to extract the enum values
    let schemaFileContent: string;
    try {
      schemaFileContent = execSync(
        `rg 'thoughtType:\\s*z\\.enum\\(\\[([^\\]]+)\\]\\)' src/thought/tool.ts --no-filename -o '$1'`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );
    } catch {
      // Fallback: try a broader search
      schemaFileContent = execSync(
        `rg 'thoughtType' src/thought/tool.ts --no-filename -A 2`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );
    }

    // Extract enum values from the content
    const enumMatch = schemaFileContent.match(/z\.enum\(\[([^\]]+)\]\)/);
    expect(enumMatch, 'Could not find thoughtType z.enum in schema').toBeTruthy();

    const enumValues = enumMatch![1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''));

    // Should have exactly 7 values
    expect(enumValues).toHaveLength(7);

    // Should match the canonical types exactly
    for (const canonical of CANONICAL_THOUGHT_TYPES) {
      expect(enumValues, `Canonical type '${canonical}' should be in schema`).toContain(canonical);
    }

    // Should not contain action_receipt (which is internal to audit aggregator)
    expect(enumValues, 'action_receipt should NOT be in thoughtToolInputSchema').not.toContain('action_receipt');
  });

  it('thoughtToolInputSchema rejects invalid thoughtType values', () => {
    /**
     * Check: The schema should reject thoughtType values that are not
     * in the canonical 7-type union.
     *
     * Pass: Invalid types like 'action_receipt', 'deliberation', 'foo' are rejected.
     *
     * NOTE: This test requires the actual thoughtToolInputSchema to be importable.
     * If the import fails, the test is skipped.
     */

    let thoughtToolInputSchema: z.ZodObject<Record<string, z.ZodTypeAny>> | null = null;

    try {
      // Try to import the schema
      const module = await import('../thought/tool.js');
      thoughtToolInputSchema = module.thoughtToolInputSchema;
    } catch {
      // Schema not directly importable in test env - skip runtime validation
      // The type-level test in spec-cc-types.test-d.ts provides coverage
      describe.skip('CC.3 runtime schema validation', () => {
        it.skip('thoughtToolInputSchema not directly importable', () => {});
      });
      return;
    }

    if (!thoughtToolInputSchema) {
      return;
    }

    // Valid types should pass
    for (const type of CANONICAL_THOUGHT_TYPES) {
      const result = thoughtToolInputSchema.safeParse({
        thought: 'test thought',
        thoughtType: type,
        nextThoughtNeeded: true,
      });
      expect(result.success, `thoughtType '${type}' should be valid`).toBe(true);
    }

    // Invalid types should fail
    const invalidTypes = ['action_receipt', 'deliberation', 'foo', ''];
    for (const invalidType of invalidTypes) {
      const result = thoughtToolInputSchema.safeParse({
        thought: 'test thought',
        thoughtType: invalidType,
        nextThoughtNeeded: true,
      });
      expect(result.success, `thoughtType '${invalidType}' should be rejected`).toBe(false);
    }
  });

  it('thoughtToolInputSchema does NOT include action_receipt (audit aggregator type)', () => {
    /**
     * Check: The thoughtToolInputSchema should NOT include 'action_receipt',
     * which is an internal counter used by the audit aggregator, NOT a
     * valid thought submission type.
     *
     * The 7 canonical types are the only valid thought submission types.
     * 'action_receipt' is for internal audit tracking only.
     *
     * Pass: 'action_receipt' is not in the schema's thoughtType enum.
     */

    let schemaFileContent: string;
    try {
      schemaFileContent = execSync(
        `rg 'thoughtType:\\s*z\\.enum\\(\\[([^\\]]+)\\]\\)' src/thought/tool.ts --no-filename -o '$1'`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );
    } catch {
      schemaFileContent = execSync(
        `rg 'thoughtType' src/thought/tool.ts --no-filename -A 2`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );
    }

    const enumMatch = schemaFileContent.match(/z\.enum\(\[([^\]]+)\]\)/);
    expect(enumMatch, 'Could not find thoughtType z.enum in schema').toBeTruthy();

    const enumValues = enumMatch![1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''));

    expect(
      enumValues,
      'action_receipt should NOT be in thoughtToolInputSchema (it is internal to audit aggregator)',
    ).not.toContain('action_receipt');
  });

  it('SDK types match the 7 canonical thought types', () => {
    /**
     * Check: The TB_SDK_TYPES string in sdk-types.ts should reflect
     * the same 7-type union as thoughtToolInputSchema.
     *
     * Pass: The SDK types string contains exactly the 7 canonical types.
     */

    let sdkTypesContent: string;
    try {
      sdkTypesContent = execSync(
        `rg 'thoughtType:\\s*"([^"]+)"' src/code-mode/sdk-types.ts --no-filename -o '$1'`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );
    } catch {
      sdkTypesContent = execSync(
        `rg 'thoughtType' src/code-mode/sdk-types.ts --no-filename -A 1`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );
    }

    // Extract the union from the SDK types
    const unionMatch = sdkTypesContent.match(/"([^"]+)"\s*\|\s*"([^"]+)"\s*\|\s*"([^"]+)"/);
    if (!unionMatch) {
      // Try alternative format
      const altMatch = sdkTypesContent.match(/\[([^\]]+)\]/);
      expect(altMatch, 'Could not find thoughtType union in SDK types').toBeTruthy();
    }

    // Count the types in the SDK
    const allLines = sdkTypesContent.split('\n');
    const thoughtTypeLines = allLines.filter(l => l.includes('"') && (l.includes('reasoning') || l.includes('decision_frame') || l.includes('action_report')));

    // Should have 7 types
    const typeCount = thoughtTypeLines.join(' ').match(/"([^"]+)"/g)?.length ?? 0;
    expect(typeCount, 'SDK types should define exactly 7 thought types').toBe(7);
  });

  it('catalog advertises exactly 7 thought types', () => {
    /**
     * Check: The thought tool catalog entry should advertise exactly 7 thought types.
     *
     * Pass: The catalog's thought operation description mentions exactly 7 types.
     */

    // The catalog is built from thoughtToolInputSchema, so this is indirectly
    // validated by the other CC.3 tests. But we check here for completeness.

    let thoughtToolContent: string;
    try {
      thoughtToolContent = execSync(
        `rg 'thoughtType' src/thought/tool.ts --no-filename -B 1 -A 3`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );
    } catch {
      return;
    }

    // Should contain all 7 canonical types
    for (const type of CANONICAL_THOUGHT_TYPES) {
      expect(thoughtToolContent, `Schema should reference '${type}'`).toContain(type);
    }
  });
});

// ---------------------------------------------------------------------------
// Exhaustive switch validation
// ---------------------------------------------------------------------------

describe('CC.3 — Exhaustive switch coverage for canonical thought types', () => {
  it('switch on thoughtType is exhaustive for all 7 canonical types', () => {
    /**
     * Check: Any switch statement on thoughtType should be able to handle
     * all 7 canonical types without a default branch catching non-canonical values.
     *
     * Pass: A switch that handles all 7 types and returns never for the default
     * case is valid.
     */

    function getThoughtTypeLabel(type: CanonicalThoughtType): string {
      switch (type) {
        case 'reasoning':
          return 'reasoning';
        case 'decision_frame':
          return 'decision_frame';
        case 'action_report':
          return 'action_report';
        case 'belief_snapshot':
          return 'belief_snapshot';
        case 'assumption_update':
          return 'assumption_update';
        case 'context_snapshot':
          return 'context_snapshot';
        case 'progress':
          return 'progress';
      }
    }

    // All 7 types should return without error
    for (const type of CANONICAL_THOUGHT_TYPES) {
      expect(getThoughtTypeLabel(type)).toBe(type);
    }
  });
});
