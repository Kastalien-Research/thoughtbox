/**
 * HTML Newsroom Signal Collection
 * Scrapes newsrooms and blogs using generic selectors
 */

import * as cheerio from 'cheerio';
import type { SignalItem } from './types.js';

export interface HTMLConfig {
  urls: Array<{
    url: string;
    selectors?: {
      container: string;
      title: string;
      link: string;
    };
    fallbackToGeneric?: boolean;
  }>;
  maxItemsPerPage?: number;
}

/**
 * Collect signals from HTML newsrooms/blogs
 */
export async function collectHTMLSignals(
  config: HTMLConfig
): Promise<SignalItem[]> {
  const signals: SignalItem[] = [];
  const maxItemsPerPage = config.maxItemsPerPage || 10;

  for (const siteConfig of config.urls) {
    const { url: pageUrl, selectors, fallbackToGeneric = true } = siteConfig;

    try {
      const response = await fetch(pageUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch ${pageUrl}: ${response.statusText}`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      let items: Array<{ title: string; url: string }> = [];

      // Try site-specific selectors first
      if (selectors) {
        items = extractWithSelectors($, selectors, pageUrl, maxItemsPerPage);
      }

      // Fallback to generic if no items found
      if (items.length === 0 && fallbackToGeneric) {
        items = extractWithGenericSelectors($, pageUrl, maxItemsPerPage);
      }

      // Add to signals
      for (const item of items) {
        signals.push({
          source: 'html_newsroom',
          title: item.title,
          url: item.url,
          tags: ['html', 'news'],
        });
      }
    } catch (error) {
      console.warn(
        `Failed to scrape ${pageUrl}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return signals;
}

/**
 * Extract using site-specific selectors
 */
function extractWithSelectors(
  $: cheerio.CheerioAPI,
  selectors: { container: string; title: string; link: string },
  baseUrl: string,
  maxItems: number
): Array<{ title: string; url: string }> {
  const items: Array<{ title: string; url: string }> = [];

  $(selectors.container).each((_, elem) => {
    if (items.length >= maxItems) return false;

    const $elem = $(elem);
    const title = $elem.find(selectors.title).first().text().trim();
    const href = $elem.find(selectors.link).first().attr('href');

    if (title && href) {
      const absoluteUrl = new URL(href, baseUrl).toString();
      items.push({ title, url: absoluteUrl });
    }
  });

  return items;
}

/**
 * Extract using generic selectors (fallback)
 */
function extractWithGenericSelectors(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  maxItems: number
): Array<{ title: string; url: string }> {
  const items: Array<{ title: string; url: string }> = [];
  const selectors = ['article', '.post', '.news-item', '.blog-post'];

  for (const selector of selectors) {
    $(selector).each((_, elem) => {
      if (items.length >= maxItems) return false;

      // Find heading
      const $elem = $(elem);
      const $heading = $elem.find('h1, h2, h3').first();
      const title = $heading.text().trim();

      // Find link
      const $link = $heading.find('a').first();
      let href = $link.attr('href');

      // Fallback to first link in element
      if (!href) {
        href = $elem.find('a').first().attr('href');
      }

      if (title && href) {
        // Resolve relative URLs
        const absoluteUrl = new URL(href, baseUrl).toString();
        items.push({ title, url: absoluteUrl });
      }
    });

    if (items.length > 0) break; // Found items with this selector
  }

  return items;
}
