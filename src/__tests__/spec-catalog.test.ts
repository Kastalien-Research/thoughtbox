/**
 * Cross-Cutting — CATALOG migration file validators
 *
 * Validators (from VALIDATORS.md):
 * - CC.4: Each schema-touching spec has corresponding migration file.
 *         Filename pattern check: `rg -l 'spec0(3|6|8|9|10)' db/migrations/` returns at least 5 paths.
 *
 * NOTE: Migration files may not exist yet — this test will fail with a clear
 * message pointing to the missing spec numbers.
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// CC.4: Schema-touching specs have migration files
// ---------------------------------------------------------------------------

describe('CC.4 — Schema-touching specs have corresponding migration files', () => {
  it('db/migrations/ contains at least 5 migration files matching spec0(3|6|8|9|10)', () => {
    /**
     * Check: Each schema-touching spec has a corresponding migration file.
     *
     * Schema-touching specs (from VALIDATORS.md):
     * - Spec 03 (V3.7 EXPLAIN, V3.9 catalog) — recall primitives, search
     * - Spec 06 — thought type additions
     * - Spec 08 — metadata fields
     * - Spec 09 — checkpoint metadata
     * - Spec 10 — belief/assumption schema
     *
     * Pass: `rg -l 'spec0(3|6|8|9|10)' db/migrations/` returns at least 5 paths.
     */

    // Search for migration files in db/migrations/ and supabase/migrations/
    const migrationDirs = ['db/migrations', 'supabase/migrations'];

    let foundPaths: string[] = [];
    let checkedDirs: string[] = [];

    for (const dir of migrationDirs) {
      try {
        const rgOutput = execSync(
          `rg -l 'spec0(3|6|8|9|10)' ${dir}/ 2>/dev/null || true`,
          { encoding: 'utf-8', cwd: process.cwd() },
        );
        const paths = rgOutput.trim().split('\n').filter(Boolean);
        if (paths.length > 0) {
          foundPaths.push(...paths);
        }
        checkedDirs.push(dir);
      } catch {
        // Directory may not exist - that's ok, we'll check others
        checkedDirs.push(dir);
      }
    }

    // If no migration files found at all, the dirs may not exist yet
    if (foundPaths.length === 0) {
      const message = [
        `CC.4 FAIL: No migration files found matching spec0(3|6|8|9|10) pattern.`,
        `Checked directories: ${checkedDirs.join(', ') || 'none'}`,
        `Schema-touching specs without migrations: 03, 06, 08, 09, 10`,
        ``,
        `ACTION REQUIRED: Create migration files for the above specs in:`,
        `- db/migrations/ (Postgres migrations)`,
        `- supabase/migrations/ (Supabase migrations)`,
        ``,
        `At least 5 matching migration files are required.`,
      ].join('\n');

      // Fail with a helpful message
      expect(foundPaths.length, message).toBeGreaterThanOrEqual(5);
      return;
    }

    expect(
      foundPaths.length,
      `Expected at least 5 migration files matching spec0(3|6|8|9|10), found ${foundPaths.length}: ${foundPaths.join(', ')}`,
    ).toBeGreaterThanOrEqual(5);
  });

  it('each schema-touching spec (03, 06, 08, 09, 10) has at least one migration', () => {
    /**
     * Check: Each schema-touching spec has at least one migration file.
     *
     * Pass: For each spec 03, 06, 08, 09, 10, there is at least one
     * migration file referencing it.
     */

    const schemaSpecs = ['03', '06', '08', '09', '10'];
    const migrationDirs = ['db/migrations', 'supabase/migrations'];

    const missing: string[] = [];

    for (const specNum of schemaSpecs) {
      let found = false;
      for (const dir of migrationDirs) {
        try {
          const rgOutput = execSync(
            `rg -l 'spec[_-]?${specNum}|spec0${specNum}' ${dir}/ 2>/dev/null || true`,
            { encoding: 'utf-8', cwd: process.cwd() },
          );
          if (rgOutput.trim().split('\n').filter(Boolean).length > 0) {
            found = true;
            break;
          }
        } catch {
          // Continue to next directory
        }
      }

      if (!found) {
        missing.push(specNum);
      }
    }

    expect(
      missing.length,
      `Schema-touching specs missing migration files: ${missing.join(', ')}. ` +
      `Create migrations for specs: ${missing.join(', ')} in db/migrations/ or supabase/migrations/`,
    ).toBe(0);
  });
});
