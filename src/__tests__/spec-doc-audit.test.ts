/**
 * Cross-Cutting — DOC-AUDIT validators
 *
 * Validators (from VALIDATORS.md):
 * - V1.4: No doc or example sets `thoughtNumber: 1` (or any literal) on a thought submission.
 *         `rg -n 'thoughtNumber\s*:\s*\d+'` returns zero matches outside allowlist
 *         (exclude `**/__tests__/**` and `**/spec-01*`)
 * - V9.8: Discouragement of `searchWithin('Checkpoint:')` —
 *         `rg -n "searchWithin\(['\"]Checkpoint:" tests/ docs/` returns zero matches
 *
 * These tests use ripgrep (rg) to audit documentation and examples.
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// V1.4: No thoughtNumber literals in docs/examples
// ---------------------------------------------------------------------------

describe('V1.4 — No thoughtNumber literals in documentation/examples', () => {
  it('thoughtNumber: <number> does not appear in docs/ or examples/ outside allowlist', () => {
    /**
     * Check: No doc or example sets `thoughtNumber: 1` (or any literal) on a thought submission.
     *
     * Allowlist:
     * - `**/__tests__/**` — test files may contain thoughtNumber
     * - `**/spec-01*` — spec-01 tests and handlers are excluded
     *
     * Pass: `rg -n 'thoughtNumber\s*:\s*\d+'` in docs/ and examples/ returns zero matches.
     */

    const searchDirs = ['docs', 'examples', 'apps/web/user-docs'];

    for (const dir of searchDirs) {
      try {
        execSync(`test -d ${dir}`, { cwd: process.cwd() });
      } catch {
        // Directory doesn't exist, skip it
        continue;
      }

      // Search for thoughtNumber: <digit> patterns
      // Exclude test files and spec-01 files
      const rgOutput = execSync(
        `rg -n 'thoughtNumber\\s*:\\s*\\d+' ${dir}/ ` +
        `--glob '!**/__tests__/**' ` +
        `--glob '!**/spec-01*' ` +
        `2>/dev/null || true`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );

      const matches = rgOutput.trim().split('\n').filter(Boolean);

      expect(
        matches.length,
        `V1.4 FAIL: Found ${matches.length} thoughtNumber literal(s) in '${dir}/' ` +
        `outside allowlist:\n${matches.slice(0, 5).join('\n')}${matches.length > 5 ? '\n...' : ''}`,
      ).toBe(0);
    }
  });

  it('thoughtNumber is not documented as a user-facing parameter in docs/', () => {
    /**
     * Check: The `thoughtNumber` parameter should not be documented as a
     * user-facing/encouraged parameter in user documentation.
     *
     * Pass: docs/ files do not contain 'thoughtNumber' as a documented parameter
     * in user-facing guides.
     */

    const docDirs = ['docs', 'apps/web/user-docs'];

    for (const dir of docDirs) {
      try {
        execSync(`test -d ${dir}`, { cwd: process.cwd() });
      } catch {
        continue;
      }

      // Check if thoughtNumber appears in documentation
      const rgOutput = execSync(
        `rg -n 'thoughtNumber' ${dir}/ ` +
        `--glob '!**/__tests__/**' ` +
        `--glob '!**/spec-01*' ` +
        `--glob '!*.test.*' ` +
        `2>/dev/null || true`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );

      const matches = rgOutput.trim().split('\n').filter(Boolean);

      if (matches.length > 0) {
        // Found thoughtNumber references - check if they're in discouraged contexts
        // Filter for lines that look like parameter documentation
        const docMatches = matches.filter(line => {
          // Skip comments explaining it's deprecated/internal
          if (line.includes('deprecated') || line.includes('internal') || line.includes('NOTE')) {
            return false;
          }
          // Skip lines in test files (shouldn't happen due to glob but be safe)
          if (line.includes('__tests__') || line.includes('.test.')) {
            return false;
          }
          return true;
        });

        expect(
          docMatches.length,
          `V1.4 FAIL: thoughtNumber appears in user docs outside of deprecation notices:\n` +
          `${docMatches.slice(0, 5).join('\n')}`,
        ).toBe(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// V9.8: Discouragement of searchWithin('Checkpoint:') pattern
// ---------------------------------------------------------------------------

describe('V9.8 — Discouragement of searchWithin("Checkpoint:") pattern', () => {
  it('searchWithin("Checkpoint:") does not appear in tests/ or docs/', () => {
    /**
     * Check: Discouragement of `searchWithin('Checkpoint:')` pattern.
     *
     * The correct approach for checkpoint retrieval is via the checkpoint RPC
     * (session_get_checkpoint, session_checkpoints, etc.), NOT using searchWithin
     * with a "Checkpoint:" prefix search.
     *
     * Pass: `rg -n "searchWithin\(['\"]Checkpoint:" tests/ docs/` returns zero matches.
     */

    const searchDirs = ['tests', 'docs', 'apps/web/user-docs'];

    for (const dir of searchDirs) {
      try {
        execSync(`test -d ${dir}`, { cwd: process.cwd() });
      } catch {
        continue;
      }

      // Search for searchWithin('Checkpoint:') or searchWithin("Checkpoint:")
      const rgOutput = execSync(
        `rg -n 'searchWithin\\([\'"]Checkpoint:' ${dir}/ ` +
        `--glob '!**/__tests__/**' ` +
        `--glob '!**/spec-01*' ` +
        `2>/dev/null || true`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );

      const matches = rgOutput.trim().split('\n').filter(Boolean);

      expect(
        matches.length,
        `V9.8 FAIL: Found ${matches.length} discouraged searchWithin('Checkpoint:') ` +
        `call(s) in '${dir}/':\n${matches.slice(0, 5).join('\n')}${matches.length > 5 ? '\n...' : ''}\n\n` +
        `Use checkpoint RPC methods (session_get_checkpoint, session_checkpoints, etc.) instead.`,
      ).toBe(0);
    }
  });

  it('checkpoint retrieval examples use proper RPC methods, not search', () => {
    /**
     * Check: Examples in docs/ showing checkpoint retrieval should use
     * the proper RPC methods (session_checkpoints, session_get_checkpoint, etc.),
     * not searchWithin.
     *
     * Pass: No docs show searchWithin being used for checkpoint retrieval.
     */

    const docDirs = ['docs', 'apps/web/user-docs', 'examples'];

    for (const dir of docDirs) {
      try {
        execSync(`test -d ${dir}`, { cwd: process.cwd() });
      } catch {
        continue;
      }

      // Look for any checkpoint-related docs that might misuse searchWithin
      const rgOutput = execSync(
        `rg -n -i 'checkpoint' ${dir}/ ` +
        `--glob '!*.test.*' ` +
        `--glob '!**/__tests__/**' ` +
        `2>/dev/null || true`,
        { encoding: 'utf-8', cwd: process.cwd() },
      );

      const checkpointLines = rgOutput.trim().split('\n').filter(Boolean);

      // Filter for lines that also contain searchWithin
      const badLines = checkpointLines.filter(line => {
        return line.toLowerCase().includes('searchwithin') ||
               line.toLowerCase().includes('search_within');
      });

      expect(
        badLines.length,
        `V9.8 FAIL: Found ${badLines.length} checkpoint docs that may misuse searchWithin:\n` +
        `${badLines.slice(0, 5).join('\n')}`,
      ).toBe(0);
    }
  });
});
