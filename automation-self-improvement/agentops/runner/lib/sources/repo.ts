/**
 * GitHub Repository Signal Collection
 * Fetches commits and issues as signals
 */

import { Octokit } from '@octokit/rest';
import type { SignalItem } from './types.js';

export interface RepoConfig {
  owner: string;
  repo: string;
  token?: string;
  lookbackHours?: number;
}

/**
 * Collect signals from GitHub repository (commits + issues)
 */
export async function collectRepoSignals(
  config: RepoConfig
): Promise<SignalItem[]> {
  const signals: SignalItem[] = [];
  const lookbackHours = config.lookbackHours || 168; // Default: 1 week
  const sinceDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  const octokit = new Octokit({
    auth: config.token || process.env.GITHUB_TOKEN,
  });

  try {
    // Fetch recent commits
    const { data: commits } = await octokit.repos.listCommits({
      owner: config.owner,
      repo: config.repo,
      since: sinceDate.toISOString(),
      per_page: 10,
    });

    for (const commit of commits) {
      signals.push({
        source: 'repo_commits',
        title: commit.commit.message.split('\n')[0], // First line only
        url: commit.html_url,
        published_at: commit.commit.author?.date,
        summary: commit.commit.message,
        tags: ['commit'],
      });
    }

    // Fetch open issues with priority labels
    const { data: issues } = await octokit.issues.listForRepo({
      owner: config.owner,
      repo: config.repo,
      state: 'open',
      labels: 'priority',
      per_page: 10,
    });

    for (const issue of issues) {
      signals.push({
        source: 'repo_issues',
        title: issue.title,
        url: issue.html_url,
        published_at: issue.created_at,
        summary: issue.body || '',
        tags: issue.labels.map((l) =>
          typeof l === 'string' ? l : l.name || ''
        ),
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to collect repo signals: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return signals;
}
