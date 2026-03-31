/**
 * arXiv Signal Collection
 * Fetches recent papers from arXiv API
 */

import { XMLParser } from 'fast-xml-parser';
import type { SignalItem } from './types.js';

export interface ArxivConfig {
  query: string;
  maxResults?: number;
}

/**
 * Collect signals from arXiv API
 */
export async function collectArxivSignals(
  config: ArxivConfig
): Promise<SignalItem[]> {
  const signals: SignalItem[] = [];
  const maxResults = config.maxResults || 10;

  const searchUrl = new URL('http://export.arxiv.org/api/query');
  searchUrl.searchParams.set('search_query', config.query);
  searchUrl.searchParams.set('max_results', String(maxResults));
  searchUrl.searchParams.set('sortBy', 'lastUpdatedDate');
  searchUrl.searchParams.set('sortOrder', 'descending');

  try {
    const response = await fetch(searchUrl.toString());
    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.statusText}`);
    }

    const xml = await response.text();

    // Parse XML with proper parser (more robust than regex)
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });

    const parsed = parser.parse(xml);
    const feed = parsed.feed;

    // arXiv API returns entries as array or single object
    const entries = Array.isArray(feed.entry)
      ? feed.entry
      : [feed.entry].filter(Boolean);

    for (const entry of entries) {
      const id = entry.id || '';
      const title = entry.title || '';
      const summary = entry.summary || '';
      const published = entry.published || '';

      // Skip entries missing required fields
      if (!id || !title) continue;

      signals.push({
        source: 'arxiv',
        title: title.trim().replace(/\s+/g, ' '),
        url: id.trim(),
        published_at: published.trim() || undefined,
        summary: summary.trim().replace(/\s+/g, ' ') || undefined,
        tags: ['arxiv', 'research'],
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to collect arXiv signals: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return signals;
}
