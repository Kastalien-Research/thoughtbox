import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/__tests__/**/*.test.ts',
      'scripts/**/__tests__/**/*.test.ts',
      'demo/**/*.ts',
    ],
    // Supabase integration tests share a single DB instance and use
    // truncateAllTables() for cleanup, so files must run sequentially.
    fileParallelism: false,
  },
});
