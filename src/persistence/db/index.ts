/**
 * SQLite Database Connection
 *
 * Provides a singleton database connection with proper configuration
 * for Thoughtbox persistence.
 */

import Database, { type Database as SQLiteDatabase } from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// =============================================================================
// Data Directory
// =============================================================================

/**
 * Get the data directory path from environment or default
 */
export function getDataDir(): string {
  return (
    process.env.THOUGHTBOX_DATA_DIR || path.join(os.homedir(), '.thoughtbox')
  );
}

// =============================================================================
// Database Connection
// =============================================================================

export interface DatabaseInstance {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: SQLiteDatabase;
  dbPath: string;
  dataDir: string;
}

/**
 * Create a new database connection
 *
 * @param dataDir - Optional data directory override
 * @returns Database instance with Drizzle ORM
 */
export function createDatabase(dataDir?: string): DatabaseInstance {
  const dir = dataDir || getDataDir();

  // Ensure directory exists
  fs.mkdirSync(dir, { recursive: true });

  const dbPath = path.join(dir, 'thoughtbox.db');
  const sqlite = new Database(dbPath);

  // Enable foreign keys for referential integrity
  sqlite.pragma('foreign_keys = ON');

  // Enable WAL mode for better concurrency
  // This allows multiple readers while writing
  sqlite.pragma('journal_mode = WAL');

  // Create Drizzle ORM instance
  const db = drizzle(sqlite, { schema });

  return { db, sqlite, dbPath, dataDir: dir };
}

// =============================================================================
// Singleton Instance
// =============================================================================

let _instance: DatabaseInstance | null = null;

/**
 * Get the singleton database instance
 *
 * Creates the database connection on first call and reuses it thereafter.
 */
export function getDatabase(dataDir?: string): DatabaseInstance {
  if (!_instance) {
    _instance = createDatabase(dataDir);
  }
  return _instance;
}

/**
 * Close the database connection
 *
 * Should be called during graceful shutdown.
 */
export function closeDatabase(): void {
  if (_instance) {
    _instance.sqlite.close();
    _instance = null;
  }
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetDatabase(): void {
  closeDatabase();
}

// Re-export schema for convenience
export { schema };
