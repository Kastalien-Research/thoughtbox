/**
 * SQLite Schema Definition (Drizzle ORM)
 *
 * Defines the database schema for Thoughtbox persistence.
 * SQLite stores queryable metadata; actual content lives in JSON files.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// =============================================================================
// Config Table
// =============================================================================

/**
 * Server configuration (single row table)
 *
 * Stores installation-specific settings that persist across restarts.
 */
export const config = sqliteTable('config', {
  installId: text('install_id').primaryKey(),
  dataDir: text('data_dir').notNull(),
  disableThoughtLogging: integer('disable_thought_logging', {
    mode: 'boolean',
  })
    .notNull()
    .default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// =============================================================================
// Sessions Table
// =============================================================================

/**
 * Session index for quick listing and search
 *
 * Each session represents one reasoning chain (thought 1 → N).
 * Actual thoughts are stored as JSON files in the filesystem.
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  tags: text('tags').notNull().default('[]'), // JSON array
  thoughtCount: integer('thought_count').notNull().default(0),
  branchCount: integer('branch_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// =============================================================================
// Notebooks Table (Future Use)
// =============================================================================

/**
 * Notebook index for quick listing
 *
 * Prepared for future notebook persistence migration.
 * Currently notebooks use temp files in /tmp.
 */
export const notebooks = sqliteTable('notebooks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  language: text('language').notNull().default('typescript'),
  cellCount: integer('cell_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// =============================================================================
// Type Inference
// =============================================================================

export type ConfigRow = typeof config.$inferSelect;
export type ConfigInsert = typeof config.$inferInsert;

export type SessionRow = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;

export type NotebookRow = typeof notebooks.$inferSelect;
export type NotebookInsert = typeof notebooks.$inferInsert;
