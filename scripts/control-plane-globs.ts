/**
 * Shared glob constants for control-plane scripts.
 *
 * Both generate-control-plane.ts and check-control-plane.ts must use
 * identical discovery and ignore patterns to avoid spurious undeclared-suite
 * CI failures. Importing from this module makes divergence impossible.
 */

export const DISCOVER_GLOBS = [
  'src/**/__tests__/**/*.ts',
  'tests/**/*.ts',
  'agentops/tests/**/*.ts',
  'automation-self-improvement/agentops/tests/**/*.ts',
  'observability/**/*/test/**/*.ts',
];

export const IGNORE_GLOBS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/.local-stash.bak/**',
];
