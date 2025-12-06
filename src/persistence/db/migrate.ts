/**
 * Database Migration Runner
 *
 * Runs Drizzle ORM migrations to set up the database schema.
 * Can be run via `npm run db:migrate` or programmatically.
 */

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDatabase } from './index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migrations
 *
 * Applies all pending migrations from the drizzle directory.
 * Safe to run multiple times - only applies new migrations.
 *
 * @param dataDir - Optional data directory override
 */
export async function runMigrations(dataDir?: string): Promise<void> {
  const { db } = getDatabase(dataDir);

  // Resolve migrations folder relative to project root
  // In development: src/persistence/db/migrate.ts -> ../../drizzle
  // In production: dist/persistence/db/migrate.js -> ../../drizzle
  const migrationsFolder = path.resolve(__dirname, '../../../drizzle');

  // Check if migrations folder exists
  if (!fs.existsSync(migrationsFolder)) {
    console.error(
      `Migrations folder not found at: ${migrationsFolder}. Run 'npm run db:generate' first.`
    );
    // Create empty folder to prevent errors on first run
    fs.mkdirSync(migrationsFolder, { recursive: true });
    console.error('Created empty migrations folder. Skipping migrations.');
    return;
  }

  console.error('Running migrations from:', migrationsFolder);

  try {
    migrate(db, { migrationsFolder });
    console.error('Migrations complete!');
  } catch (error) {
    // Handle case where migrations folder is empty
    if (
      error instanceof Error &&
      error.message.includes('No migration files found')
    ) {
      console.error(
        'No migration files found. Run "npm run db:generate" to create migrations.'
      );
      return;
    }
    throw error;
  }
}

// =============================================================================
// CLI Entry Point
// =============================================================================

/**
 * Run migrations when executed directly via CLI
 */
async function main() {
  try {
    await runMigrations();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
