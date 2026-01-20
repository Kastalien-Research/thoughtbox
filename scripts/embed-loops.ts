#!/usr/bin/env tsx
/**
 * Build-time OODA loop embedding script
 * Converts .claude/commands/loops/ files to TypeScript catalog
 * Runs at build time via tsx to generate embedded loop resources
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

// ESM-compatible __dirname/__filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOOPS_DIR = path.join(__dirname, '../.claude/commands/loops');
const OUTPUT_FILE = path.join(__dirname, '../src/resources/loops-content.ts');
const MAX_LOOP_SIZE = 100 * 1024; // 100KB
const WARN_LOOP_SIZE = 50 * 1024;  // 50KB

interface LoopMetadata {
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

interface Loop {
  content: string;
  metadata: LoopMetadata;
}

interface LoopsCatalog {
  [category: string]: {
    [loopName: string]: Loop;
  };
}

/**
 * Extract description from markdown content if not in frontmatter
 */
function extractDescription(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'No description';
}

/**
 * Load all loops from .claude/commands/loops/ directory
 */
async function loadLoops(): Promise<LoopsCatalog> {
  const catalog: LoopsCatalog = {};
  const seenNames = new Set<string>();

  try {
    const categories = await fs.readdir(LOOPS_DIR);

    for (const category of categories) {
      // Skip hidden files and non-category files
      if (category.startsWith('.') || category.endsWith('.md')) {
        continue;
      }

      const categoryPath = path.join(LOOPS_DIR, category);
      const stat = await fs.stat(categoryPath);

      if (!stat.isDirectory()) {
        continue;
      }

      catalog[category] = {};

      const files = await fs.readdir(categoryPath);
      const loopFiles = files.filter(f => f.endsWith('.md'));

      for (const file of loopFiles) {
        const loopPath = path.join(categoryPath, file);
        const loopName = file.replace('.md', '');

        // Check for duplicate loop names across categories
        if (seenNames.has(loopName)) {
          throw new Error(
            `Duplicate loop name: ${loopName} found in multiple categories. ` +
            `Each loop must have a unique name across all categories.`
          );
        }
        seenNames.add(loopName);

        // Read file and check size
        const content = await fs.readFile(loopPath, 'utf-8');
        const sizeBytes = Buffer.byteLength(content, 'utf8');
        const sizeKB = sizeBytes / 1024;

        // Hard limit: 100KB
        if (sizeBytes > MAX_LOOP_SIZE) {
          throw new Error(
            `Loop file too large: ${category}/${file} (${sizeKB.toFixed(1)}KB), ` +
            `maximum size is 100KB. Consider splitting into smaller loops.`
          );
        }

        // Soft warning: 50KB
        if (sizeBytes > WARN_LOOP_SIZE) {
          console.warn(
            `⚠️  Large loop file: ${category}/${file} (${sizeKB.toFixed(1)}KB), ` +
            `consider splitting for better modularity`
          );
        }

        // Parse frontmatter
        let frontmatter: Record<string, unknown>;
        let markdown: string;

        try {
          const parsed = matter(content);
          frontmatter = parsed.data;
          markdown = parsed.content;
        } catch (error) {
          throw new Error(
            `Malformed YAML frontmatter in ${category}/${file}: ${error instanceof Error ? error.message : String(error)}`
          );
        }

        // Build metadata with defaults
        const metadata: LoopMetadata = {
          type: (frontmatter.type as string) || 'unknown',
          speed: (frontmatter.speed as string) || 'medium',
          scope: (frontmatter.scope as string) || 'document',
          description: (frontmatter.description as string) || extractDescription(markdown),
          interface_version: (frontmatter.interface_version as string) || '1.0',
          inputs: (frontmatter.inputs as unknown[]) || [],
          outputs: (frontmatter.outputs as unknown[]) || [],
          signals: (frontmatter.signals as unknown[]) || [],
          composition: (frontmatter.composition as Record<string, unknown>) || {},
        };

        // Warn if required frontmatter fields are missing
        if (!frontmatter.type) {
          console.warn(
            `⚠️  Missing required field 'type' in ${category}/${file}, ` +
            `defaulting to 'unknown'`
          );
        }

        catalog[category][loopName] = {
          content: markdown,
          metadata,
        };
      }
    }

    return catalog;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(
        `⚠️  .claude/commands/loops/ directory not found. ` +
        `Generating empty catalog. This is expected if loops haven't been created yet.`
      );
      return {};
    }
    throw error;
  }
}

