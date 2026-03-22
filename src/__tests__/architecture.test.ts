/**
 * Architectural constraint tests.
 *
 * These tests enforce structural invariants that prevent drift.
 * If a test here fails, it means code was added that violates
 * an architectural boundary — fix the code, not the test.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '..');

function getTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__tests__') {
      files.push(...getTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('architectural constraints', () => {
  const srcFiles = getTsFiles(SRC_DIR);

  it('only storage classes and the wiring root import SupabaseClient', () => {
    // Known violations — tech debt, not exemptions.
    // Remove from this list as each file is fixed.
    const knownDebt = new Set([
      'protocol/handler.ts', // thoughtbox-kcv: needs ProtocolStorage interface
      'auth/api-key.ts',     // uses SupabaseClient for API key validation
    ]);

    const allowed = (file: string): boolean => {
      const base = path.basename(file);
      const rel = path.relative(SRC_DIR, file);
      return (
        knownDebt.has(rel) ||
        base.includes('storage') ||
        base.startsWith('supabase-') ||
        base === 'database.types.ts' ||
        rel === 'server-factory.ts'
      );
    };

    const violations: string[] = [];

    for (const file of srcFiles) {
      if (allowed(file)) continue;
      const content = fs.readFileSync(file, 'utf-8');
      if (
        content.includes('SupabaseClient') ||
        /from\s+['"]@supabase\/supabase-js['"]/.test(content)
      ) {
        violations.push(path.relative(SRC_DIR, file));
      }
    }

    expect(
      violations,
      `These files import SupabaseClient directly instead of using a Storage interface:\n  ${violations.join('\n  ')}\n\nFix: use a Storage interface, or move Supabase access into a *Storage class.`,
    ).toEqual([]);
  });
});
