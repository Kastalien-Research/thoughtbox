/**
 * Integration tests for signal collection (requires network)
 * These tests validate that the collectors work with real APIs/websites
 */

import { test, expect } from 'vitest';
import { collectArxivSignals } from '../runner/lib/sources/arxiv.js';
import { collectHTMLSignals } from '../runner/lib/sources/html.js';

test('arXiv XML parser collects real signals', async () => {
  const signals = await collectArxivSignals({
    query: 'agent',
    maxResults: 5,
  });

  expect(signals.length).toBeGreaterThan(0);
  expect(signals.length).toBeLessThanOrEqual(5);

  const first = signals[0];
  expect(first.title).toBeTruthy();
  expect(first.url).toBeTruthy();
  expect(first.url).toContain('arxiv.org');
  expect(first.source).toBe('arxiv');
});

test('HTML site-specific selectors work for DeepMind', async () => {
  const signals = await collectHTMLSignals({
    urls: [
      {
        url: 'https://deepmind.google/blog/',
        selectors: {
          container: 'article.card-blog',
          title: 'h3',
          link: 'a',
        },
        fallbackToGeneric: true,
      },
    ],
    maxItemsPerPage: 5,
  });

  expect(signals.length).toBeGreaterThan(0);
  expect(signals.length).toBeLessThanOrEqual(5);

  const first = signals[0];
  expect(first.title).toBeTruthy();
  expect(first.title.length).toBeGreaterThan(5);
  expect(first.url).toBeTruthy();
  expect(first.source).toBe('html_newsroom');
});

test('HTML generic fallback works', async () => {
  // Test a site without specific selectors (will use generic)
  const signals = await collectHTMLSignals({
    urls: [
      {
        url: 'https://www.anthropic.com/news',
        fallbackToGeneric: true,
      },
    ],
    maxItemsPerPage: 5,
  });

  // May or may not find signals depending on site structure
  // But should not throw errors
  expect(Array.isArray(signals)).toBe(true);
  signals.forEach((signal) => {
    expect(signal.title).toBeTruthy();
    expect(signal.url).toBeTruthy();
  });
});