/**
 * Generate TypeScript file with embedded loops
 */
function generateTypeScript(catalog: LoopsCatalog): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * @fileoverview Auto-generated OODA loop catalog');
  lines.push(' * DO NOT EDIT MANUALLY - Generated by scripts/embed-loops.ts');
  lines.push(' * Source: .claude/commands/loops/');
  lines.push(' * @module src/resources/loops-content');
  lines.push(' */');
  lines.push('');

  lines.push('export interface LoopMetadata {');
  lines.push('  type: string;');
  lines.push('  speed: string;');
  lines.push('  scope: string;');
  lines.push('  description: string;');
  lines.push('  interface_version: string;');
  lines.push('  inputs: unknown[];');
  lines.push('  outputs: unknown[];');
  lines.push('  signals: unknown[];');
  lines.push('  composition: Record<string, unknown>;');
  lines.push('}');
  lines.push('');

  lines.push('export interface Loop {');
  lines.push('  content: string;');
  lines.push('  metadata: LoopMetadata;');
  lines.push('}');
  lines.push('');

  lines.push('export interface LoopsCatalog {');
  lines.push('  [category: string]: {');
  lines.push('    [loopName: string]: Loop;');
  lines.push('  };');
  lines.push('}');
  lines.push('');

  // Generate catalog constant
  lines.push('export const LOOPS_CATALOG: LoopsCatalog = {');

  const categories = Object.keys(catalog).sort();
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const loops = catalog[category];

    lines.push(`  '${category}': {`);

    const loopNames = Object.keys(loops).sort();
    for (let j = 0; j < loopNames.length; j++) {
      const loopName = loopNames[j];
      const loop = loops[loopName];

      // Escape content for template literal
      const escapedContent = loop.content
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

      lines.push(`    '${loopName}': {`);
      lines.push(`      content: \`${escapedContent}\`,`);
      lines.push(`      metadata: ${JSON.stringify(loop.metadata, null, 6)},`);
      lines.push(`    }${j < loopNames.length - 1 ? ',' : ''}`);
    }

    lines.push(`  }${i < categories.length - 1 ? ',' : ''}`);
  }

  lines.push('} as const;');
  lines.push('');

  // Helper functions
  lines.push('/**');
  lines.push(' * Get all available categories');
  lines.push(' */');
  lines.push('export function getCategories(): string[] {');
  lines.push('  return Object.keys(LOOPS_CATALOG);');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Get all loops in a category');
  lines.push(' */');
  lines.push('export function getLoopsInCategory(category: string): string[] {');
  lines.push('  const cat = LOOPS_CATALOG[category];');
  lines.push('  if (!cat) {');
  lines.push('    throw new Error(`Category not found: ${category}. Available: ${getCategories().join(", ")}`);');
  lines.push('  }');
  lines.push('  return Object.keys(cat);');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Get a specific loop by category and name');
  lines.push(' */');
  lines.push('export function getLoop(category: string, name: string): Loop {');
  lines.push('  const cat = LOOPS_CATALOG[category];');
  lines.push('  if (!cat) {');
  lines.push('    throw new Error(`Category not found: ${category}. Available: ${getCategories().join(", ")}`);');
  lines.push('  }');
  lines.push('  const loop = cat[name];');
  lines.push('  if (!loop) {');
  lines.push('    throw new Error(`Loop not found: ${name} in category ${category}. Available: ${Object.keys(cat).join(", ")}`);');
  lines.push('  }');
  lines.push('  return loop;');
  lines.push('}');

  return lines.join('\n');
}

async function main(): Promise<void> {
  try {
    console.log('🔨 Embedding OODA loops...');

    const catalog = await loadLoops();
    const categoryCount = Object.keys(catalog).length;
    const loopCount = Object.values(catalog).reduce(
      (sum, cat) => sum + Object.keys(cat).length,
      0
    );

    console.log(`   Found ${loopCount} loop(s) in ${categoryCount} category(ies):`);
    for (const [category, loops] of Object.entries(catalog)) {
      console.log(`   - ${category}: ${Object.keys(loops).length} loop(s)`);
    }

    const typescript = generateTypeScript(catalog);

    await fs.writeFile(OUTPUT_FILE, typescript, 'utf-8');
    console.log(`✅ Generated ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Failed to embed loops:', error);
    process.exit(1);
  }
}

main();
