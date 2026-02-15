# SPEC-SIL-005: Real-World Issue Scraper

> **Status**: Draft
> **Priority**: MEDIUM
> **Week**: 2 (Benchmark Infrastructure)
> **Phase**: Discovery
> **Estimated Effort**: 4-6 hours

## Summary

Build a GitHub issue scraper that fetches closed bug issues from target repositories with high agentic user bases, providing real-world test cases for evaluation.

## Problem Statement

Synthetic benchmarks can be gamed. Real-world issues from active repositories:
- Have verified solutions (closed with PR)
- Represent actual user problems
- Are harder to memorize/game
- Refresh naturally as new issues are closed

Target repos: langchain, langgraph, OpenHands, aider (per user request for "repos with high agentic user bases").

## Scope

### In Scope
- GitHub API integration
- Fetch closed bug issues
- Filter for reproduction steps + verified fix
- Extract ground truth (PR diff)
- Store in structured format

### Out of Scope
- Issue difficulty classification (future)
- Automated reproduction validation
- Non-GitHub sources

## Requirements

### R1: Repository Configuration
```typescript
interface TargetRepo {
  owner: string;
  repo: string;
  labels: string[];
  since?: Date;
}
```

### R2: Issue Filtering
Filter for issues that have:
- Clear reproduction steps
- Verified fix (linked PR merged)
- Appropriate scope (not too large)

### R3: Ground Truth Extraction
```typescript
interface ScrapedIssue {
  id: string;
  repo: string;
  number: number;
  title: string;
  body: string;
  reproduction_steps: string;
  fix_pr: {
    number: number;
    diff: string;
    files_changed: string[];
  };
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
  closed_at: string;
}
```

### R4: Rate Limiting
Respect GitHub API rate limits (5000/hour authenticated).

## Technical Approach

### Implementation

