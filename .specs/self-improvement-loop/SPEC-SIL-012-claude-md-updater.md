# SPEC-SIL-012: CLAUDE.md Learning Updater

> **Status**: Draft
> **Priority**: MEDIUM
> **Week**: 4 (Autonomous Loop)
> **Phase**: Integration
> **Estimated Effort**: 3-4 hours

## Summary

Implement mechanism to append learnings from each improvement cycle to CLAUDE.md, enabling compounding knowledge across sessions.

## Problem Statement

Without CLAUDE.md updates:
- Learnings are lost between sessions
- Same mistakes repeated
- No compounding effect from improvements
- Future agents don't benefit from past discoveries

CLAUDE.md updates provide:
- Persistent learnings across sessions
- Compounding knowledge base
- Clear audit trail
- Future agent guidance

## Scope

### In Scope
- Learning extraction from iteration results
- CLAUDE.md section management
- Safe file modification
- Learning categorization (success/failure/insight)

### Out of Scope
- Full rules system update (separate from CLAUDE.md)
- Learning consolidation/pruning (manual)
- Cross-repo learning sync

## Requirements

### R1: Learning Types
```typescript
interface Learning {
  type: 'success' | 'failure' | 'insight';
  hypothesis: string;
  outcome: string;
  lesson: string;
  timestamp: string;
  iterationId?: string;
}
```

### R2: Section Structure
```markdown
## Improvement Loop Learnings

### What Works
- **[Hypothesis]** (YYYY-MM-DD): [Lesson]

### What Doesn't Work
- **[Hypothesis]** (YYYY-MM-DD): [Lesson]

### Current Capability Gaps
- **[Area]** (YYYY-MM-DD): [Description]
```

### R3: Safe Updates
- Parse existing CLAUDE.md
- Find/create appropriate section
- Insert new entry at top of section
- Preserve all existing content

## Technical Approach

### Implementation

```typescript
// src/improvement/claude-md-updater.ts

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

interface Learning {
  type: 'success' | 'failure' | 'insight';
  hypothesis: string;
  outcome: string;
  lesson: string;
  timestamp: string;
  iterationId?: string;
  tags?: string[];
}

interface UpdateOptions {
  claudeMdPath: string;
  dryRun: boolean;
  createIfMissing: boolean;
}

const DEFAULT_OPTIONS: UpdateOptions = {
  claudeMdPath: 'CLAUDE.md',
  dryRun: false,
  createIfMissing: true
};

const SECTION_HEADER = '## Improvement Loop Learnings';

const SUBSECTION_MAP: Record<Learning['type'], string> = {
  success: '### What Works',
  failure: "### What Doesn't Work",
  insight: '### Current Capability Gaps'
};

export class ClaudeMdUpdater {
  private options: UpdateOptions;

  constructor(options: Partial<UpdateOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Update CLAUDE.md with a new learning.
   */
  async updateClaudeMd(learning: Learning): Promise<{ updated: boolean; content?: string }> {
    let claudeMd = await this.loadClaudeMd();

    // Ensure main section exists
    claudeMd = this.ensureMainSection(claudeMd);

    // Ensure subsection exists
    const subsection = SUBSECTION_MAP[learning.type];
    claudeMd = this.ensureSubsection(claudeMd, subsection);

    // Format the entry
    const entry = this.formatLearningEntry(learning);

    // Insert entry under appropriate subsection
    claudeMd = this.insertUnderSection(claudeMd, subsection, entry);

    // Write back
    if (!this.options.dryRun) {
      await writeFile(this.options.claudeMdPath, claudeMd, 'utf-8');
    }

    return { updated: true, content: this.options.dryRun ? claudeMd : undefined };
  }

  /**
   * Batch update with multiple learnings.
   */
  async batchUpdate(learnings: Learning[]): Promise<{ updated: boolean; count: number }> {
    let claudeMd = await this.loadClaudeMd();

    // Ensure structure
    claudeMd = this.ensureMainSection(claudeMd);
    for (const subsection of Object.values(SUBSECTION_MAP)) {
      claudeMd = this.ensureSubsection(claudeMd, subsection);
    }

    // Insert all learnings
    for (const learning of learnings) {
      const subsection = SUBSECTION_MAP[learning.type];
      const entry = this.formatLearningEntry(learning);
      claudeMd = this.insertUnderSection(claudeMd, subsection, entry);
    }

    // Write back
    if (!this.options.dryRun) {
      await writeFile(this.options.claudeMdPath, claudeMd, 'utf-8');
    }

    return { updated: true, count: learnings.length };
  }

  /**
   * Extract learnings from iteration result.
   */
  extractLearnings(iterationResult: any): Learning[] {
    const learnings: Learning[] = [];
    const timestamp = new Date().toISOString().split('T')[0];

    if (iterationResult.type === 'improvement-found') {
      learnings.push({
        type: 'success',
        hypothesis: iterationResult.modification?.type || 'Unknown improvement',
        outcome: 'Passed all evaluation tiers',
        lesson: `Successfully improved ${iterationResult.modification?.files?.join(', ') || 'target files'}`,
        timestamp,
        iterationId: String(iterationResult.iterationNumber)
      });
    }

    if (iterationResult.type === 'no-improvements' && iterationResult.cost?.experiment > 0) {
      learnings.push({
        type: 'failure',
        hypothesis: 'Experimental improvements',
        outcome: 'Failed evaluation',
        lesson: 'Experimentation did not yield passing improvements this iteration',
        timestamp,
        iterationId: String(iterationResult.iterationNumber)
      });
    }

    // Extract insights from evaluation failures
    if (iterationResult.evaluationDetails?.failedAt) {
      learnings.push({
        type: 'insight',
        hypothesis: `${iterationResult.evaluationDetails.failedAt} tier`,
        outcome: 'Capability gap identified',
        lesson: `Need to improve ${iterationResult.evaluationDetails.failedAt} tier performance`,
        timestamp,
        iterationId: String(iterationResult.iterationNumber)
      });
    }

    return learnings;
  }

  /**
   * Load CLAUDE.md content.
   */
  private async loadClaudeMd(): Promise<string> {
    if (!existsSync(this.options.claudeMdPath)) {
      if (this.options.createIfMissing) {
        return this.createDefaultClaudeMd();
      }
      throw new Error(`CLAUDE.md not found at ${this.options.claudeMdPath}`);
    }

    return readFile(this.options.claudeMdPath, 'utf-8');
  }

  /**
   * Create default CLAUDE.md structure.
   */
  private createDefaultClaudeMd(): string {
    return `# CLAUDE.md

