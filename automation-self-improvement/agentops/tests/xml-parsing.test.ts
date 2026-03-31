/**
 * Tests for arXiv XML parsing using fast-xml-parser
 */

import { test, expect } from 'vitest';
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

  expect(parsed.feed).toBeTruthy();
  expect(parsed.feed.entry).toBeTruthy();
  expect(parsed.feed.entry.id).toBe('http://arxiv.org/abs/2601.12345v1');
  expect(parsed.feed.entry.title).toBe('Test Paper Title');
  expect(parsed.feed.entry.summary).toBe('This is a test summary with important findings.');
  expect(parsed.feed.entry.published).toBe('2024-01-01T00:00:00Z');
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

  expect(Array.isArray(parsed.feed.entry)).toBe(true);
  expect(parsed.feed.entry.length).toBe(2);
  expect(parsed.feed.entry[0].id).toBe('http://arxiv.org/abs/2601.11111v1');
  expect(parsed.feed.entry[1].id).toBe('http://arxiv.org/abs/2601.22222v1');
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

  expect(parsed.feed.entry).toBeTruthy();
  expect(parsed.feed.entry.id).toBe('http://arxiv.org/abs/2601.12345v1');
  expect(parsed.feed.entry.title).toBe('Test Paper');
  expect(parsed.feed.entry.summary).toBeUndefined();
  expect(parsed.feed.entry.published).toBeUndefined();
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

  expect(Array.isArray(singleEntries)).toBe(true);
  expect(singleEntries.length).toBe(1);

  expect(Array.isArray(multiEntries)).toBe(true);
  expect(multiEntries.length).toBe(2);
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

  expect(parsed.feed).toBeTruthy();

  // Normalize empty entry
  const entries = Array.isArray(parsed.feed.entry)
    ? parsed.feed.entry
    : [parsed.feed.entry].filter(Boolean);

  expect(Array.isArray(entries)).toBe(true);
  expect(entries.length).toBe(0);
});
