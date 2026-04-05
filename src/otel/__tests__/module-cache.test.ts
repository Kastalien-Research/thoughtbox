import { describe, it, expect } from 'vitest';
import { ModuleCache } from '../module-cache.js';

describe('ModuleCache', () => {
  it('resolves file to correct module', () => {
    const cache = ModuleCache.fromModules([
      { name: 'knowledge', path: 'src/knowledge', dependentCount: 3 },
      { name: 'notebook', path: 'src/notebook', dependentCount: 1 },
    ]);
    expect(cache.resolveFile('src/knowledge/storage.ts')).toEqual({
      name: 'knowledge',
      dependentCount: 3,
    });
  });

  it('returns null for untracked files', () => {
    const cache = ModuleCache.fromModules([
      { name: 'knowledge', path: 'src/knowledge', dependentCount: 0 },
    ]);
    expect(cache.resolveFile('README.md')).toBeNull();
  });

  it('resolves nested files to nearest module', () => {
    const cache = ModuleCache.fromModules([
      { name: 'otel', path: 'src/otel', dependentCount: 0 },
    ]);
    expect(
      cache.resolveFile('src/otel/__tests__/parser.test.ts')?.name,
    ).toBe('otel');
  });

  it('handles absolute paths by stripping project root', () => {
    const cache = ModuleCache.fromModules(
      [{ name: 'knowledge', path: 'src/knowledge', dependentCount: 0 }],
      '/home/user/project',
    );
    expect(
      cache.resolveFile('/home/user/project/src/knowledge/types.ts')
        ?.name,
    ).toBe('knowledge');
  });

  it('matches exact module path', () => {
    const cache = ModuleCache.fromModules([
      { name: 'auth', path: 'src/auth', dependentCount: 2 },
    ]);
    expect(cache.resolveFile('src/auth')?.name).toBe('auth');
  });

  it('does not match partial path prefixes', () => {
    const cache = ModuleCache.fromModules([
      { name: 'auth', path: 'src/auth', dependentCount: 0 },
    ]);
    // 'src/authorize' should NOT match 'src/auth'
    expect(cache.resolveFile('src/authorize/handler.ts')).toBeNull();
  });
});
