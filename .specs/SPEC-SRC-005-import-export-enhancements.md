# SPEC-SRC-005: Import/Export Enhancements

> **Status**: Draft
> **Priority**: P2 (Polish)
> **Dependencies**: None
> **Source**: srcbook/packages/api/srcbook/examples, srcbook import/export patterns

## Summary

Enhance notebook import/export with URL-based import, curated example notebooks, and improved export options. Leverages existing .src.md format compatibility while adding convenience features.

## Motivation

Users benefit from:

- **URL import**: Open notebooks directly from GitHub, gists, or hosted URLs
- **Example notebooks**: Quick-start templates for common patterns
- **Export flexibility**: Share notebooks easily via various formats

Thoughtbox already has .src.md encoding (see `src/notebook/encoding.ts`), making format compatibility solved. This spec focuses on discovery and convenience layers.

## Design

### URL Import

#### Import Flow

```typescript
// src/notebook/import/url.ts

import { z } from 'zod';
import { decode } from '../encoding';

export const UrlImportRequestSchema = z.object({
  url: z.string().url(),
  validate: z.boolean().default(true),
});

export async function importFromUrl(url: string): Promise<NotebookSchema> {
  // Normalize URL (GitHub raw, gist, etc.)
  const normalizedUrl = normalizeSourceUrl(url);

  // Fetch content
  const response = await fetch(normalizedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const content = await response.text();

  // Detect format and parse
  if (url.endsWith('.src.md') || content.includes('<!-- srcbook:')) {
    return decode(content);
  }

  // Could support other formats in future
  throw new Error('Unsupported notebook format');
}
```

#### URL Normalization

Handle common hosting patterns:

```typescript
// src/notebook/import/normalize.ts

const GITHUB_BLOB_PATTERN = /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/;
const GITHUB_GIST_PATTERN = /gist\.github\.com\/([^/]+)\/([a-f0-9]+)/;

export function normalizeSourceUrl(url: string): string {
  // GitHub blob → raw
  const blobMatch = url.match(GITHUB_BLOB_PATTERN);
  if (blobMatch) {
    const [, owner, repo, branch, path] = blobMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  // GitHub gist → raw
  const gistMatch = url.match(GITHUB_GIST_PATTERN);
  if (gistMatch) {
    const [, , gistId] = gistMatch;
    return `https://gist.githubusercontent.com/raw/${gistId}`;
  }

  // Already a raw/direct URL
  return url;
}
```

### Example Notebooks

#### Example Registry

```typescript
// src/notebook/examples/registry.ts

export interface ExampleNotebook {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source: 'bundled' | 'remote';
  path?: string;      // For bundled examples
  url?: string;       // For remote examples
}

export const EXAMPLE_NOTEBOOKS: ExampleNotebook[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    description: 'Your first TypeScript notebook',
    tags: ['getting-started', 'basics'],
    difficulty: 'beginner',
    source: 'bundled',
    path: 'examples/hello-world.src.md',
  },
  {
    id: 'fetch-api',
    title: 'Fetching Data',
    description: 'HTTP requests and JSON handling',
    tags: ['http', 'api', 'fetch'],
    difficulty: 'beginner',
    source: 'bundled',
    path: 'examples/fetch-api.src.md',
  },
  {
    id: 'web-scraping',
    title: 'Web Scraping',
    description: 'Extract data from websites with cheerio',
    tags: ['scraping', 'cheerio', 'parsing'],
    difficulty: 'intermediate',
    source: 'bundled',
    path: 'examples/web-scraping.src.md',
  },
  {
    id: 'database-sqlite',
    title: 'SQLite Database',
    description: 'Local database operations with better-sqlite3',
    tags: ['database', 'sqlite', 'sql'],
    difficulty: 'intermediate',
    source: 'bundled',
    path: 'examples/database-sqlite.src.md',
  },
  {
    id: 'ai-chat',
    title: 'AI Chat Interface',
    description: 'Build a chat interface with OpenAI',
    tags: ['ai', 'openai', 'chat'],
    difficulty: 'intermediate',
    source: 'bundled',
    path: 'examples/ai-chat.src.md',
  },
];
```

#### Example Loader

```typescript
// src/notebook/examples/loader.ts

import { decode } from '../encoding';
import { EXAMPLE_NOTEBOOKS, ExampleNotebook } from './registry';

export async function listExamples(filters?: {
  tags?: string[];
  difficulty?: string;
}): Promise<ExampleNotebook[]> {
  let examples = [...EXAMPLE_NOTEBOOKS];

  if (filters?.tags?.length) {
    examples = examples.filter(ex =>
      filters.tags!.some(tag => ex.tags.includes(tag))
    );
  }

  if (filters?.difficulty) {
    examples = examples.filter(ex => ex.difficulty === filters.difficulty);
  }

  return examples;
}

export async function loadExample(id: string): Promise<NotebookSchema> {
  const example = EXAMPLE_NOTEBOOKS.find(ex => ex.id === id);
  if (!example) {
    throw new Error(`Example not found: ${id}`);
  }

  if (example.source === 'bundled' && example.path) {
    const content = await loadBundledExample(example.path);
    return decode(content);
  }

  if (example.source === 'remote' && example.url) {
    return importFromUrl(example.url);
  }

  throw new Error(`Invalid example configuration: ${id}`);
}
```

### Export Enhancements

#### Export Options

```typescript
// src/notebook/export/options.ts

