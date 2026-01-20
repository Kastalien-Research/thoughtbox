# Notebooks

Literate programming with executable JavaScript and TypeScript.

---

## Overview

Thoughtbox notebooks combine **documentation** and **executable code** in a single document. Write explanations in Markdown, run code cells, and see results inline.

Notebooks are ideal for:
- **Data exploration** — Analyze and visualize data interactively
- **Learning** — Explain concepts with runnable examples
- **Prototyping** — Test ideas with immediate feedback
- **Documentation** — Code examples that stay up-to-date

---

## Quick Start

### Create a Notebook

```json
{
  "operation": "notebook",
  "args": {
    "action": "create",
    "title": "API Response Analysis",
    "language": "typescript"
  }
}
```

### Add a Markdown Cell

```json
{
  "operation": "notebook",
  "args": {
    "action": "add_cell",
    "type": "markdown",
    "content": "## Fetching Data\n\nLet's retrieve some sample data from our API."
  }
}
```

### Add a Code Cell

```json
{
  "operation": "notebook",
  "args": {
    "action": "add_cell",
    "type": "code",
    "content": "const response = await fetch('https://api.example.com/data');\nconst data = await response.json();\nconsole.log(data);",
    "filename": "fetch-data.ts"
  }
}
```

### Run the Code

```json
{
  "operation": "notebook",
  "args": {
    "action": "run_cell",
    "cellId": "cell-abc123"
  }
}
```

**Returns:**
```json
{
  "status": "completed",
  "output": "{ \"items\": [...] }\n",
  "error": null
}
```

---

## Cell Types

### Title Cell

The notebook title, displayed prominently.

```json
{
  "type": "title",
  "content": "API Response Analysis"
}
```

### Markdown Cell

Documentation, explanations, and formatted text.

```json
{
  "type": "markdown",
  "content": "## Section Header\n\nExplanation with **bold** and `code`."
}
```

Supports full GitHub-flavored Markdown:
- Headers, lists, tables
- Code blocks with syntax highlighting
- Links and images
- Blockquotes

### Code Cell

Executable JavaScript or TypeScript.

```json
{
  "type": "code",
  "content": "const sum = (a: number, b: number) => a + b;\nconsole.log(sum(2, 3));",
  "filename": "math.ts",
  "status": "idle"
}
```

**Cell statuses:**
| Status | Meaning |
|--------|---------|
| `idle` | Ready to run |
| `running` | Currently executing |
| `completed` | Finished successfully |
| `failed` | Execution error |

### Package.json Cell

Declare npm dependencies for the notebook.

```json
{
  "type": "package.json",
  "content": "{\n  \"dependencies\": {\n    \"lodash\": \"^4.17.21\"\n  }\n}"
}
```

---

## Notebook Operations

### create

Create a new notebook.

```json
{
  "operation": "notebook",
  "args": {
    "action": "create",
    "title": "My Analysis",
    "language": "typescript",    // or "javascript"
    "template": "sequential-feynman"  // optional
  }
}
```

**Languages:**
- `javascript` — Plain JS, fast startup
- `typescript` — Type checking, better tooling

**Templates:**
- `sequential-feynman` — Guided deep learning workflow

---

### add_cell

Add a cell to the notebook.

```json
{
  "operation": "notebook",
  "args": {
    "action": "add_cell",
    "type": "code",           // "code" | "markdown" | "title"
    "content": "...",
    "filename": "example.ts"  // optional, for code cells
  }
}
```

---

### update_cell

Modify an existing cell's content.

```json
{
  "operation": "notebook",
  "args": {
    "action": "update_cell",
    "cellId": "cell-abc123",
    "content": "// Updated code\nconsole.log('Hello!');"
  }
}
```

---

### run_cell

Execute a code cell.

```json
{
  "operation": "notebook",
  "args": {
    "action": "run_cell",
    "cellId": "cell-abc123"
  }
}
```

**Returns:**
```json
{
  "status": "completed",
  "output": "Hello!\n",
  "error": null
}
```

**On error:**
```json
{
  "status": "failed",
  "output": "",
  "error": "ReferenceError: foo is not defined"
}
```

---

### install_deps

Install npm dependencies from package.json cell.

```json
{
  "operation": "notebook",
  "args": {
    "action": "install_deps"
  }
}
```

---

### list_cells

Get metadata for all cells.

```json
{
  "operation": "notebook",
  "args": {
    "action": "list_cells"
  }
}
```

**Returns:**
```json
{
  "cells": [
    { "id": "cell-1", "type": "title" },
    { "id": "cell-2", "type": "markdown" },
    { "id": "cell-3", "type": "code", "filename": "main.ts", "status": "completed" }
  ]
}
```

---

### export

Save notebook to a `.src.md` file.

```json
{
  "operation": "notebook",
  "args": {
    "action": "export",
    "path": "/path/to/notebook.src.md"
  }
}
```

---

