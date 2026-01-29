/**
 * RSS Feed Signal Collection
 * Fetches items from RSS feeds
 */

import Parser from 'rss-parser';
import type { SignalItem } from './types.js';

export interface RSSConfig {
  feeds: string[];
  maxItemsPerFeed?: number;
}

/**
 * Collect signals from RSS feeds
 */
export async function collectRSSSignals(
  config: RSSConfig
): Promise<SignalItem[]> {
  const signals: SignalItem[] = [];
  const maxItemsPerFeed = config.maxItemsPerFeed || 5;
  const parser = new Parser();

  for (const feedUrl of config.feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      const items = feed.items.slice(0, maxItemsPerFeed);
      for (const item of items) {
        if (item.title && item.link) {
          signals.push({
            source: 'rss',
            title: item.title,
            url: item.link,
            published_at: item.pubDate || item.isoDate,
            summary: item.contentSnippet || item.content,
            tags: ['rss', ...(item.categories || [])],
          });
        }
      }
    } catch (error) {
      // Log but don't throw - continue with other feeds
      console.warn(
        `Failed to parse RSS feed ${feedUrl}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return signals;
}