import { z } from 'zod';

export const ExportOptionsSchema = z.object({
  format: z.enum(['srcmd', 'json', 'markdown']).default('srcmd'),
  includeOutputs: z.boolean().default(false),
  includeSecrets: z.boolean().default(false), // Never include actual values
  includeTimestamps: z.boolean().default(true),
});

export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
```

#### Export Formats

```typescript
// src/notebook/export/formats.ts

import { encode } from '../encoding';
import type { NotebookSchema } from '../types';
import type { ExportOptions } from './options';

export function exportNotebook(
  notebook: NotebookSchema,
  options: ExportOptions,
): string {
  switch (options.format) {
    case 'srcmd':
      return encode(notebook);

    case 'json':
      return JSON.stringify(notebook, null, 2);

    case 'markdown':
      return exportAsMarkdown(notebook, options);

    default:
      throw new Error(`Unknown format: ${options.format}`);
  }
}

function exportAsMarkdown(
  notebook: NotebookSchema,
  options: ExportOptions,
): string {
  const parts: string[] = [];

  // Title
  const titleCell = notebook.cells.find(c => c.type === 'title');
  if (titleCell) {
    parts.push(`# ${titleCell.text}\n`);
  }

  // Cells
  for (const cell of notebook.cells) {
    if (cell.type === 'markdown') {
      parts.push(cell.text + '\n');
    } else if (cell.type === 'code') {
      parts.push('```typescript');
      parts.push(cell.source);
      parts.push('```\n');

      if (options.includeOutputs && cell.output) {
        parts.push('<details><summary>Output</summary>\n');
        parts.push('```');
        parts.push(cell.output);
        parts.push('```');
        parts.push('</details>\n');
      }
    }
  }

  return parts.join('\n');
}
```

### Tool Integration

Add import/export operations to notebook tool:

```typescript
// In src/notebook/index.ts

const ImportExportOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('import:url'),
    url: z.string().url(),
  }),
  z.object({
    type: z.literal('examples:list'),
    filters: z.object({
      tags: z.array(z.string()).optional(),
      difficulty: z.string().optional(),
    }).optional(),
  }),
  z.object({
    type: z.literal('examples:load'),
    exampleId: z.string(),
  }),
  z.object({
    type: z.literal('export'),
    notebookId: z.string(),
    options: ExportOptionsSchema.optional(),
  }),
]);
```

## Example Notebook Content

### hello-world.src.md

```markdown
<!-- srcbook:{"language":"typescript"} -->

# Hello World

Welcome to your first TypeScript notebook!

## Getting Started

```typescript
console.log("Hello, World!");
```

## Variables and Types

```typescript
const name: string = "TypeScript";
const year: number = 2026;

console.log(`Learning ${name} in ${year}`);
```
```

### fetch-api.src.md

```markdown
<!-- srcbook:{"language":"typescript"} -->

# Fetching Data

Learn how to make HTTP requests and handle JSON.

## Simple GET Request

```typescript
const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
const data = await response.json();
console.log(data);
```

## With Error Handling

```typescript
async function fetchTodo(id: number) {
  try {
    const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    return null;
  }
}

const todo = await fetchTodo(1);
console.log(todo);
```
```

## Files to Create/Modify

| File | Action | Purpose |
| ---- | ------ | ------- |
| `src/notebook/import/url.ts` | Create | URL import functionality |
| `src/notebook/import/normalize.ts` | Create | URL normalization |
| `src/notebook/examples/registry.ts` | Create | Example notebook registry |
| `src/notebook/examples/loader.ts` | Create | Example loading |
| `src/notebook/export/options.ts` | Create | Export options schema |
| `src/notebook/export/formats.ts` | Create | Export format handlers |
| `src/notebook/index.ts` | Modify | Add import/export operations |
| `examples/*.src.md` | Create | Bundled example notebooks |

## Test Scenarios

1. **URL Import - GitHub**
   - Input: GitHub blob URL
   - Normalized to raw.githubusercontent.com
   - Content fetched and parsed

2. **URL Import - Gist**
   - Input: Gist URL
   - Normalized to raw gist URL
   - Content fetched and parsed

3. **URL Import - Invalid**
   - Non-existent URL → fetch error
   - Non-.src.md content → format error

4. **Example Listing**
   - No filters → all examples returned
   - Tag filter → filtered results
   - Difficulty filter → filtered results

5. **Example Loading**
   - Valid ID → notebook loaded
   - Invalid ID → error

6. **Export Formats**
   - .src.md → encoded correctly
   - JSON → valid JSON structure
   - Markdown → readable document

## Acceptance Criteria

- [ ] URL import with GitHub/gist normalization
- [ ] At least 5 bundled example notebooks
- [ ] Example filtering by tags and difficulty
- [ ] Export to .src.md, JSON, and Markdown
- [ ] Export options (outputs, timestamps)
- [ ] Tool operations integrated
- [ ] Examples accessible via tool

## Future Enhancements

- **Community examples**: Remote registry of user-contributed notebooks
- **Import from clipboard**: Paste .src.md content directly
- **Export to platforms**: Direct sharing to GitHub, gist, etc.
- **Template variables**: Parameterized example notebooks

## References

- Srcbook examples: `srcbook/packages/api/srcbook/examples/`
- Existing encoding: `src/notebook/encoding.ts`
- Srcbook HTTP routes: `srcbook/packages/api/server/http.mts` (import routes)
