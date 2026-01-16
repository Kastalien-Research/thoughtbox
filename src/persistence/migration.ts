/**
 * Migration Module
 *
 * Migrates existing SessionExport files from ~/.thoughtbox/exports/
 * to the new FileSystemStorage directory structure.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type {
  SessionExport,
  SessionManifest,
  ThoughtNode,
  TimePartitionGranularity,
} from './types.js';

export interface MigrationResult {
  /** Number of sessions successfully migrated */
  migrated: number;
  /** Number of sessions skipped (already exist or invalid) */
  skipped: number;
  /** Number of sessions that failed to migrate */
  failed: number;
  /** Details for each session */
  details: MigrationSessionDetail[];
}

export interface MigrationSessionDetail {
  /** Original export filename */
  sourceFile: string;
  /** Session ID */
  sessionId: string;
  /** Status of migration */
  status: 'migrated' | 'skipped' | 'failed';
  /** Reason for skip or failure */
  reason?: string;
  /** New session directory path (if migrated) */
  destinationPath?: string;
}

export interface MigrationOptions {
  /** Source directory for exports (default: ~/.thoughtbox/exports/) */
  sourceDir?: string;
  /** Destination base directory (default: ~/.thoughtbox/sessions/) */
  destDir?: string;
  /** Time partition granularity (default: 'monthly') */
  partitionGranularity?: TimePartitionGranularity;
  /** Delete source files after successful migration (default: false) */
  deleteAfterMigration?: boolean;
  /** Skip sessions that already exist (default: true) */
  skipExisting?: boolean;
  /** Dry run - don't actually write files (default: false) */
  dryRun?: boolean;
}

/**
 * Migrates SessionExport files to the new directory-based format.
 *
 * Source format (old):
 *   ~/.thoughtbox/exports/{sessionId}-{timestamp}.json
 *   Contains: SessionExport { version, session, nodes[], exportedAt }
 *
 * Destination format (new):
 *   ~/.thoughtbox/sessions/{partition}/{sessionId}/
 *     manifest.json - Session metadata + file index
 *     001.json, 002.json... - Individual ThoughtNode files
 *     branches/{branchId}/001.json... - Branch thought files
 */
