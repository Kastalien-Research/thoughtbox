# SPEC-SIL-008: Held-Out Test Set Manager

> **Status**: Draft
> **Priority**: MEDIUM
> **Week**: 4 (Autonomous Loop)
> **Phase**: Gaming Prevention
> **Estimated Effort**: 4-6 hours

## Summary

Implement held-out test set management with monthly rotation, stratified selection, and human validation workflow to prevent memorization and gaming.

## Problem Statement

Without held-out rotation:
- Agent may memorize benchmark solutions
- Performance on training set doesn't reflect real capability
- Gaming becomes easier over time as agent sees same tests

Held-out management provides:
- Fresh unseen issues monthly
- Stratified selection across difficulty levels
- Human validation before deployment
- Automatic promotion to training after rotation

## Scope

### In Scope
- Monthly rotation schedule
- Stratified held-out selection
- Human validation workflow (GitHub Issue)
- Promotion of old held-out to training
- Integration with issue scraper

### Out of Scope
- Automated difficulty classification (future)
- Cross-validation splits
- A/B testing infrastructure

## Requirements

### R1: Rotation Tracking
```typescript
interface RotationState {
  currentRotation: Date;
  lastRotation: Date;
  nextRotation: Date;
  heldOutCount: number;
  trainingCount: number;
}
```

### R2: Held-Out Selection
```typescript
interface HeldOutConfig {
  count: number;
  minPerStratum: number;
  requireHumanValidation: boolean;
  validationTimeoutDays: number;
}
```

### R3: Validation Workflow
```typescript
interface ValidationIssue {
  issueNumber: number;
  issues: Issue[];
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  createdAt: string;
  resolvedAt?: string;
}
```

## Technical Approach

### Implementation

