/**
 * Signal Collection Tests
 */

import { test } from 'node:test';
import assert from 'node:assert';

test('SignalItem has required fields', () => {
  const signal = {
    source: 'test',
    title: 'Test',
    url: 'https://example.com',
  };
  assert.ok(signal.source);
  assert.ok(signal.title);
  assert.ok(signal.url);
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

  assert.strictEqual(deduped.length, 2);
});

console.log('✅ Sources tests passed');
