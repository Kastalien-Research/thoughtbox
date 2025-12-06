/**
 * Drizzle Kit Configuration
 *
 * Used by drizzle-kit for generating migrations.
 * Run `npm run db:generate` to create migration files.
 */

import { defineConfig } from 'drizzle-kit';
import * as path from 'path';
import * as os from 'os';

// Get data directory (same logic as in db/index.ts)
const dataDir =
  process.env.THOUGHTBOX_DATA_DIR || path.join(os.homedir(), '.thoughtbox');

export default defineConfig({
  schema: './src/persistence/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: path.join(dataDir, 'thoughtbox.db'),
  },
  verbose: true,
  strict: true,
});
