# SPEC-CHG-001: Automated Changelog System

**Status**: DRAFT
**Created**: 2026-01-19
**Priority**: SHOULD
**Complexity**: Medium

---

## Overview

Implement an automated changelog generation system that integrates with Thoughtbox's agent-native architecture, following Keep a Changelog format with Conventional Commits parsing, and using agent workflows to maintain human-readable changelogs.

## Philosophy

**Changelog as Information Topology for Humans**

The changelog isn't just a list of changes - it's the **user-facing memory** of the project. While `.claude/` accumulates patterns for agents, `CHANGELOG.md` accumulates release notes for humans.

**Three Audiences**:
1. **Users**: What changed? What's new? What broke?
2. **Developers**: Why was this changed? What was the decision?
3. **Future Agents**: What features exist? What's the history?

---

## Problem Statement

Currently:
- No structured changelog exists
- Changes scattered across commits and PRs
- Hard to see "what changed" between versions
- Manual maintenance required (error-prone, often skipped)

**Goal**: Automated changelog that:
- Follows [Keep a Changelog](https://keepachangelog.com/) format
- Parses [Conventional Commits](https://www.conventionalcommits.org/)
- Uses agent workflows for human-quality descriptions
- Integrates with existing git hooks and GitHub Actions
- Minimal manual overhead

---

## Requirements

### REQ-1: Keep a Changelog Format (MUST)

Follow the standard format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature X for doing Y

### Changed
- Modified behavior of Z to improve performance

### Deprecated
- Old API endpoint /v1/foo (use /v2/foo instead)

### Removed
- Removed legacy feature bar

### Fixed
- Bug where baz would crash on edge case

### Security
- Patched vulnerability in dependency qux

## [1.2.0] - 2026-01-19

### Added
- OODA loops MCP integration
- Specification workflow prompts
...
```

**Categories** (in order):
1. **Added** - New features
2. **Changed** - Changes to existing functionality
3. **Deprecated** - Soon-to-be removed features
4. **Removed** - Removed features
5. **Fixed** - Bug fixes
6. **Security** - Vulnerability fixes

### REQ-2: Conventional Commits Parsing (MUST)

Parse commit messages following [Conventional Commits](https://www.conventionalcommits.org/):

**Format**: `<type>[optional scope]: <description>`

**Types**:
- `feat`: New feature → **Added** section
- `fix`: Bug fix → **Fixed** section
- `docs`: Documentation → **Changed** section (or omit from changelog)
- `style`: Formatting → Omit from changelog
- `refactor`: Code refactor → **Changed** section
- `perf`: Performance → **Changed** section
- `test`: Tests → Omit from changelog
- `chore`: Maintenance → Omit from changelog
- `security`: Security fix → **Security** section
- `breaking`: Breaking change (or `!` suffix) → **Changed** or **Removed** with note

**Examples**:
```
feat(loops): Add OODA loops MCP integration
fix(analytics): Resolve concurrent write issue in loop-usage.jsonl
docs: Update README with loops documentation
perf(catalog): Cache hot-loops.json for faster sorting
security: Patch XSS vulnerability in loop content rendering
feat!: Remove deprecated thoughtbox_v1 tool (BREAKING CHANGE)
```

### REQ-3: Agent-Assisted Entry Generation (SHOULD)

**Problem**: Commit messages are technical. Changelog entries should be user-friendly.

**Solution**: Agent workflow to enhance commit messages into changelog entries

**Workflow**:
```
Git commits → Extract conventional commits → Agent enhances → Changelog entries
```

**Agent task**:
- Input: `feat(loops): Add OODA loops MCP integration`
- Output: `OODA loops available as MCP resources with usage analytics for codebase learning`

**Agent prompt**:
```markdown
Convert this commit message into a user-friendly changelog entry:

Commit: {{commit_message}}
Files changed: {{file_list}}
PR description (if available): {{pr_description}}

Requirements:
- Keep it concise (1-2 lines)
- Focus on user benefit, not implementation
- Use present tense ("Add" not "Added")
- Avoid jargon unless necessary
- Link to docs if complex feature
```

### REQ-4: Multi-Trigger Update System (MUST)

**Trigger 1: Pre-Commit Hook** (Local Development)
```bash
# .claude/hooks/pre-commit
# Run on every commit
# Updates [Unreleased] section in real-time
```

**Trigger 2: GitHub Action** (PR Merge)
```yaml
# .github/workflows/changelog.yml
# Runs when PR merged to main
# Updates [Unreleased] with PR changes
# Agent enhances entries
```

**Trigger 3: Release Hook** (Version Bump)
```bash
# On version bump (git tag)
# Move [Unreleased] → [Version] - Date
# Generate release notes
# Create GitHub release
```

**Trigger 4: Manual** (Slash Command)
```bash
/changelog update     # Update [Unreleased] from recent commits
/changelog release    # Move [Unreleased] to versioned section
/changelog enhance    # Agent enhances existing entries
```

### REQ-5: Thoughtbox Integration (SHOULD)

**Store changelog generation sessions**:
```
.claude/thoughtbox/changelog-sessions/
└── {date}-{version}/
    ├── commits-analyzed.json
    ├── agent-reasoning.json
    └── final-entries.md
```

**Use thoughtbox for**:
- Analyzing commit diffs to understand impact
- Grouping related commits
- Identifying breaking changes
- Writing user-friendly descriptions

### REQ-6: Validation & Quality Gates (SHOULD)

**Pre-merge checks**:
- [ ] All commits since last release have changelog entries
- [ ] No duplicate entries
- [ ] Links to issues/PRs valid
- [ ] Breaking changes clearly marked
- [ ] Security fixes in Security section

**CI validation**:
```bash
npm run changelog:validate
```

---

## Design: Agent-Native Changelog Workflow

### Architecture

```
┌──────────────────────────────────────────────────────┐
│ TRIGGER: PR merged to main                           │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│ GitHub Action: changelog-update.yml                  │
│                                                       │
│ 1. Extract commits since last changelog update       │
│ 2. Parse conventional commit messages                │
│ 3. Call Claude API with changelog-enhance prompt     │
│ 4. Agent generates user-friendly entries             │
│ 5. Update CHANGELOG.md [Unreleased]                  │
│ 6. Commit changes (bot)                              │
└──────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│ CHANGELOG.md Updated                                  │
│                                                       │
│ ## [Unreleased]                                       │
│                                                       │
│ ### Added                                             │
│ - OODA loops available as MCP resources with usage   │
│   analytics for codebase learning                    │
│ - Specification workflow prompts (designer,          │
│   validator, orchestrator, suite)                    │
│                                                       │
│ ### Changed                                           │
│ - Build pipeline now includes loop embedding step    │
└──────────────────────────────────────────────────────┘
```

### Agent Workflow (Thoughtbox-Powered)

**Prompt**: `thoughtbox://prompts/changelog-enhance`

```markdown
# Changelog Entry Enhancement

**Task**: Convert technical commits into user-friendly changelog entries

**Input**: {{commits_json}}

**Instructions**:

Use Thoughtbox to reason about these commits:

1. Group related commits (same feature/fix)
2. Identify user impact (what changed from user perspective)
3. Categorize (Added/Changed/Fixed/Security/etc.)
4. Write concise, benefit-focused entries
5. Identify breaking changes
6. Link to docs/issues where helpful

**Output Format**:

\`\`\`json
{
  "added": [
    "OODA loops available as MCP resources with usage analytics"
  ],
  "changed": [
    "Build pipeline now includes loop embedding step"
  ],
  "fixed": [],
  "security": []
}
\`\`\`

**Guidelines**:
- Present tense ("Add" not "Added")
- 1-2 lines per entry max
- Focus on "what" not "how"
- Avoid jargon (or explain if necessary)
- Group related commits into single entry
```

---

## Implementation Plan

### Phase 1: Basic Structure (Week 1)

**Files to Create**:
1. `CHANGELOG.md` - Initialize with current version
2. `scripts/changelog-parse.ts` - Parse conventional commits
3. `scripts/changelog-update.ts` - Update Unreleased section
4. `.github/workflows/changelog.yml` - GitHub Action

**Deliverable**: Automated Unreleased section updates on PR merge

### Phase 2: Agent Enhancement (Week 2)

**Files to Create**:
1. `src/prompts/contents/changelog-enhance-content.ts` - Agent prompt
2. `scripts/changelog-enhance.ts` - Call Claude API with context

**Deliverable**: Human-quality changelog entries

### Phase 3: Release Automation (Week 3)

**Files to Create**:
1. `scripts/changelog-release.ts` - Move Unreleased → Version
2. `.github/workflows/release.yml` - Auto-release workflow

**Deliverable**: One-command releases with changelog

### Phase 4: Validation & Quality (Week 4)

**Files to Create**:
1. `scripts/changelog-validate.ts` - Validate format
2. CI check in changelog.yml

**Deliverable**: Changelog quality gates

---

## Technical Specification

### Scripts to Create

#### `scripts/changelog-parse.ts`

```typescript
interface ParsedCommit {
  type: string;  // feat, fix, etc.
  scope?: string;
  description: string;
  breaking: boolean;
  body?: string;
  hash: string;
  author: string;
  date: string;
}

function parseConventionalCommit(message: string): ParsedCommit | null {
  // Parse format: type(scope): description
  const regex = /^(\w+)(\([\w-]+\))?(!)?:\s*(.+)$/;
  const match = message.match(regex);

  if (!match) return null;

  return {
    type: match[1],
    scope: match[2]?.replace(/[()]/g, ''),
    breaking: match[3] === '!',
    description: match[4],
    // ... extract from git log
  };
}

function categorizeCommit(commit: ParsedCommit): ChangeCategory {
  const typeMap = {
    feat: 'added',
    fix: 'fixed',
    perf: 'changed',
    refactor: 'changed',
    security: 'security',
    docs: 'skip',  // Don't include in changelog
    test: 'skip',
    chore: 'skip',
  };

  if (commit.breaking) {
    return 'changed';  // Breaking changes in Changed section with note
  }

  return typeMap[commit.type] || 'skip';
}
```

#### `scripts/changelog-update.ts`

```typescript
async function updateChangelog(commits: ParsedCommit[]): Promise<void> {
  // Read current CHANGELOG.md
  const changelog = await fs.readFile('CHANGELOG.md', 'utf-8');

  // Find [Unreleased] section
  const unreleasedSection = extractUnreleasedSection(changelog);

  // Categorize commits
  const categorized = categor izeCommits(commits);

  // Generate new entries
  const newEntries = {
    added: categorized.added.map(c => `- ${c.description}`),
    changed: categorized.changed.map(c => `- ${c.description}`),
    fixed: categorized.fixed.map(c => `- ${c.description}`),
    security: categorized.security.map(c => `- ${c.description}`),
  };

  // Merge with existing entries (deduplicate)
  const merged = mergeEntries(unreleasedSection, newEntries);

  // Update CHANGELOG.md
  const updated = replaceUnreleasedSection(changelog, merged);

  await fs.writeFile('CHANGELOG.md', updated, 'utf-8');
}
```

### GitHub Action

#### `.github/workflows/changelog.yml`

```yaml
name: Update Changelog

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  update-changelog:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for commit parsing

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Extract commits from PR
        id: commits
        run: |
          git log --format="%H|%s|%an|%ad" \
            origin/main..${{ github.event.pull_request.head.sha }} \
            > commits.txt

      - name: Update changelog (basic)
        run: npx tsx scripts/changelog-update.ts commits.txt

      - name: Enhance with Claude (optional)
        if: env.ANTHROPIC_API_KEY
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npx tsx scripts/changelog-enhance.ts

      - name: Commit changelog
        run: |
          git config user.name "thoughtbox-bot"
          git config user.email "bot@thoughtbox.dev"
          git add CHANGELOG.md
          git commit -m "docs: Update changelog for PR #${{ github.event.pull_request.number }}" || echo "No changes"
          git push
```

### Slash Command

#### `.claude/commands/meta/changelog.md`

```markdown
# /changelog

Manage project changelog using agent-enhanced workflow

## Usage

\`\`\`bash
/changelog update      # Update [Unreleased] from recent commits
/changelog release <version>  # Move Unreleased → Version
/changelog enhance     # Agent-enhance existing entries
/changelog validate    # Check format and completeness
\`\`\`

## Workflow

### Update [Unreleased]

1. Extract commits since last changelog update
2. Parse conventional commit messages
3. Categorize by type
4. Use Thoughtbox to enhance descriptions
5. Update CHANGELOG.md

### Release Version

1. Validate [Unreleased] section complete
2. Prompt for version number (or use package.json)
3. Move [Unreleased] → [Version] - Date
4. Create git tag
5. Generate GitHub release notes
6. Clear [Unreleased]

### Enhance Entries

Use agent to improve existing changelog entries:
- Make more user-friendly
- Add context
- Fix jargon
- Ensure consistent tone
```

---

## Design Options

### Option A: Git Hooks (Local, Real-Time)

**Pros**:
- Immediate feedback
- Catches missing changelog updates before push
- Works offline

**Cons**:
- Developers can bypass hooks
- Requires local setup
- Can slow down commits

**Implementation**:
```bash
# .claude/hooks/pre-commit
# Check if code changed but CHANGELOG.md didn't
if [[ $(git diff --cached --name-only | grep -v CHANGELOG.md) ]] && \
   [[ ! $(git diff --cached --name-only | grep CHANGELOG.md) ]]; then
  echo "⚠️  Code changed but CHANGELOG.md not updated"
  echo "Run: /changelog update"
  exit 1
fi
```

### Option B: GitHub Actions (Automated, Post-Merge)

**Pros**:
- Centralized (can't be bypassed)
- Consistent (same agent, same prompts)
- Async (doesn't slow down development)

**Cons**:
- Requires API keys (cost)
- Post-merge (not preventive)
- Requires network

**Implementation**: See `.github/workflows/changelog.yml` above

### Option C: Hybrid (Recommended)

**Local**: Warning hook (non-blocking)
```bash
# Warn but don't block
echo "⚠️  Consider updating CHANGELOG.md"
echo "Run: /changelog update"
exit 0  # Don't block commit
```

**GitHub Action**: Automated enhancement
- Runs on PR merge
- Agent enhances entries
- Commits back to main

**Result**: Best of both worlds - local reminders + automated quality

---

## Integration with Thoughtbox

### Changelog Enhancement Prompt

**Register as**: `thoughtbox://prompts/changelog-enhance`

```typescript
export const CHANGELOG_ENHANCE_PROMPT = {
  name: "changelog-enhance",
  description: "Enhance technical commit messages into user-friendly changelog entries using Thoughtbox reasoning",
  arguments: [
    {
      name: "commits",
      description: "JSON array of commits to enhance",
      required: true,
    },
    {
      name: "pr_context",
      description: "PR description and discussion context",
      required: false,
    },
  ],
};
```

**Content**:
```markdown
# Changelog Entry Enhancement

Use Thoughtbox to analyze commits and generate user-friendly changelog entries.

## Input

Commits: {{commits}}
PR Context: {{pr_context}}

## Process

1. **OBSERVE**: Read all commits, diffs, PR discussion
2. **ORIENT**: Group related commits, identify user impact
3. **DECIDE**: Categorize (Added/Changed/Fixed/etc.)
4. **ACT**: Write concise, benefit-focused entries

## Output

JSON object with categorized entries:

\`\`\`json
{
  "added": ["Entry 1", "Entry 2"],
  "changed": ["Entry 3"],
  "fixed": ["Entry 4"],
  "security": [],
  "breaking": ["Entry 5 (BREAKING: Old API removed)"]
}
\`\`\`

## Guidelines

- Present tense ("Add" not "Added")
- 1-2 lines per entry
- User benefit, not implementation
- Group related commits
- Mark breaking changes clearly
```

### Usage Analytics for Changelog

**Record changelog accesses**:
```jsonl
{"timestamp":"2026-01-19T10:00:00Z","action":"update","commits":5,"entries_added":3}
{"timestamp":"2026-01-19T11:00:00Z","action":"release","version":"1.3.0"}
```

**Stored in**: `.claude/thoughtbox/changelog-sessions/`

**Benefits**:
- Track changelog maintenance frequency
- Identify which features get documented
- Measure agent enhancement effectiveness

---

## File Structure

```
project/
├── CHANGELOG.md                         # The changelog itself
├── scripts/
│   ├── changelog-parse.ts              # Parse conventional commits
│   ├── changelog-update.ts             # Update Unreleased section
│   ├── changelog-enhance.ts            # Agent enhancement
│   ├── changelog-release.ts            # Version release
│   └── changelog-validate.ts           # Format validation
├── .github/workflows/
│   └── changelog.yml                   # Automated updates
├── .claude/
│   ├── commands/meta/changelog.md      # Slash command
│   ├── hooks/pre-commit                # Local reminder
│   └── thoughtbox/changelog-sessions/  # Enhancement sessions
└── src/prompts/contents/
    └── changelog-enhance-content.ts    # Agent prompt
```

---

## Examples

### Current State (Manual)
```markdown
## [Unreleased]

### Added
- loops mcp stuff
- spec commands

### Changed
- build script
```

**Problems**: Vague, no context, hard to understand

### Desired State (Agent-Enhanced)
```markdown
## [Unreleased]

### Added
- OODA loops available as MCP resources (`thoughtbox://loops/*`) with automatic usage analytics that enable codebase learning over time ([SPEC-CHG-001](specs/SPEC-CHG-001.md))
- Specification workflow prompts for systematic spec design, validation, and multi-spec orchestration (`/mcp__thoughtbox__spec-designer`, etc.)

### Changed
- Build pipeline now includes OODA loop embedding step, processing `.claude/commands/loops/` at build time for zero-runtime-overhead resource serving
- Loop catalog sorted by usage frequency when `.claude/thoughtbox/hot-loops.json` available (codebase learning in action)

### Infrastructure
- Added ClaudeFolderIntegration class for `.claude/` folder integration with graceful degradation
- Installed `gray-matter` dependency for YAML frontmatter parsing
```

**Benefits**: Clear, contextual, user-friendly, links to specs

---

## Success Criteria

- [ ] CHANGELOG.md follows Keep a Changelog format
- [ ] Automated updates on PR merge
- [ ] Agent enhancement produces readable entries
- [ ] Breaking changes clearly marked
- [ ] Links to issues/PRs/docs
- [ ] Validation prevents incomplete changelogs
- [ ] `/changelog` command works locally
- [ ] Zero manual overhead for developers

---

## Migration Plan

### Week 1: Foundation
1. Create CHANGELOG.md with historical entries (bootstrap)
2. Implement changelog-parse.ts and changelog-update.ts
3. Add GitHub Action for basic automation

### Week 2: Agent Enhancement
1. Create changelog-enhance prompt for Thoughtbox
2. Implement changelog-enhance.ts (Claude API integration)
3. Test with recent PRs

### Week 3: Slash Command
1. Create /changelog slash command
2. Integrate with local git hooks (warning)
3. Document workflow

### Week 4: Validation & Polish
1. Implement changelog-validate.ts
2. Add CI checks
3. Refine agent prompts based on usage

---

## Cost Considerations

### Agent Enhancement Cost

**Per PR** (assuming 10 commits):
- Input: ~2K tokens (commit messages + diffs)
- Output: ~500 tokens (enhanced entries)
- **Cost**: ~$0.01 per PR (at Sonnet 4.5 pricing)

**Monthly** (assuming 100 PRs):
- **Cost**: ~$1/month

**Conclusion**: Extremely cheap for the value provided

### Alternatives (If Cost Sensitive)

1. **Human-in-Loop**: Agent suggests, human approves
2. **Threshold**: Only enhance for releases, not every PR
3. **Cache**: Reuse enhancements for similar commits
4. **Haiku**: Use cheaper model for simple enhancements

---

## References & Prior Art

### Keep a Changelog
- [Official Spec](https://keepachangelog.com/en/1.0.0/)
- [Common Changelog](https://common-changelog.org/) (extended version)

### Conventional Commits
- [Specification](https://www.conventionalcommits.org/)
- [commitlint](https://commitlint.js.org/) - Enforce format
- [Commitizen](https://github.com/commitizen/cz-cli) - Interactive commit helper

### Automation Tools
- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) - Generate from commits
- [git-cliff](https://git-cliff.org/) - Customizable changelog generator
- [semantic-release](https://github.com/semantic-release/semantic-release) - Full release automation
- [standard-version](https://github.com/conventional-changelog/standard-version) - SemVer + changelog

### GitHub Actions
- [Changelog Generator](https://github.com/marketplace/actions/generate-changelog-based-on-conventional-commits)
- [Changelog from Conventional Commits](https://github.com/marketplace/actions/changelog-from-conventional-commits)

---

## Open Questions

1. **Should we enforce conventional commits?**
   - Option A: Soft enforcement (warning)
   - Option B: Hard enforcement (commitlint + husky)
   - **Recommendation**: Soft - warn but don't block

2. **How to handle changelog for multiple packages?**
   - If Thoughtbox becomes monorepo
   - Option: One CHANGELOG.md with sections per package
   - Option: Separate CHANGELOG.md per package

3. **Should agent enhancement be required or optional?**
   - Required: Better quality, but costs tokens
   - Optional: Manual fallback if API unavailable
   - **Recommendation**: Optional with fallback

4. **Where to store enhancement sessions?**
   - `.claude/thoughtbox/changelog-sessions/`
   - `data/thoughtbox/sessions/` (with thought chains)
   - **Recommendation**: .claude/ (version-controlled learning)

---

## Success Metrics

**Quality**:
- Changelog entries understandable by non-developers
- Breaking changes clearly marked
- Links to docs for complex features

**Automation**:
- >90% of changelog updates automated
- <5 minutes from PR merge to changelog update
- Zero developer overhead

**Adoption**:
- Changelog checked before releases
- Users reference changelog for "what's new"
- Developers use /changelog command

---

## Sources

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Conventional Commits](https://www.conventionalcommits.org/en/about/)
- [CloudBees: Changelog Best Practices](https://www.cloudbees.com/blog/appy-changelog-best-practices-development)
- [Amoeboids: How to Write a Good Changelog](https://amoeboids.com/blog/changelog-how-to-write-good-one/)
- [GitHub: conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)
- [git-cliff: Changelog Generator](https://git-cliff.org/)
- [Perforce: Version Control Best Practices](https://www.perforce.com/blog/vcs/8-version-control-best-practices)
- [Medium: Semantic Versioning and Changelogs](https://medium.com/@gabrielrumbaut/releases-the-easy-way-3ec1c2c3502b)

---

**Status**: SPECIFICATION (not yet implemented)
**Next Step**: Create CHANGELOG.md and implement Phase 1
**Estimated Effort**: 2-3 weeks for full system
**Quick Win**: Basic automation (Phase 1) can be done in 2-3 days
