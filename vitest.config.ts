import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/__tests__/**/*.test.ts',
      'automation-self-improvement/agentops/tests/**/*.test.ts',
      'demo/**/*.ts',
    ],
    exclude: [
      'automation-self-improvement/agentops/tests/phase1.2.test.ts',
      'automation-self-improvement/agentops/tests/integration.test.ts',
    ],
    // Supabase integration tests share a single DB instance and use
    // truncateAllTables() for cleanup, so files must run sequentially.
    fileParallelism: false,
  },
});
