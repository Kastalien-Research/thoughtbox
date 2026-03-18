import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts', 'agentops/tests/**/*.test.ts', 'demo/**/*.ts'],
    exclude: ['agentops/tests/phase1.2.test.ts'],
    // Supabase integration tests share a single DB instance and use
    // truncateAllTables() for cleanup, so files must run sequentially.
    fileParallelism: false,
  },
});