This file provides guidance to Claude Code when working with this codebase.

${SECTION_HEADER}

${SUBSECTION_MAP.success}

${SUBSECTION_MAP.failure}

${SUBSECTION_MAP.insight}

`;
  }

  /**
   * Ensure main section exists.
   */
  private ensureMainSection(content: string): string {
    if (!content.includes(SECTION_HEADER)) {
      // Append section at end
      return content.trimEnd() + `\n\n${SECTION_HEADER}\n\n`;
    }
    return content;
  }

  /**
   * Ensure subsection exists under main section.
   */
  private ensureSubsection(content: string, subsection: string): string {
    if (!content.includes(subsection)) {
      // Find main section and append subsection after it
      const mainIndex = content.indexOf(SECTION_HEADER);
      if (mainIndex !== -1) {
        const insertPoint = mainIndex + SECTION_HEADER.length;
        const before = content.slice(0, insertPoint);
        const after = content.slice(insertPoint);

        // Find where to insert (after main header, before next ## or end)
        const nextSectionMatch = after.match(/\n## /);
        if (nextSectionMatch && nextSectionMatch.index !== undefined) {
          const subBefore = after.slice(0, nextSectionMatch.index);
          const subAfter = after.slice(nextSectionMatch.index);
          return before + subBefore + `\n${subsection}\n\n` + subAfter;
        } else {
          return before + `\n\n${subsection}\n\n` + after;
        }
      }
    }
    return content;
  }

  /**
   * Insert entry under a section, at the top.
   */
  private insertUnderSection(content: string, section: string, entry: string): string {
    const sectionIndex = content.indexOf(section);
    if (sectionIndex === -1) {
      throw new Error(`Section not found: ${section}`);
    }

    // Find insertion point (right after section header line)
    const afterSection = content.slice(sectionIndex + section.length);
    const newlineIndex = afterSection.indexOf('\n');

    if (newlineIndex === -1) {
      // Section is at end of file
      return content + `\n${entry}\n`;
    }

    const insertPoint = sectionIndex + section.length + newlineIndex + 1;
    const before = content.slice(0, insertPoint);
    const after = content.slice(insertPoint);

    return before + entry + '\n' + after;
  }

  /**
   * Format a learning as a markdown entry.
   */
  private formatLearningEntry(learning: Learning): string {
    const tags = learning.tags?.length ? ` [${learning.tags.join(', ')}]` : '';
    const iteration = learning.iterationId ? ` (iter #${learning.iterationId})` : '';

    return `- **${learning.hypothesis}** (${learning.timestamp}${iteration}): ${learning.lesson}${tags}`;
  }

  /**
   * Get current learnings from CLAUDE.md.
   */
  async getCurrentLearnings(): Promise<Learning[]> {
    const content = await this.loadClaudeMd();
    const learnings: Learning[] = [];

    // Simple regex parsing - could be more robust
    const entryPattern = /- \*\*(.+?)\*\* \((\d{4}-\d{2}-\d{2})(?:\s*iter #(\d+))?\): (.+)/g;

    let match;
    while ((match = entryPattern.exec(content)) !== null) {
      // Determine type based on which section it's in
      let type: Learning['type'] = 'insight';
      const matchIndex = match.index;

      const successIdx = content.lastIndexOf(SUBSECTION_MAP.success, matchIndex);
      const failureIdx = content.lastIndexOf(SUBSECTION_MAP.failure, matchIndex);
      const insightIdx = content.lastIndexOf(SUBSECTION_MAP.insight, matchIndex);

      const maxIdx = Math.max(successIdx, failureIdx, insightIdx);
      if (maxIdx === successIdx) type = 'success';
      else if (maxIdx === failureIdx) type = 'failure';
      else type = 'insight';

      learnings.push({
        type,
        hypothesis: match[1],
        timestamp: match[2],
        iterationId: match[3],
        lesson: match[4],
        outcome: ''  // Not stored in format
      });
    }

    return learnings;
  }
}

// Singleton
let updaterInstance: ClaudeMdUpdater | null = null;

export function getClaudeMdUpdater(options?: Partial<UpdateOptions>): ClaudeMdUpdater {
  if (!updaterInstance) {
    updaterInstance = new ClaudeMdUpdater(options);
  }
  return updaterInstance;
}

// Convenience function for main loop integration
export async function recordLearning(learning: Learning): Promise<void> {
  const updater = getClaudeMdUpdater();
  await updater.updateClaudeMd(learning);
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `src/improvement/claude-md-updater.ts` | CLAUDE.md update logic |
| `src/improvement/claude-md-updater.test.ts` | Unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `CLAUDE.md` | New "Improvement Loop Learnings" section |

## Acceptance Criteria

- [ ] Parses existing CLAUDE.md safely
- [ ] Creates section if missing
- [ ] Inserts new entries at top of subsection
- [ ] Preserves all existing content
- [ ] Handles all three learning types
- [ ] Batch updates work correctly
- [ ] Dry run mode for testing

## Test Cases

```typescript
describe('ClaudeMdUpdater', () => {
  it('creates section if missing', async () => {
    const updater = new ClaudeMdUpdater({ dryRun: true });
    const result = await updater.updateClaudeMd({
      type: 'success',
      hypothesis: 'Test',
      outcome: 'Passed',
      lesson: 'It worked',
      timestamp: '2026-01-19'
    });

    expect(result.content).toContain('## Improvement Loop Learnings');
    expect(result.content).toContain('### What Works');
    expect(result.content).toContain('**Test** (2026-01-19)');
  });

  it('inserts at top of existing section', async () => {
    const existingContent = `# CLAUDE.md

## Improvement Loop Learnings

### What Works
- **Old Entry** (2026-01-01): Old lesson
`;
    // Mock readFile to return existingContent

    const result = await updater.updateClaudeMd({
      type: 'success',
      hypothesis: 'New Entry',
      outcome: 'Passed',
      lesson: 'New lesson',
      timestamp: '2026-01-19'
    });

    // New entry should be above old entry
    const newIdx = result.content!.indexOf('New Entry');
    const oldIdx = result.content!.indexOf('Old Entry');
    expect(newIdx).toBeLessThan(oldIdx);
  });

  it('extracts learnings from iteration result', () => {
    const updater = new ClaudeMdUpdater();
    const learnings = updater.extractLearnings({
      type: 'improvement-found',
      iterationNumber: 5,
      modification: {
        type: 'performance',
        files: ['src/cache.ts']
      }
    });

    expect(learnings).toHaveLength(1);
    expect(learnings[0].type).toBe('success');
    expect(learnings[0].iterationId).toBe('5');
  });
});
```

## Gates

### Entry Gate
- SPEC-SIL-010 (Main Loop) complete for iteration results

### Exit Gate
- Safe updates verified
- No content loss on updates
- Integration with main loop tested

## Dependencies

- SPEC-SIL-010 (Main Loop Orchestrator)
- Existing CLAUDE.md structure

## Blocked By

- SPEC-SIL-010

## Blocks

- None (this is a terminal spec)

---

**Created**: 2026-01-19
**Source**: PLAN Week 4, Task 4 (CLAUDE.md update mechanism)
