/**
 * Tests for arXiv XML parsing using fast-xml-parser
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { XMLParser } from 'fast-xml-parser';

test('XML parser handles arXiv feed with single entry', () => {
  const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2601.12345v1</id>
    <title>Test Paper Title</title>
    <summary>This is a test summary with important findings.</summary>
    <published>2024-01-01T00:00:00Z</published>
  </entry>
</feed>`;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  const parsed = parser.parse(xml);

  assert.ok(parsed.feed, 'Feed should exist');
  assert.ok(parsed.feed.entry, 'Entry should exist');
  assert.strictEqual(
    parsed.feed.entry.id,
    'http://arxiv.org/abs/2601.12345v1',
    'Entry ID should match'
  );
  assert.strictEqual(
    parsed.feed.entry.title,
    'Test Paper Title',
    'Title should match'
  );
  assert.strictEqual(
    parsed.feed.entry.summary,
    'This is a test summary with important findings.',
    'Summary should match'
  );
  assert.strictEqual(
    parsed.feed.entry.published,
    '2024-01-01T00:00:00Z',
    'Published date should match'
  );
});

test('XML parser handles arXiv feed with multiple entries', () => {
  const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2601.11111v1</id>
    <title>First Paper</title>
    <summary>First summary</summary>
    <published>2024-01-01T00:00:00Z</published>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2601.22222v1</id>
    <title>Second Paper</title>
    <summary>Second summary</summary>
    <published>2024-01-02T00:00:00Z</published>
  </entry>
</feed>`;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  const parsed = parser.parse(xml);

  assert.ok(Array.isArray(parsed.feed.entry), 'Entries should be an array');
  assert.strictEqual(parsed.feed.entry.length, 2, 'Should have 2 entries');
  assert.strictEqual(
    parsed.feed.entry[0].id,
    'http://arxiv.org/abs/2601.11111v1',
    'First entry ID should match'
  );
  assert.strictEqual(
    parsed.feed.entry[1].id,
    'http://arxiv.org/abs/2601.22222v1',
    'Second entry ID should match'
  );
});

test('XML parser handles entries with missing optional fields', () => {
  const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2601.12345v1</id>
    <title>Test Paper</title>
  </entry>
</feed>`;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  const parsed = parser.parse(xml);

  assert.ok(parsed.feed.entry, 'Entry should exist');
  assert.strictEqual(
    parsed.feed.entry.id,
    'http://arxiv.org/abs/2601.12345v1',
    'ID should exist'
  );
  assert.strictEqual(parsed.feed.entry.title, 'Test Paper', 'Title should exist');
  assert.strictEqual(
    parsed.feed.entry.summary,
    undefined,
    'Summary should be undefined when missing'
  );
  assert.strictEqual(
    parsed.feed.entry.published,
    undefined,
    'Published should be undefined when missing'
  );
});

test('Array vs single entry normalization', () => {
  const singleXml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2601.12345v1</id>
    <title>Single Entry</title>
  </entry>
</feed>`;

  const multiXml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2601.11111v1</id>
    <title>First Entry</title>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2601.22222v1</id>
    <title>Second Entry</title>
  </entry>
</feed>`;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  const singleParsed = parser.parse(singleXml);
  const multiParsed = parser.parse(multiXml);

  // Test normalization logic
  const singleEntries = Array.isArray(singleParsed.feed.entry)
    ? singleParsed.feed.entry
    : [singleParsed.feed.entry].filter(Boolean);

  const multiEntries = Array.isArray(multiParsed.feed.entry)
    ? multiParsed.feed.entry
    : [multiParsed.feed.entry].filter(Boolean);

  assert.ok(Array.isArray(singleEntries), 'Single entry should be normalized to array');
  assert.strictEqual(singleEntries.length, 1, 'Should have 1 entry');

  assert.ok(Array.isArray(multiEntries), 'Multiple entries should be array');
  assert.strictEqual(multiEntries.length, 2, 'Should have 2 entries');
});

test('Handles empty feed gracefully', () => {
  const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
</feed>`;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  const parsed = parser.parse(xml);

  assert.ok(parsed.feed, 'Feed should exist');

  // Normalize empty entry
  const entries = Array.isArray(parsed.feed.entry)
    ? parsed.feed.entry
    : [parsed.feed.entry].filter(Boolean);

  assert.ok(Array.isArray(entries), 'Should be normalized to array');
  assert.strictEqual(entries.length, 0, 'Should have 0 entries');
});
