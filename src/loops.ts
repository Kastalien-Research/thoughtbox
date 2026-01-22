/**
 * @fileoverview OODA loop catalog - reads from src/loops/ directory
 * @module src/loops
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOOPS_DIR = path.join(__dirname, 'loops');

export interface LoopMetadata {
  type: string;
  speed: string;
  scope: string;
  description: string;
  interface_version: string;
  inputs: unknown[];
  outputs: unknown[];
  signals: unknown[];
  composition: Record<string, unknown>;
}

export interface Loop {
  content: string;
  metadata: LoopMetadata;
}

export interface LoopsCatalog {
  [category: string]: {
    [loopName: string]: Loop;
  };
}

let cachedCatalog: LoopsCatalog | null = null;

/**
 * Extract description from markdown content if not in frontmatter
 */
function extractDescription(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'No description';
}

/**
 * Parse loop markdown file and extract metadata + content
 */
function parseLoopFile(filepath: string): Loop {
  const content = fs.readFileSync(filepath, 'utf-8');
  const parsed = matter(content);

  const metadata: LoopMetadata = {
    type: parsed.data.type || 'unknown',
    speed: parsed.data.speed || 'unknown',
    scope: parsed.data.scope || 'unknown',
    description: parsed.data.description || extractDescription(parsed.content),
    interface_version: parsed.data.interface_version || '1.0',
    inputs: parsed.data.inputs || [],
    outputs: parsed.data.outputs || [],
    signals: parsed.data.signals || [],
    composition: parsed.data.composition || {},
  };

  return {
    content: parsed.content,
    metadata,
  };
}

/**
 * Build loops catalog from src/loops/ directory
 */
function buildCatalog(): LoopsCatalog {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  const catalog: LoopsCatalog = {};

  // Read all category directories
  const categories = fs.readdirSync(LOOPS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const category of categories) {
    const categoryPath = path.join(LOOPS_DIR, category);
    catalog[category] = {};

    // Read all markdown files in category
    const files = fs.readdirSync(categoryPath)
      .filter(file => file.endsWith('.md'));

    for (const file of files) {
      const loopName = path.basename(file, '.md');
      const filePath = path.join(categoryPath, file);

      try {
        catalog[category][loopName] = parseLoopFile(filePath);
      } catch (error) {
        console.error(`Failed to parse loop ${category}/${loopName}:`, error);
      }
    }
  }

  cachedCatalog = catalog;
  return catalog;
}

/**
 * Get all category names
 */
export function getCategories(): string[] {
  const catalog = buildCatalog();
  return Object.keys(catalog).sort();
}

/**
 * Get all loops in a category
 */
export function getLoopsInCategory(category: string): string[] {
  const catalog = buildCatalog();
  return Object.keys(catalog[category] || {}).sort();
}

/**
 * Get a specific loop
 */
export function getLoop(category: string, name: string): Loop | null {
  const catalog = buildCatalog();
  return catalog[category]?.[name] || null;
}

/**
 * Get full loops catalog
 */
export function getCatalog(): LoopsCatalog {
  return buildCatalog();
}

/**
 * Clear cached catalog (useful for testing or hot reload)
 */
export function clearCache(): void {
  cachedCatalog = null;
}

export const LOOPS_CATALOG = buildCatalog();
