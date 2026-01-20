import { readFileSync, writeFileSync } from 'fs';

interface Learning {
  type: 'success' | 'failure' | 'insight';
  hypothesis: string;
  lesson: string;
  timestamp: string;
}

const SECTIONS = {
  success: '### What Works',
  failure: "### What Doesn't Work",
  insight: '### Current Capability Gaps'
} as const;

export function updateClaudeMd(learning: Learning, path = 'CLAUDE.md'): void {
  let content = readFileSync(path, 'utf-8');

  const section = SECTIONS[learning.type];
  const entry = `- **${learning.hypothesis}** (${learning.timestamp}): ${learning.lesson}`;

  const idx = content.indexOf(section);
  if (idx === -1) throw new Error(`Section not found: ${section}`);

  const insertAt = content.indexOf('\n', idx + section.length) + 1;
  content = content.slice(0, insertAt) + entry + '\n' + content.slice(insertAt);

  writeFileSync(path, content);
}