```typescript
// benchmarks/held-out-manager.ts

import { Octokit } from '@octokit/rest';
import { BenchmarkSampler } from './sampler';
import { IssueScraper } from './issue-scraper';

interface Issue {
  id: string;
  repo: string;
  number: number;
  title: string;
  body: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution?: string;
}

interface HeldOutConfig {
  count: number;
  minPerStratum: number;
  requireHumanValidation: boolean;
  validationTimeoutDays: number;
  rotationPeriod: 'weekly' | 'monthly';
}

interface RotationState {
  currentRotation: Date;
  lastRotation: Date | null;
  heldOutIds: string[];
  trainingIds: string[];
  validationIssueNumber?: number;
}

interface ValidationIssue {
  issueNumber: number;
  issues: Issue[];
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  createdAt: string;
  resolvedAt?: string;
}

const DEFAULT_CONFIG: HeldOutConfig = {
  count: 50,
  minPerStratum: 10,
  requireHumanValidation: true,
  validationTimeoutDays: 7,
  rotationPeriod: 'monthly'
};

export class HeldOutManager {
  private config: HeldOutConfig;
  private state: RotationState;
  private sampler: BenchmarkSampler;
  private scraper: IssueScraper;
  private octokit: Octokit;
  private repo: { owner: string; repo: string };

  constructor(
    config: Partial<HeldOutConfig> = {},
    repoConfig: { owner: string; repo: string }
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.repo = repoConfig;
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.sampler = new BenchmarkSampler({
      sampleRate: 0.01,
      selection: 'stratified',
      stratificationKey: 'difficulty',
      rotationPeriod: this.config.rotationPeriod,
      validation: { enabled: true, correlationThreshold: 0.9, validationRuns: 3 }
    });
    this.scraper = new IssueScraper();
    this.state = this.loadState();
  }

  /**
   * Check if rotation is needed and perform if so.
   */
  async checkAndRotate(): Promise<boolean> {
    const now = new Date();
    const rotationDate = this.getNextRotationDate();

    if (now >= rotationDate) {
      await this.performRotation();
      return true;
    }

    return false;
  }

  /**
   * Perform monthly rotation:
   * 1. Move current held-out to training
   * 2. Scrape fresh issues
   * 3. Select new held-out
   * 4. Create validation issue
   */
  async performRotation(): Promise<void> {
    console.log('Starting held-out rotation...');

    // Step 1: Promote current held-out to training
    await this.promoteToTraining();

    // Step 2: Scrape fresh issues
    const freshIssues = await this.scrapeFreshIssues();

    // Step 3: Select new held-out with stratification
    const newHeldOut = this.selectForHeldOut(freshIssues);

    // Step 4: Human validation if required
    if (this.config.requireHumanValidation) {
      const validationIssue = await this.createValidationIssue(newHeldOut);
      this.state.validationIssueNumber = validationIssue.issueNumber;
      console.log(`Created validation issue #${validationIssue.issueNumber}`);
    }

    // Update state
    this.state.lastRotation = this.state.currentRotation;
    this.state.currentRotation = new Date();
    this.state.heldOutIds = newHeldOut.map(i => i.id);

    this.saveState();
    console.log(`Rotation complete. New held-out set: ${newHeldOut.length} issues`);
  }

  /**
   * Get current held-out set (if validated).
   */
  async getHeldOutSet(): Promise<Issue[]> {
    // Check validation status if required
    if (this.config.requireHumanValidation && this.state.validationIssueNumber) {
      const status = await this.checkValidationStatus();

      if (status === 'pending') {
        throw new Error('Held-out set pending human validation');
      }

      if (status === 'rejected') {
        throw new Error('Held-out set was rejected - re-run rotation');
      }

      if (status === 'timeout') {
        console.warn('Validation timeout - proceeding with held-out set');
      }
    }

    // Load issues from stored IDs
    return this.loadIssuesByIds(this.state.heldOutIds);
  }

  /**
   * Get training set (includes promoted held-out from previous rotations).
   */
  async getTrainingSet(): Promise<Issue[]> {
    return this.loadIssuesByIds(this.state.trainingIds);
  }

  /**
   * Promote current held-out issues to training set.
   */
  private async promoteToTraining(): Promise<void> {
    // Add current held-out to training
    this.state.trainingIds = [
      ...this.state.trainingIds,
      ...this.state.heldOutIds
    ];

    // Clear held-out
    this.state.heldOutIds = [];

    console.log(`Promoted ${this.state.heldOutIds.length} issues to training`);
  }

  /**
   * Scrape fresh issues from target repositories.
   */
  private async scrapeFreshIssues(): Promise<Issue[]> {
    // Get issues since last rotation
    const since = this.state.lastRotation || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const issues = await this.scraper.scrapeAgenticIssues(undefined, {
      since,
      maxPerRepo: 100
    });

    // Filter out issues already in training
    const existingIds = new Set([...this.state.trainingIds, ...this.state.heldOutIds]);
    const fresh = issues.filter(i => !existingIds.has(i.id));

    console.log(`Scraped ${fresh.length} fresh issues`);
    return fresh as Issue[];
  }

  /**
   * Select issues for held-out set using stratification.
   */
  private selectForHeldOut(candidates: Issue[]): Issue[] {
    // Group by difficulty
    const strata: Record<string, Issue[]> = {
      easy: [],
      medium: [],
      hard: []
    };

    for (const issue of candidates) {
      const difficulty = issue.difficulty || 'medium';
      strata[difficulty].push(issue);
    }

    // Select from each stratum
    const selected: Issue[] = [];
    const perStratum = Math.floor(this.config.count / 3);

    for (const [difficulty, issues] of Object.entries(strata)) {
      const count = Math.min(
        Math.max(perStratum, this.config.minPerStratum),
        issues.length
      );

      // Random selection
      const shuffled = issues.sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, count));
    }

    // If we don't have enough, pad from remaining
    if (selected.length < this.config.count) {
      const remaining = candidates.filter(c => !selected.includes(c));
      const needed = this.config.count - selected.length;
      selected.push(...remaining.slice(0, needed));
    }

    return selected.slice(0, this.config.count);
  }

  /**
   * Create GitHub issue for human validation of held-out set.
   */
  private async createValidationIssue(issues: Issue[]): Promise<ValidationIssue> {
    const body = `
## Held-Out Set Validation Request

A new held-out test set has been selected for the improvement loop.
Please review these issues to ensure they are:

1. ✅ Genuine bugs (not feature requests)
2. ✅ Have clear reproduction steps
3. ✅ Have verified fixes (merged PRs)
4. ✅ Appropriate difficulty distribution

### Selected Issues (${issues.length} total)

${this.formatIssueTable(issues)}

### Actions

- **Approve**: Comment \`/approve\` to use this held-out set
- **Reject**: Comment \`/reject [reason]\` to request re-selection
- **Modify**: Comment \`/remove #X\` to remove specific issues

### Auto-Approval

If no action is taken within ${this.config.validationTimeoutDays} days, this set will be automatically approved.

---
*Generated by Self-Improvement Loop*
    `;

    const response = await this.octokit.issues.create({
      owner: this.repo.owner,
      repo: this.repo.repo,
      title: `[Held-Out Rotation] Validation Required - ${new Date().toISOString().split('T')[0]}`,
      body,
      labels: ['held-out-validation', 'automation']
    });

    return {
      issueNumber: response.data.number,
      issues,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Check validation issue status.
   */
  private async checkValidationStatus(): Promise<'pending' | 'approved' | 'rejected' | 'timeout'> {
    if (!this.state.validationIssueNumber) {
      return 'approved';  // No validation required
    }

    const issue = await this.octokit.issues.get({
      owner: this.repo.owner,
      repo: this.repo.repo,
      issue_number: this.state.validationIssueNumber
    });

    // Check for approval/rejection comments
    const comments = await this.octokit.issues.listComments({
      owner: this.repo.owner,
      repo: this.repo.repo,
      issue_number: this.state.validationIssueNumber
    });

    for (const comment of comments.data) {
      if (comment.body?.includes('/approve')) {
        return 'approved';
      }
      if (comment.body?.includes('/reject')) {
        return 'rejected';
      }
    }

    // Check timeout
    const createdAt = new Date(issue.data.created_at);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation > this.config.validationTimeoutDays) {
      return 'timeout';
    }

    return 'pending';
  }

  /**
   * Format issues as markdown table.
   */
  private formatIssueTable(issues: Issue[]): string {
    const header = '| # | Repository | Issue | Difficulty |';
    const separator = '|---|------------|-------|------------|';

    const rows = issues.map((issue, i) => {
      const link = `[#${issue.number}](https://github.com/${issue.repo}/issues/${issue.number})`;
      return `| ${i + 1} | ${issue.repo} | ${link} | ${issue.difficulty || 'unknown'} |`;
    });

    return [header, separator, ...rows].join('\n');
  }

  /**
   * Calculate next rotation date.
   */
  private getNextRotationDate(): Date {
    const current = this.state.currentRotation;
    const next = new Date(current);

    if (this.config.rotationPeriod === 'monthly') {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);  // First of month
    } else {
      next.setDate(next.getDate() + 7);  // Weekly
    }

    return next;
  }

  /**
   * Load issues by their IDs.
   */
  private async loadIssuesByIds(ids: string[]): Promise<Issue[]> {
    // In practice, this would fetch from local storage or API
    // Placeholder implementation
    return [];
  }

  /**
   * Load state from persistent storage.
   */
  private loadState(): RotationState {
    // In practice, load from file/database
    return {
      currentRotation: new Date(),
      lastRotation: null,
      heldOutIds: [],
      trainingIds: []
    };
  }

  /**
   * Save state to persistent storage.
   */
  private saveState(): void {
    // In practice, save to file/database
  }
}