```typescript
// benchmarks/issue-scraper.ts

import { Octokit } from '@octokit/rest';

interface TargetRepo {
  owner: string;
  repo: string;
  labels: string[];
}

interface ScrapedIssue {
  id: string;
  repo: string;
  number: number;
  title: string;
  body: string;
  reproduction_steps: string;
  fix_pr: {
    number: number;
    diff: string;
    files_changed: string[];
  } | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
  closed_at: string;
}

// Target repos with high agentic user bases
const TARGET_REPOS: TargetRepo[] = [
  { owner: 'langchain-ai', repo: 'langchain', labels: ['bug'] },
  { owner: 'langchain-ai', repo: 'langgraph', labels: ['bug'] },
  { owner: 'All-Hands-AI', repo: 'OpenHands', labels: ['bug'] },
  { owner: 'Aider-AI', repo: 'aider', labels: ['bug'] },
  { owner: 'anthropics', repo: 'anthropic-cookbook', labels: ['bug'] }
];

export class IssueScraper {
  private octokit: Octokit;
  private cache: Map<string, ScrapedIssue> = new Map();

  constructor(githubToken?: string) {
    this.octokit = new Octokit({
      auth: githubToken || process.env.GITHUB_TOKEN
    });
  }

  /**
   * Scrape closed bug issues from target repos.
   */
  async scrapeAgenticIssues(
    repos: TargetRepo[] = TARGET_REPOS,
    options: { since?: Date; maxPerRepo?: number } = {}
  ): Promise<ScrapedIssue[]> {
    const { since = this.getDefaultSince(), maxPerRepo = 50 } = options;
    const allIssues: ScrapedIssue[] = [];

    for (const repo of repos) {
      try {
        const issues = await this.scrapeRepo(repo, since, maxPerRepo);
        allIssues.push(...issues);
        console.log(`Scraped ${issues.length} issues from ${repo.owner}/${repo.repo}`);
      } catch (error) {
        console.error(`Failed to scrape ${repo.owner}/${repo.repo}:`, error);
      }

      // Rate limiting: wait between repos
      await this.sleep(1000);
    }

    return allIssues;
  }

  private async scrapeRepo(
    repo: TargetRepo,
    since: Date,
    maxIssues: number
  ): Promise<ScrapedIssue[]> {
    const issues = await this.octokit.issues.listForRepo({
      owner: repo.owner,
      repo: repo.repo,
      state: 'closed',
      labels: repo.labels.join(','),
      since: since.toISOString(),
      per_page: 100,
      sort: 'updated',
      direction: 'desc'
    });

    const scraped: ScrapedIssue[] = [];

    for (const issue of issues.data.slice(0, maxIssues)) {
      // Skip pull requests
      if (issue.pull_request) continue;

      // Check for reproduction steps
      if (!this.hasReproductionSteps(issue.body || '')) continue;

      // Find linked PR
      const linkedPR = await this.findLinkedPR(repo, issue.number);
      if (!linkedPR) continue;  // Skip issues without verified fix

      scraped.push({
        id: `${repo.owner}/${repo.repo}#${issue.number}`,
        repo: `${repo.owner}/${repo.repo}`,
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        reproduction_steps: this.extractReproductionSteps(issue.body || ''),
        fix_pr: linkedPR,
        created_at: issue.created_at,
        closed_at: issue.closed_at || new Date().toISOString()
      });

      // Cache for deduplication
      this.cache.set(scraped[scraped.length - 1].id, scraped[scraped.length - 1]);

      // Rate limiting
      await this.sleep(100);
    }

    return scraped;
  }

  private hasReproductionSteps(body: string): boolean {
    const patterns = [
      /steps to reproduce/i,
      /how to reproduce/i,
      /reproduction/i,
      /to reproduce/i,
      /minimal example/i,
      /```[\s\S]+```/  // Has code block
    ];
    return patterns.some(p => p.test(body));
  }

  private extractReproductionSteps(body: string): string {
    // Try to extract the reproduction section
    const patterns = [
      /(?:steps to reproduce|how to reproduce|reproduction)[:\s]*([\s\S]*?)(?=\n#{1,3}\s|\n\*\*|$)/i,
      /```[\s\S]*?```/g  // Fall back to code blocks
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return body;
  }

  private async findLinkedPR(
    repo: TargetRepo,
    issueNumber: number
  ): Promise<ScrapedIssue['fix_pr']> {
    try {
      // Get timeline to find linked PRs
      const timeline = await this.octokit.issues.listEventsForTimeline({
        owner: repo.owner,
        repo: repo.repo,
        issue_number: issueNumber,
        per_page: 100
      });

      // Look for cross-reference or connected events
      for (const event of timeline.data) {
        if (
          event.event === 'cross-referenced' &&
          (event as any).source?.issue?.pull_request
        ) {
          const prNumber = (event as any).source.issue.number;

          // Get PR details
          const pr = await this.octokit.pulls.get({
            owner: repo.owner,
            repo: repo.repo,
            pull_number: prNumber
          });

          // Only use merged PRs
          if (!pr.data.merged) continue;

          // Get diff
          const diff = await this.octokit.pulls.get({
            owner: repo.owner,
            repo: repo.repo,
            pull_number: prNumber,
            mediaType: { format: 'diff' }
          });

          // Get files changed
          const files = await this.octokit.pulls.listFiles({
            owner: repo.owner,
            repo: repo.repo,
            pull_number: prNumber
          });

          return {
            number: prNumber,
            diff: diff.data as unknown as string,
            files_changed: files.data.map(f => f.filename)
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to find linked PR for issue #${issueNumber}:`, error);
      return null;
    }
  }

  private getDefaultSince(): Date {
    // Default: last 90 days
    const since = new Date();
    since.setDate(since.getDate() - 90);
    return since;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
export const issueScraper = new IssueScraper();
```

## Files

### New Files
| File | Purpose |
|------|---------|
| `benchmarks/issue-scraper.ts` | GitHub issue scraping |
| `benchmarks/issue-scraper.test.ts` | Unit tests |

## Acceptance Criteria

- [ ] Scrapes closed issues from target repos
- [ ] Filters for reproduction steps
- [ ] Extracts linked PR diff
- [ ] Respects rate limits
- [ ] Stores in structured format
- [ ] Unit tests pass

## Gates

### Entry Gate
- GitHub token available
- Target repos accessible

### Exit Gate
- Successfully scrapes issues from all target repos
- At least 10 issues with valid reproduction + fix

## Dependencies

- @octokit/rest package
- GitHub token (env: GITHUB_TOKEN)

## Blocked By

- None

## Blocks

- SPEC-SIL-003 (Provides fresh issues for rotation)
- SPEC-SIL-008 (Held-Out Manager)

---

**Created**: 2026-01-19
**Source**: PLAN Week 2, Section 2.3
