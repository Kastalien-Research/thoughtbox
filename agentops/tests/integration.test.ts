/**
 * Integration tests for signal collection (requires network)
 * These tests validate that the collectors work with real APIs/websites
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { collectArxivSignals } from '../runner/lib/sources/arxiv.js';
import { collectHTMLSignals } from '../runner/lib/sources/html.js';

test('arXiv XML parser collects real signals', async () => {
  const signals = await collectArxivSignals({
    query: 'agent',
    maxResults: 5,
  });

  assert.ok(signals.length > 0, 'Should collect at least one signal');
  assert.ok(signals.length <= 5, 'Should respect maxResults limit');

  const first = signals[0];
  assert.ok(first.title, 'Signal should have title');
  assert.ok(first.url, 'Signal should have URL');
  assert.ok(first.url.includes('arxiv.org'), 'URL should be from arXiv');
  assert.strictEqual(first.source, 'arxiv', 'Source should be arxiv');
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

  assert.ok(signals.length > 0, 'Should collect at least one signal');
  assert.ok(signals.length <= 5, 'Should respect maxItemsPerPage limit');

  const first = signals[0];
  assert.ok(first.title, 'Signal should have title');
  assert.ok(first.title.length > 5, 'Title should be substantial');
  assert.ok(first.url, 'Signal should have URL');
  assert.strictEqual(first.source, 'html_newsroom', 'Source should be html_newsroom');
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
  assert.ok(Array.isArray(signals), 'Should return an array');
  signals.forEach((signal) => {
    assert.ok(signal.title, 'Signal should have title');
    assert.ok(signal.url, 'Signal should have URL');
  });
});