// Export singleton
let managerInstance: HeldOutManager | null = null;

export function getHeldOutManager(
  config?: Partial<HeldOutConfig>,
  repoConfig?: { owner: string; repo: string }
): HeldOutManager {
  if (!managerInstance && repoConfig) {
    managerInstance = new HeldOutManager(config, repoConfig);
  }
  if (!managerInstance) {
    throw new Error('HeldOutManager not initialized - provide repoConfig');
  }
  return managerInstance;
}
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `benchmarks/held-out-manager.ts` | Held-out set rotation and validation |
| `benchmarks/held-out-manager.test.ts` | Unit tests |

## Acceptance Criteria

- [ ] Monthly rotation detected and executed
- [ ] Stratified selection across difficulty levels
- [ ] GitHub issue created for validation
- [ ] `/approve` and `/reject` commands processed
- [ ] Timeout auto-approval working
- [ ] Old held-out promoted to training

## Gates

### Entry Gate
- SPEC-SIL-005 (Issue Scraper) complete
- GitHub token with issue creation permissions

### Exit Gate
- Rotation cycle working end-to-end
- Human validation workflow functional

## Dependencies

- SPEC-SIL-003 (Sampler for stratification)
- SPEC-SIL-005 (Issue Scraper for fresh issues)
- @octokit/rest package

## Blocked By

- SPEC-SIL-003
- SPEC-SIL-005

## Blocks

- SPEC-SIL-010 (Main Loop)

---

**Created**: 2026-01-19
**Source**: PLAN Week 4, Section 4.2
