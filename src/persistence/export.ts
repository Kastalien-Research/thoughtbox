/**
 * Session Export Module
 *
 * Handles exporting reasoning sessions to the filesystem as linked JSON structures.
 * Export location: ~/.thoughtbox/exports/
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { SessionExport } from './types.js';

/**
 * Exports reasoning sessions to the filesystem
 */
export class SessionExporter {
  private defaultDir: string;

  constructor() {
    this.defaultDir = path.join(os.homedir(), '.thoughtbox', 'exports');
  }

  /**
   * Ensure export directory exists
   */
  async ensureExportDir(dir?: string): Promise<string> {
    const targetDir = dir || this.defaultDir;
    await fs.promises.mkdir(targetDir, { recursive: true });
    return targetDir;
  }

  /**
   * Generate export filename with timestamp
   * Format: {sessionId}-{timestamp}.json
   */
  generateFilename(sessionId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${sessionId}-${timestamp}.json`;
  }

  /**
   * Export session data to filesystem
   * @returns The full path to the exported file
   */
  async export(
    data: SessionExport,
    sessionId: string,
    destination?: string
  ): Promise<string> {
    const dir = await this.ensureExportDir(destination);
    const filename = this.generateFilename(sessionId);
    const filepath = path.join(dir, filename);

    await fs.promises.writeFile(
      filepath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );

    return filepath;
  }

  /**
   * Get the default export directory path
   */
  getDefaultDir(): string {
    return this.defaultDir;
  }
}
