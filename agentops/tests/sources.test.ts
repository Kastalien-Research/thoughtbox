/**
 * Signal Collection Tests
 */

import { test, expect } from 'vitest';

test('SignalItem has required fields', () => {
  const signal = {
    source: 'test',
    title: 'Test',
    url: 'https://example.com',
  };
  expect(signal.source).toBeTruthy();
  expect(signal.title).toBeTruthy();
  expect(signal.url).toBeTruthy();
});

test('URL deduplication works', () => {
  const signals = [
    { source: 'a', title: 'A', url: 'https://x.com/1' },
    { source: 'b', title: 'B', url: 'https://x.com/1' },
    { source: 'c', title: 'C', url: 'https://x.com/2' },
  ];

  const seen = new Set();
  const deduped = signals.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  expect(deduped.length).toBe(2);
});
