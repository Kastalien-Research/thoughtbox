/**
 * Filesystem Index Source
 *
 * Implements IndexSource interface for local filesystem backend.
 * Reads session exports from ~/.thoughtbox/exports/ directory.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import type { SessionExport } from '../../persistence/types.js';
import type { IndexSource } from '../interfaces.js';

/**
 * Configuration options for FileSystemIndexSource
 */
export interface FileSystemIndexSourceOptions {
  /**
   * Directory containing session export files
   * Default: ~/.thoughtbox/exports/
   */
  exportsDir?: string;

  /**
   * Maximum file size in bytes to parse (prevents OOM on huge files)
   * Default: 10MB
   */
  maxFileSizeBytes?: number;

  /**
   * File extension for export files
   * Default: .json
   */
  fileExtension?: string;
}

/**
 * Filesystem-backed index source for local deployments
 *
 * Scans a directory for session export JSON files and provides
 * them to the index builder.
 *
 * Usage:
 * ```typescript
 * // Default directory (~/.thoughtbox/exports/)
 * const source = new FileSystemIndexSource();
 *
 * // Custom directory
 * const source = new FileSystemIndexSource({
 *   exportsDir: '/path/to/exports'
 * });
 * ```
 */
export class FileSystemIndexSource implements IndexSource {
  private options: Required<FileSystemIndexSourceOptions>;
  private exportsDir: string;
  private initialized: boolean = false;

  constructor(options: FileSystemIndexSourceOptions = {}) {
    const defaultExportsDir = path.join(homedir(), '.thoughtbox', 'exports');

    this.options = {
      exportsDir: options.exportsDir ?? defaultExportsDir,
      maxFileSizeBytes: options.maxFileSizeBytes ?? 10 * 1024 * 1024, // 10MB
      fileExtension: options.fileExtension ?? '.json',
    };

    this.exportsDir = this.options.exportsDir;
  }

  /**
   * Initialize the source - verify exports directory exists
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure exports directory exists
      await fs.mkdir(this.exportsDir, { recursive: true });

      // Verify we can read the directory
      await fs.readdir(this.exportsDir);

      this.initialized = true;
    } catch (err) {
      throw new Error(
        `FileSystemIndexSource: Failed to initialize exports directory: ${(err as Error).message}`
      );
    }
  }

  /**
   * List all session export file paths
   */
  async listExports(): Promise<string[]> {
    this.ensureInitialized();

    const files: string[] = [];

    try {
      const entries = await fs.readdir(this.exportsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(this.options.fileExtension)) {
          files.push(path.join(this.exportsDir, entry.name));
        }
      }
    } catch (err) {
      throw new Error(
        `FileSystemIndexSource: Failed to list exports: ${(err as Error).message}`
      );
    }

    // Sort by modification time (newest first)
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const stat = await fs.stat(file);
        return { file, mtime: stat.mtime.getTime() };
      })
    );

    fileStats.sort((a, b) => b.mtime - a.mtime);

    return fileStats.map((f) => f.file);
  }

  /**
   * Load a session export from a file path
   */
  async loadExport(filePath: string): Promise<SessionExport> {
    this.ensureInitialized();

    try {
      // Check file size
      const stat = await fs.stat(filePath);
      if (stat.size > this.options.maxFileSizeBytes) {
        throw new Error(
          `File too large (${stat.size} bytes). Maximum: ${this.options.maxFileSizeBytes} bytes`
        );
      }

      // Read and parse
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as SessionExport;

      // Basic validation
      if (!data.version || !data.session || !Array.isArray(data.nodes)) {
        throw new Error('Invalid session export format');
      }

      // Convert date strings to Date objects
      if (data.session.createdAt && typeof data.session.createdAt === 'string') {
        data.session.createdAt = new Date(data.session.createdAt);
      }
      if (data.session.updatedAt && typeof data.session.updatedAt === 'string') {
        data.session.updatedAt = new Date(data.session.updatedAt);
      }
      if (data.session.lastAccessedAt && typeof data.session.lastAccessedAt === 'string') {
        data.session.lastAccessedAt = new Date(data.session.lastAccessedAt);
      }

      return data;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Export file not found: ${filePath}`);
      }
      throw new Error(
        `FileSystemIndexSource: Failed to load export ${filePath}: ${(err as Error).message}`
      );
    }
  }

  /**
   * Get the last modified timestamp for an export file
   */
  async getExportTimestamp(filePath: string): Promise<string | null> {
    this.ensureInitialized();

    try {
      const stat = await fs.stat(filePath);
      return stat.mtime.toISOString();
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(
        `FileSystemIndexSource: Failed to get timestamp for ${filePath}: ${(err as Error).message}`
      );
    }
  }

  /**
   * Close the source (no-op for filesystem)
   */
  async close(): Promise<void> {
    // No-op - filesystem doesn't need cleanup
  }

  /**
   * Ensure the source has been initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'FileSystemIndexSource not initialized. Call initialize() first.'
      );
    }
  }
}
