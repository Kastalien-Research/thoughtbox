/**
 * Signal Collection Orchestrator
 * Coordinates collection from all enabled sources
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { SignalCollection, SignalItem } from './types.js';
import { collectRepoSignals } from './repo.js';
import { collectArxivSignals } from './arxiv.js';
import { collectRSSSignals } from './rss.js';
import { collectHTMLSignals } from './html.js';

/**
 * Collect signals from all enabled sources
 */
export async function collectSignals(): Promise<SignalCollection> {
  const startTime = Date.now();
  const sourcesAttempted: string[] = [];
  const sourcesSucceeded: string[] = [];
  const sourcesFailed: Array<{ source: string; error: string }> = [];
  const allSignals: SignalItem[] = [];
  const signalsBySource: Record<string, number> = {};
  const elapsedMsBySource: Record<string, number> = {};

  // Load config files
  const sourcesPath = path.join(process.cwd(), 'agentops/config/dev_sources.yaml');
  const policyPath = path.join(process.cwd(), 'agentops/config/dev_brief_policy.yaml');

  let sourcesConfig: any;
  let policyConfig: any;

  try {
    sourcesConfig = yaml.parse(await fs.readFile(sourcesPath, 'utf-8'));
    policyConfig = yaml.parse(await fs.readFile(policyPath, 'utf-8'));
  } catch (error) {
    throw new Error(
      `Failed to load config: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const maxSignalItems = policyConfig.max_signal_items || 30;

  // === 1. Repo Signals ===
  if (sourcesConfig.repo?.enabled) {
    const repoStart = Date.now();
    sourcesAttempted.push('repo');
    try {
      const repoUrl = process.env.GITHUB_REPOSITORY || 'Kastalien-Research/thoughtbox';
      const [owner, repo] = repoUrl.split('/');

      const signals = await collectRepoSignals({
        owner,
        repo,
        lookbackHours: sourcesConfig.repo.lookback_hours || 24,
      });

      allSignals.push(...signals);
      sourcesSucceeded.push('repo');
      signalsBySource['repo'] = signals.length;
      elapsedMsBySource['repo'] = Date.now() - repoStart;
      console.log(`  ✓ repo: ${signals.length} signals`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      sourcesFailed.push({ source: 'repo', error: msg });
      elapsedMsBySource['repo'] = Date.now() - repoStart;
      console.warn(`  ✗ repo: ${msg}`);
    }
  }

  // === 2. arXiv Signals ===
  if (sourcesConfig.arxiv?.enabled) {
    const arxivStart = Date.now();
    sourcesAttempted.push('arxiv');
    try {
      const signals = await collectArxivSignals({
        query: sourcesConfig.arxiv.query,
        maxResults: sourcesConfig.arxiv.max_results || 10,
      });

      allSignals.push(...signals);
      sourcesSucceeded.push('arxiv');
      signalsBySource['arxiv'] = signals.length;
      elapsedMsBySource['arxiv'] = Date.now() - arxivStart;
      console.log(`  ✓ arxiv: ${signals.length} signals`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      sourcesFailed.push({ source: 'arxiv', error: msg });
      elapsedMsBySource['arxiv'] = Date.now() - arxivStart;
      console.warn(`  ✗ arxiv: ${msg}`);
    }
  }

  // === 3. RSS Signals ===
  if (sourcesConfig.rss?.enabled && sourcesConfig.rss.feeds?.length > 0) {
    const rssStart = Date.now();
    sourcesAttempted.push('rss');
    try {
      const feedUrls = sourcesConfig.rss.feeds.map((f: any) => f.url);
      const signals = await collectRSSSignals({
        feeds: feedUrls,
        maxItemsPerFeed: 5,
      });

      allSignals.push(...signals);
      sourcesSucceeded.push('rss');
      signalsBySource['rss'] = signals.length;
      elapsedMsBySource['rss'] = Date.now() - rssStart;
      console.log(`  ✓ rss: ${signals.length} signals`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      sourcesFailed.push({ source: 'rss', error: msg });
      elapsedMsBySource['rss'] = Date.now() - rssStart;
      console.warn(`  ✗ rss: ${msg}`);
    }
  }

  // === 4. HTML Signals ===
  if (sourcesConfig.html?.enabled && sourcesConfig.html.sources?.length > 0) {
    const htmlStart = Date.now();
    sourcesAttempted.push('html');
    try {
      const htmlConfigs = sourcesConfig.html.sources.map((s: any) => ({
        url: s.url,
        selectors: s.selectors,
        fallbackToGeneric: s.fallback_to_generic !== false,
      }));

      const signals = await collectHTMLSignals({
        urls: htmlConfigs,
        maxItemsPerPage: 10,
      });

      allSignals.push(...signals);
      sourcesSucceeded.push('html');
      signalsBySource['html'] = signals.length;
      elapsedMsBySource['html'] = Date.now() - htmlStart;
      console.log(`  ✓ html: ${signals.length} signals`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      sourcesFailed.push({ source: 'html', error: msg });
      elapsedMsBySource['html'] = Date.now() - htmlStart;
      console.warn(`  ✗ html: ${msg}`);
    }
  }

  // === Deduplicate by URL ===
  const seen = new Set<string>();
  const dedupedSignals = allSignals.filter((signal) => {
    if (seen.has(signal.url)) return false;
    seen.add(signal.url);
    return true;
  });

  // === Cap at max_signal_items ===
  const cappedSignals = dedupedSignals.slice(0, maxSignalItems);

  return {
    signals: cappedSignals,
    metadata: {
      collected_at: new Date().toISOString(),
      sources_attempted: sourcesAttempted,
      sources_succeeded: sourcesSucceeded,
      sources_failed: sourcesFailed,
      total_signals: cappedSignals.length,
      signals_by_source: signalsBySource,
      elapsed_ms_by_source: elapsedMsBySource,
    },
  };
}