### load

Load notebook from file or content string.

```json
{
  "operation": "notebook",
  "args": {
    "action": "load",
    "path": "/path/to/notebook.src.md"
  }
}
```

Or from content:

```json
{
  "operation": "notebook",
  "args": {
    "action": "load",
    "content": "# Title\n\n```typescript\nconsole.log('hi');\n```"
  }
}
```

---

## The .src.md Format

Notebooks are saved as enhanced Markdown files (`.src.md`), compatible with [Srcbook](https://github.com/srcbookdev/srcbook).

**Example:**

```markdown
# API Response Analysis

## Fetching Data

Let's retrieve some sample data.

```typescript filename="fetch-data.ts"
const response = await fetch('https://api.example.com/data');
const data = await response.json();
console.log(data);
```

## Processing Results

Now let's transform the data.

```typescript filename="process.ts"
const processed = data.items.map(item => ({
  id: item.id,
  name: item.name.toUpperCase()
}));
console.log(processed);
```
```

**Format features:**
- Standard Markdown for documentation
- Code blocks with language identifier
- Optional `filename` attribute for code cells
- Portable and version-controllable

---

## Execution Environment

Each notebook runs in an **isolated Node.js process**:

- **Separate from the server** — Crashes don't affect Thoughtbox
- **Persistent within session** — Variables survive across cell runs
- **Clean on reload** — Fresh state when notebook is reloaded

### TypeScript Support

TypeScript notebooks are transpiled on the fly:

```typescript
interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];

console.log(users.filter(u => u.id > 1));
```

Custom `tsconfig.json` is supported for advanced configuration.

### Top-Level Await

Both JavaScript and TypeScript support top-level `await`:

```javascript
const data = await fetch('https://api.example.com').then(r => r.json());
console.log(data);
```

---

## Using Dependencies

### 1. Add package.json Cell

```json
{
  "operation": "notebook",
  "args": {
    "action": "add_cell",
    "type": "package.json",
    "content": "{\n  \"dependencies\": {\n    \"lodash\": \"^4.17.21\",\n    \"axios\": \"^1.6.0\"\n  }\n}"
  }
}
```

### 2. Install Dependencies

```json
{
  "operation": "notebook",
  "args": {
    "action": "install_deps"
  }
}
```

### 3. Use in Code Cells

```typescript
import _ from 'lodash';
import axios from 'axios';

const data = [1, 2, 3, 4, 5];
console.log(_.sum(data));

const response = await axios.get('https://api.example.com');
console.log(response.data);
```

---

## Templates

### Sequential Feynman

A guided workflow for deep learning based on the Feynman technique:

```json
{
  "operation": "notebook",
  "args": {
    "action": "create",
    "title": "Understanding Async/Await",
    "language": "typescript",
    "template": "sequential-feynman"
  }
}
```

**Template structure:**
1. **Identify** — What are you trying to learn?
2. **Explain Simply** — Describe it like teaching a child
3. **Identify Gaps** — Where does your explanation break down?
4. **Simplify & Analogize** — Create intuitive explanations
5. **Review & Refine** — Test understanding with examples

---

## Example Workflow

### Data Analysis Session

```json
// 1. Create notebook
{
  "operation": "notebook",
  "args": {
    "action": "create",
    "title": "Sales Data Analysis",
    "language": "typescript"
  }
}

// 2. Add context
{
  "operation": "notebook",
  "args": {
    "action": "add_cell",
    "type": "markdown",
    "content": "## Objective\n\nAnalyze Q4 sales to identify trends."
  }
}

// 3. Add data loading code
{
  "operation": "notebook",
  "args": {
    "action": "add_cell",
    "type": "code",
    "content": "const sales = [\n  { month: 'Oct', amount: 15000 },\n  { month: 'Nov', amount: 18000 },\n  { month: 'Dec', amount: 25000 }\n];\nconsole.log('Loaded', sales.length, 'records');",
    "filename": "load-data.ts"
  }
}

// 4. Run to verify
{
  "operation": "notebook",
  "args": {
    "action": "run_cell",
    "cellId": "..."
  }
}

// 5. Add analysis code
{
  "operation": "notebook",
  "args": {
    "action": "add_cell",
    "type": "code",
    "content": "const total = sales.reduce((sum, s) => sum + s.amount, 0);\nconst avg = total / sales.length;\nconsole.log(`Total: $${total}`);\nconsole.log(`Average: $${avg.toFixed(2)}`);",
    "filename": "analyze.ts"
  }
}

// 6. Export for sharing
{
  "operation": "notebook",
  "args": {
    "action": "export",
    "path": "./sales-analysis.src.md"
  }
}
```

---

## Next Steps

- [**Tools Reference**](./tools-reference.md) — Complete API documentation
- [**Mental Models**](./mental-models.md) — Structured reasoning frameworks
- [**Configuration**](./configuration.md) — Customize notebook behavior
