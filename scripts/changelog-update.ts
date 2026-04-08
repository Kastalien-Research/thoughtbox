#!/usr/bin/env tsx
/**
 * Update CHANGELOG.md with new commits
 * Parses conventional commits and updates [Unreleased] section
 */

import * as fs from 'fs/promises';
import {
  parseGitLog,
  groupByCategory,
  formatChangelogEntry,
  type ParsedCommit,
  type ChangeCategory,
} from './changelog-parse.js';

const CHANGELOG_PATH = 'CHANGELOG.md';

/**
 * Extract the [Unreleased] section from changelog
 */
function extractUnreleasedSection(changelog: string): string {
  const unreleasedMatch = changelog.match(/## \[Unreleased\]([\s\S]*?)(?=\n## \[|$)/);
  return unreleasedMatch ? unreleasedMatch[1] : '';
}

/**
 * Parse entries from a changelog section
 */
function parseExistingEntries(section: string): Record<string, string[]> {
  const entries: Record<string, string[]> = {
    added: [],
    changed: [],
    deprecated: [],
    removed: [],
    fixed: [],
    security: [],
  };

  const categoryMap: Record<string, keyof typeof entries> = {
    'Added': 'added',
    'Changed': 'changed',
    'Deprecated': 'deprecated',
    'Removed': 'removed',
    'Fixed': 'fixed',
    'Security': 'security',
  };

  let currentCategory: keyof typeof entries | null = null;

  for (const line of section.split('\n')) {
    // Check for category header (### Added, ### Fixed, etc.)
    const categoryMatch = line.match(/^###\s+(\w+)/);
    if (categoryMatch && categoryMap[categoryMatch[1]]) {
      currentCategory = categoryMap[categoryMatch[1]];
      continue;
    }

    // Parse entry line (starts with -)
    if (line.trim().startsWith('-') && currentCategory) {
      entries[currentCategory].push(line.trim().slice(2)); // Remove "- "
    }
  }

  return entries;
}

/**
 * Merge new entries with existing, deduplicating
 */
function mergeEntries(
  existing: Record<string, string[]>,
  newEntries: Record<string, string[]>
): Record<string, string[]> {
  const merged: Record<string, string[]> = {};

  const categories: Array<keyof typeof existing> = [
    'added',
    'changed',
    'deprecated',
    'removed',
    'fixed',
    'security',
  ];

  for (const category of categories) {
    const existingSet = new Set(existing[category] || []);
    const combined = [...(existing[category] || [])];

    // Add new entries if not duplicates
    for (const entry of newEntries[category] || []) {
      // Simple deduplication: check if entry text already exists
      const entryText = entry.replace(/\s*\(\[[\da-f]{7}\].*?\)$/, ''); // Remove commit hash
      const isDuplicate = Array.from(existingSet).some(e =>
        e.replace(/\s*\(\[[\da-f]{7}\].*?\)$/, '') === entryText
      );

      if (!isDuplicate) {
        combined.push(entry);
      }
    }

    merged[category] = combined;
  }

  return merged;
}

/**
 * Generate [Unreleased] section markdown
 */
function generateUnreleasedSection(entries: Record<string, string[]>): string {
  const lines: string[] = ['## [Unreleased]', ''];

  const categoryHeaders: Record<string, string> = {
    added: '### Added',
    changed: '### Changed',
    deprecated: '### Deprecated',
    removed: '### Removed',
    fixed: '### Fixed',
    security: '### Security',
  };

  const categories: Array<keyof typeof categoryHeaders> = [
    'added',
    'changed',
    'deprecated',
    'removed',
    'fixed',
    'security',
  ];

  for (const category of categories) {
    const items = entries[category];

    if (items && items.length > 0) {
      lines.push(categoryHeaders[category]);
      for (const item of items) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Replace [Unreleased] section in changelog
 */
function replaceUnreleasedSection(changelog: string, newSection: string): string {
  // Find the [Unreleased] section
  const unreleasedRegex = /## \[Unreleased\][\s\S]*?(?=\n## \[|$)/;

  if (unreleasedRegex.test(changelog)) {
    // Replace existing [Unreleased]
    return changelog.replace(unreleasedRegex, newSection.trim());
  } else {
    // Insert after main header
    const headerMatch = changelog.match(/^# Changelog[\s\S]*?(?=\n## |$)/);
    if (headerMatch) {
      return changelog.replace(
        headerMatch[0],
        headerMatch[0] + '\n\n' + newSection
      );
    } else {
      // Prepend to file
      return newSection + '\n\n' + changelog;
    }
  }
}

/**
 * Main update function
 */
export async function updateChangelog(commits: ParsedCommit[]): Promise<void> {
  // Read current changelog
  let changelog: string;
  try {
    changelog = await fs.readFile(CHANGELOG_PATH, 'utf-8');
  } catch {
    console.error(`❌ ${CHANGELOG_PATH} not found. Create it first.`);
    process.exit(1);
  }

  // Parse existing [Unreleased] section
  const unreleasedSection = extractUnreleasedSection(changelog);
  const existingEntries = parseExistingEntries(unreleasedSection);

  // Group new commits
  const grouped = groupByCategory(commits);

  // Format new entries
  const newEntries: Record<string, string[]> = {
    added: grouped.added.map(formatChangelogEntry),
    changed: grouped.changed.map(formatChangelogEntry),
    deprecated: grouped.deprecated.map(formatChangelogEntry),
    removed: grouped.removed.map(formatChangelogEntry),
    fixed: grouped.fixed.map(formatChangelogEntry),
    security: grouped.security.map(formatChangelogEntry),
  };

  // Merge with existing (deduplicate)
  const merged = mergeEntries(existingEntries, newEntries);

  // Generate new [Unreleased] section
  const newSection = generateUnreleasedSection(merged);

  // Update changelog
  const updated = replaceUnreleasedSection(changelog, newSection);

  await fs.writeFile(CHANGELOG_PATH, updated, 'utf-8');

  console.log('✅ CHANGELOG.md updated');
  console.log(`   Added: ${newEntries.added.length} entries`);
  console.log(`   Changed: ${newEntries.changed.length} entries`);
  console.log(`   Fixed: ${newEntries.fixed.length} entries`);
  console.log(`   Security: ${newEntries.security.length} entries`);
  console.log(`   Skipped: ${grouped.skip.length} commits (docs/test/chore)`);
}

/**
 * CLI usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const gitLogPath = process.argv[2];

  if (!gitLogPath) {
    console.error('Usage: tsx changelog-update.ts <git-log-file>');
    console.error('');
    console.error('Generate git log file with:');
    console.error('  git log --format="%H|%s|%an|%ad" HEAD~10..HEAD > commits.txt');
    console.error('  tsx changelog-update.ts commits.txt');
    process.exit(1);
  }

  try {
    const gitLogOutput = await fs.readFile(gitLogPath, 'utf-8');
    const commits = parseGitLog(gitLogOutput);

    console.log(`🔨 Processing ${commits.length} conventional commits...`);

    if (commits.length === 0) {
      console.log('⚠️  No conventional commits found. Use format: type(scope): description');
      console.log('   Example: feat(loops): Add OODA loops MCP integration');
      process.exit(0);
    }

    await updateChangelog(commits);
  } catch (error) {
    console.error('❌ Failed to update changelog:', error);
    process.exit(1);
  }
}
