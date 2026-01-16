import type { IndexSource } from '../interfaces.js';
import type { SessionMetadata } from '../types.js';
import type { SessionExport } from '../../persistence/types.js';

/**
 * In-memory implementation of IndexSource for migration/testing.
 * Always returns an empty list for now.
 */
export class InMemoryIndexSource implements IndexSource {
  async initialize(): Promise<void> {
    // No-op
  }

  async listExports(): Promise<string[]> {
    return [];
  }

  async loadExport(identifier: string): Promise<SessionExport> {
    throw new Error('No exports available in InMemoryIndexSource');
  }

  async getExportTimestamp(identifier: string): Promise<string | null> {
    return null;
  }

  async close(): Promise<void> {
    // No-op
  }

  async fetchSessions(): Promise<SessionMetadata[]> {
    return [];
  }
}