export async function migrateExports(
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const {
    sourceDir = path.join(os.homedir(), '.thoughtbox', 'exports'),
    destDir = path.join(os.homedir(), '.thoughtbox', 'sessions'),
    partitionGranularity = 'monthly',
    deleteAfterMigration = false,
    skipExisting = true,
    dryRun = false,
  } = options;

  const result: MigrationResult = {
    migrated: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  // Check if source directory exists
  try {
    await fs.access(sourceDir);
  } catch {
    // No exports to migrate
    return result;
  }

  // Read all files in exports directory
  const files = await fs.readdir(sourceDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  for (const file of jsonFiles) {
    const sourceFilePath = path.join(sourceDir, file);
    let sessionId = '';

    try {
      // Parse the export file
      const content = await fs.readFile(sourceFilePath, 'utf-8');
      const exportData: SessionExport = JSON.parse(content);

      // Validate export structure
      if (!exportData.version || !exportData.session || !exportData.nodes) {
        result.skipped++;
        result.details.push({
          sourceFile: file,
          sessionId: 'unknown',
          status: 'skipped',
          reason: 'Invalid export format - missing required fields',
        });
        continue;
      }

      sessionId = exportData.session.id;

      // Determine partition path
      const partitionPath = getPartitionPath(
        new Date(exportData.session.createdAt),
        partitionGranularity
      );

      // Determine destination session directory
      const sessionDir = path.join(destDir, partitionPath, sessionId);

      // Check if already exists
      if (skipExisting) {
        try {
          await fs.access(sessionDir);
          result.skipped++;
          result.details.push({
            sourceFile: file,
            sessionId,
            status: 'skipped',
            reason: 'Session already exists',
          });
          continue;
        } catch {
          // Doesn't exist, continue with migration
        }
      }

      if (!dryRun) {
        // Create session directory
        await fs.mkdir(sessionDir, { recursive: true });

        // Separate main chain and branch nodes
        const mainChainNodes: ThoughtNode[] = [];
        const branchNodes: Map<string, ThoughtNode[]> = new Map();

        for (const node of exportData.nodes) {
          if (node.branchId) {
            if (!branchNodes.has(node.branchId)) {
              branchNodes.set(node.branchId, []);
            }
            branchNodes.get(node.branchId)!.push(node);
          } else {
            mainChainNodes.push(node);
          }
        }

        // Sort nodes by thought number
        mainChainNodes.sort((a, b) => a.data.thoughtNumber - b.data.thoughtNumber);
        for (const nodes of branchNodes.values()) {
          nodes.sort((a, b) => a.data.thoughtNumber - b.data.thoughtNumber);
        }

        // Write main chain thought files
        const thoughtFiles: string[] = [];
        for (const node of mainChainNodes) {
          const filename = formatThoughtFilename(node.data.thoughtNumber);
          const filePath = path.join(sessionDir, filename);
          await atomicWriteJson(filePath, node);
          thoughtFiles.push(filename);
        }

        // Write branch thought files
        const branchFiles: Record<string, string[]> = {};
        for (const [branchId, nodes] of branchNodes.entries()) {
          const branchDir = path.join(sessionDir, 'branches', branchId);
          await fs.mkdir(branchDir, { recursive: true });
          branchFiles[branchId] = [];

          for (const node of nodes) {
            const filename = formatThoughtFilename(node.data.thoughtNumber);
            const filePath = path.join(branchDir, filename);
            await atomicWriteJson(filePath, node);
            branchFiles[branchId].push(filename);
          }
        }

        // Create manifest matching SessionManifest interface
        const manifest: SessionManifest = {
          id: sessionId,
          version: '1.0.0',
          thoughtFiles,
          branchFiles,
          metadata: {
            title: exportData.session.title,
            description: exportData.session.description,
            tags: exportData.session.tags || [],
            createdAt: exportData.session.createdAt instanceof Date
              ? exportData.session.createdAt.toISOString()
              : String(exportData.session.createdAt),
            updatedAt: new Date().toISOString(),
          },
        };

        const manifestPath = path.join(sessionDir, 'manifest.json');
        await atomicWriteJson(manifestPath, manifest);

        // Delete source file if requested
        if (deleteAfterMigration) {
          await fs.unlink(sourceFilePath);
        }
      }

      result.migrated++;
      result.details.push({
        sourceFile: file,
        sessionId,
        status: 'migrated',
        destinationPath: dryRun ? `${destDir}/${partitionPath}/${sessionId}` : path.join(destDir, partitionPath, sessionId),
      });
    } catch (error) {
      result.failed++;
      result.details.push({
        sourceFile: file,
        sessionId: sessionId || 'unknown',
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

/**
 * Get partition path based on date and granularity.
 */
function getPartitionPath(
  date: Date,
  granularity: TimePartitionGranularity
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (granularity) {
    case 'none':
      return '';
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly': {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
      const weekDay = String(weekStart.getDate()).padStart(2, '0');
      return `${year}-W${weekMonth}${weekDay}`;
    }
    case 'monthly':
    default:
      return `${year}-${month}`;
  }
}

/**
 * Format thought number as padded filename.
 */
function formatThoughtFilename(thoughtNumber: number): string {
  return `${String(thoughtNumber).padStart(3, '0')}.json`;
}

/**
 * Atomic write using temp file + rename.
 */
async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(tmpPath, content, 'utf-8');
  await fs.rename(tmpPath, filePath);
}

/**
 * List available exports that can be migrated.
 */
export async function listExports(
  sourceDir?: string
): Promise<{ filename: string; sessionId: string; createdAt: string }[]> {
  const dir = sourceDir || path.join(os.homedir(), '.thoughtbox', 'exports');

  try {
    await fs.access(dir);
  } catch {
    return [];
  }

  const files = await fs.readdir(dir);
  const exports: { filename: string; sessionId: string; createdAt: string }[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    try {
      const content = await fs.readFile(path.join(dir, file), 'utf-8');
      const data: SessionExport = JSON.parse(content);
      if (data.session?.id && data.session?.createdAt) {
        exports.push({
          filename: file,
          sessionId: data.session.id,
          createdAt: data.session.createdAt instanceof Date
            ? data.session.createdAt.toISOString()
            : String(data.session.createdAt),
        });
      }
    } catch {
      // Skip invalid files
    }
  }

  return exports;
}
