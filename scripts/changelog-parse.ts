#!/usr/bin/env tsx
/**
 * Parse conventional commit messages and categorize for changelog
 * Follows https://www.conventionalcommits.org/ specification
 */

export interface ParsedCommit {
  type: string;
  scope?: string;
  description: string;
  breaking: boolean;
  body?: string;
  hash: string;
  author: string;
  date: string;
}

export type ChangeCategory = 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security' | 'skip';

/**
 * Parse a conventional commit message
 * Format: type(scope): description
 * Breaking: type!: description or type(scope)!: description
 */
export function parseConventionalCommit(
  message: string,
  hash: string,
  author: string,
  date: string
): ParsedCommit | null {
  // Regex: type(optional scope)(optional !): description
  const regex = /^(\w+)(\([\w-]+\))?(!)?:\s*(.+)$/;
  const match = message.match(regex);

  if (!match) {
    // Not a conventional commit
    return null;
  }

  return {
    type: match[1],
    scope: match[2]?.replace(/[()]/g, ''),
    breaking: match[3] === '!',
    description: match[4],
    hash,
    author,
    date,
  };
}

/**
 * Categorize a commit for changelog section
 */
export function categorizeCommit(commit: ParsedCommit): ChangeCategory {
  // Breaking changes always go in Changed section with note
  if (commit.breaking) {
    return 'changed';
  }

  // Type mapping
  const typeMap: Record<string, ChangeCategory> = {
    feat: 'added',
    fix: 'fixed',
    perf: 'changed',
    refactor: 'changed',
    security: 'security',
    deprecate: 'deprecated',
    remove: 'removed',
    docs: 'skip',
    style: 'skip',
    test: 'skip',
    chore: 'skip',
    build: 'skip',
    ci: 'skip',
  };

  return typeMap[commit.type] || 'skip';
}

/**
 * Format a commit as a changelog entry
 */
export function formatChangelogEntry(commit: ParsedCommit): string {
  let entry = commit.description;

  // Add scope if present
  if (commit.scope) {
    entry = `**${commit.scope}**: ${entry}`;
  }

  // Add breaking change marker
  if (commit.breaking) {
    entry = `${entry} ⚠️ BREAKING CHANGE`;
  }

  // Add commit hash reference (short form)
  const shortHash = commit.hash.slice(0, 7);
  entry = `${entry} ([${shortHash}](../../commit/${commit.hash}))`;

  return entry;
}

/**
 * Extract commits from git log output
 * Expected format: hash|subject|author|date (one per line)
 */
export function parseGitLog(logOutput: string): ParsedCommit[] {
  const lines = logOutput.trim().split('\n').filter(l => l.length > 0);
  const commits: ParsedCommit[] = [];

  for (const line of lines) {
    const [hash, subject, author, date] = line.split('|');

    if (!hash || !subject) continue;

    const parsed = parseConventionalCommit(subject, hash, author || 'Unknown', date || new Date().toISOString());

    if (parsed) {
      commits.push(parsed);
    }
  }

  return commits;
}

/**
 * Group commits by category
 */
export function groupByCategory(commits: ParsedCommit[]): Record<ChangeCategory, ParsedCommit[]> {
  const groups: Record<ChangeCategory, ParsedCommit[]> = {
    added: [],
    changed: [],
    deprecated: [],
    removed: [],
    fixed: [],
    security: [],
    skip: [],
  };

  for (const commit of commits) {
    const category = categorizeCommit(commit);
    groups[category].push(commit);
  }

  return groups;
}

/**
 * CLI usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const gitLogOutput = await import('fs/promises').then(fs =>
    fs.readFile(process.argv[2] || '/dev/stdin', 'utf-8')
  );

  const commits = parseGitLog(gitLogOutput);
  const grouped = groupByCategory(commits);

  console.log(JSON.stringify(grouped, null, 2));
}
