import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { updateClaudeMd } from './claude-md-updater';

const TEST_PATH = '/tmp/test-claude.md';
const TEMPLATE = `# CLAUDE.md

## Improvement Loop Learnings

### What Works

### What Doesn't Work

### Current Capability Gaps
`;

describe('updateClaudeMd', () => {
  beforeEach(() => writeFileSync(TEST_PATH, TEMPLATE));
  afterEach(() => unlinkSync(TEST_PATH));

  it('inserts learning under correct section', () => {
    updateClaudeMd({
      type: 'success',
      hypothesis: 'test',
      lesson: 'it worked',
      timestamp: '2026-01-19'
    }, TEST_PATH);

    const content = readFileSync(TEST_PATH, 'utf-8');
    expect(content).toContain('### What Works\n- **test**');
  });

  it('inserts failure under What Doesn\'t Work', () => {
    updateClaudeMd({
      type: 'failure',
      hypothesis: 'bad idea',
      lesson: 'did not work',
      timestamp: '2026-01-19'
    }, TEST_PATH);

    const content = readFileSync(TEST_PATH, 'utf-8');
    expect(content).toContain("### What Doesn't Work\n- **bad idea**");
  });

  it('inserts insight under Current Capability Gaps', () => {
    updateClaudeMd({
      type: 'insight',
      hypothesis: 'need feature',
      lesson: 'requires X',
      timestamp: '2026-01-19'
    }, TEST_PATH);

    const content = readFileSync(TEST_PATH, 'utf-8');
    expect(content).toContain('### Current Capability Gaps\n- **need feature**');
  });

  it('throws if section not found', () => {
    writeFileSync(TEST_PATH, '# Empty file');

    expect(() => updateClaudeMd({
      type: 'success',
      hypothesis: 'test',
      lesson: 'it worked',
      timestamp: '2026-01-19'
    }, TEST_PATH)).toThrow('Section not found');
  });
});
