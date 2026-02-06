/**
 * Proposal Synthesis
 * Uses LLM to generate proposals from signals
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Proposal } from '../types.js';
import type { SignalCollection } from './sources/types.js';
import type { SynthesisResult } from './llm/types.js';
import { getLLMConfig, callLLM } from './llm/provider.js';
import { validateProposalsPayload } from './template.js';

export interface RepoContext {
  owner: string;
  repo: string;
  ref: string;
  sha: string;
}

export interface SynthesisOutput {
  result: SynthesisResult;
  llmCost: number;
}

export interface SynthesisOptions {
  fixturesMode?: boolean;
}

/**
 * Synthesize proposals from signals using LLM
 */
export async function synthesizeProposals(
  signals: SignalCollection,
  repoContext: RepoContext,
  options?: SynthesisOptions
): Promise<SynthesisOutput> {
  // Return fixture data immediately if in fixtures mode
  if (options?.fixturesMode) {
    console.log('  ⚙️  Using FIXTURE MODE (no LLM call, zero cost)');
    const fixturesPath = path.join(process.cwd(), 'agentops/fixtures/proposals.example.json');
    const fixtureData = JSON.parse(await fs.readFile(fixturesPath, 'utf-8'));

    // Create a fake digest from signals
    const digest = signals.signals.slice(0, 3).map(s => ({
      title: s.title,
      url: s.url,
      published_at: s.published_at || new Date().toISOString(),
      why_it_matters: s.summary?.substring(0, 100) || 'Development signal',
      tags: s.tags || [],
    }));

    return {
      result: {
        digest,
        proposals: fixtureData.proposals,
      },
      llmCost: 0,
    };
  }

  const config = getLLMConfig();
  if (!config) {
    throw new Error('No LLM configuration available');
  }

  // Load prompts
  const promptsDir = path.join(process.cwd(), 'agentops/prompts');
  const synthesizerPrompt = await fs.readFile(
    path.join(promptsDir, 'dev_brief_synthesizer.md'),
    'utf-8'
  );
  const repairPrompt = await fs.readFile(
    path.join(promptsDir, 'dev_brief_repair.md'),
    'utf-8'
  );

  // Build context
  const context = buildContext(signals, repoContext);

  // First attempt: synthesizer
  console.log(`  ⚙️  Calling ${config.provider}/${config.model}...`);
  const response = await callLLM(config, synthesizerPrompt, context);
  let totalCost = response.usage?.cost_usd_calculated || 0;

  // Parse JSON
  let parsedResult = parseJSONResponse(response.content);

  // If invalid, try repair
  if (!parsedResult) {
    console.log(`  ⚙️  Initial parse failed, attempting repair...`);
    const repairContext = `Original response:\n${response.content}\n\nError: Invalid JSON`;
    const repairResponse = await callLLM(config, repairPrompt, repairContext);
    totalCost += repairResponse.usage?.cost_usd_calculated || 0;

    parsedResult = parseJSONResponse(repairResponse.content);

    if (!parsedResult) {
      throw new Error('Failed to generate valid JSON after repair attempt');
    }
  }

  // Validate schema
  const payload = {
    run_id: 'temp',
    repo_ref: repoContext.ref,
    git_sha: repoContext.sha,
    generated_at: new Date().toISOString(),
    proposals: parsedResult.proposals,
  };

  // Pass collected signals to validator for provenance checking
  const errors = validateProposalsPayload(payload, signals.signals);
  if (errors.length > 0) {
    throw new Error(
      `Invalid proposals schema:\n${errors.join('\n')}`
    );
  }

  return {
    result: parsedResult,
    llmCost: totalCost,
  };
}

/**
 * Build context string from signals and repo metadata
 */
function buildContext(
  signals: SignalCollection,
  repo: RepoContext
): string {
  const sections: string[] = [];

  // Repository info
  sections.push('# Repository Context');
  sections.push(`- Owner: ${repo.owner}`);
  sections.push(`- Repo: ${repo.repo}`);
  sections.push(`- Branch: ${repo.ref}`);
  sections.push(`- SHA: ${repo.sha}`);
  sections.push('');

  // Collection metadata
  sections.push('# Signal Collection Metadata');
  sections.push(`- Collected at: ${signals.metadata.collected_at}`);
  sections.push(`- Total signals: ${signals.metadata.total_signals}`);
  sections.push(`- Sources succeeded: ${signals.metadata.sources_succeeded.join(', ')}`);
  if (signals.metadata.sources_failed.length > 0) {
    sections.push(`- Sources failed: ${signals.metadata.sources_failed.map(f => f.source).join(', ')}`);
  }
  sections.push('');

  // Signals by source
  const bySource = new Map<string, typeof signals.signals>();
  for (const signal of signals.signals) {
    const existing = bySource.get(signal.source) || [];
    existing.push(signal);
    bySource.set(signal.source, existing);
  }

  for (const [source, items] of bySource.entries()) {
    sections.push(`## ${source.toUpperCase()} (${items.length} signals)`);
    sections.push('');

    for (const item of items) {
      sections.push(`### ${item.title}`);
      sections.push(`**URL:** ${item.url}`);
      if (item.published_at) {
        sections.push(`**Published:** ${item.published_at}`);
      }
      if (item.summary) {
        sections.push(`**Summary:** ${item.summary.substring(0, 200)}...`);
      }
      if (item.tags && item.tags.length > 0) {
        sections.push(`**Tags:** ${item.tags.join(', ')}`);
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}

/**
 * Parse JSON response, stripping code fences if present
 */
function parseJSONResponse(content: string): SynthesisResult | null {
  let jsonStr = content.trim();

  // Remove markdown code fences
  const codeFenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeFenceMatch) {
    jsonStr = codeFenceMatch[1].trim();
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
