/**
 * GitHub API wrapper using Octokit
 */

import { Octokit } from '@octokit/rest';
import type { GitHubIssue, GitHubComment } from '../types.js';

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Create a new issue
   */
  async createIssue(
    title: string,
    body: string,
    labels: string[]
  ): Promise<GitHubIssue> {
    const response = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      labels,
    });

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body || '',
      labels: response.data.labels.map((l) =>
        typeof l === 'string' ? { name: l } : { name: l.name || '' }
      ),
      html_url: response.data.html_url,
    };
  }

  /**
   * Get issue by number
   */
  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    const response = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body || '',
      labels: response.data.labels.map((l) =>
        typeof l === 'string' ? { name: l } : { name: l.name || '' }
      ),
      html_url: response.data.html_url,
    };
  }

  /**
   * Post a comment on an issue
   */
  async createComment(
    issueNumber: number,
    body: string
  ): Promise<GitHubComment> {
    const response = await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body,
    });

    return {
      id: response.data.id,
      body: response.data.body || '',
      html_url: response.data.html_url,
    };
  }

  /**
   * Add labels to an issue
   */
  async addLabels(issueNumber: number, labels: string[]): Promise<void> {
    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels,
    });
  }

  /**
   * Remove label from an issue
   */
  async removeLabel(issueNumber: number, label: string): Promise<void> {
    await this.octokit.issues.removeLabel({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      name: label,
    });
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string, baseSha: string): Promise<void> {
    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    head: string,
    base: string,
    body: string,
    draft: boolean = true
  ): Promise<{ number: number; html_url: string }> {
    const response = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title,
      head,
      base,
      body,
      draft,
    });

    return {
      number: response.data.number,
      html_url: response.data.html_url,
    };
  }

  /**
   * Get current repository information
   */
  async getRepo(): Promise<{
    default_branch: string;
    html_url: string;
  }> {
    const response = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo,
    });

    return {
      default_branch: response.data.default_branch,
      html_url: response.data.html_url,
    };
  }

  /**
   * Get commit SHA for a ref
   */
  async getRefSha(ref: string): Promise<string> {
    const response = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${ref}`,
    });

    return response.data.object.sha;
  }

  /**
   * Parse label to extract mode and proposal ID
   */
  static parseLabel(
    label: string
  ): { mode: 'SMOKE' | 'REAL'; proposalId: string } | null {
    // Match smoke:proposal-N or approved:proposal-N
    const smokeMatch = label.match(/^smoke:(proposal-\d+)$/);
    if (smokeMatch) {
      return { mode: 'SMOKE', proposalId: smokeMatch[1] };
    }

    const approvedMatch = label.match(/^approved:(proposal-\d+)$/);
    if (approvedMatch) {
      return { mode: 'REAL', proposalId: approvedMatch[1] };
    }

    return null;
  }
}

/**
 * Get GitHub context from environment variables
 */
export function getGitHubContext(): {
  token: string;
  owner: string;
  repo: string;
  sha: string;
  ref: string;
  runId: string;
  runNumber: string;
  actor: string;
} {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY environment variable is required');
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY format: ${repository}`);
  }

  return {
    token,
    owner,
    repo,
    sha: process.env.GITHUB_SHA || 'unknown',
    ref: process.env.GITHUB_REF || 'unknown',
    runId: process.env.GITHUB_RUN_ID || 'unknown',
    runNumber: process.env.GITHUB_RUN_NUMBER || 'unknown',
    actor: process.env.GITHUB_ACTOR || 'unknown',
  };
}
