# Notebook Workflows

Complete guide to using the notebook tool for literate programming, validated reasoning, and deep learning workflows.

## Overview

The notebook tool provides an interactive environment for combining markdown documentation with executable JavaScript/TypeScript code. Each notebook runs in an isolated environment with its own workspace.

## Operations Reference

### Notebook Management

| Operation | Description |
|-----------|-------------|
| `create` | Create new notebook (blank or from template) |
| `list` | List all active notebooks |
| `load` | Load notebook from .src.md file |
| `export` | Export notebook to .src.md format |

### Cell Operations

| Operation | Description |
|-----------|-------------|
| `add_cell` | Add title, markdown, or code cell |
| `update_cell` | Update cell content |
| `list_cells` | List all cells with metadata |
| `get_cell` | Get full cell details including output |

### Execution

| Operation | Description |
|-----------|-------------|
| `run_cell` | Execute code cell and capture output |
| `install_deps` | Install npm dependencies from package.json |

---

## Workflow 1: Validated Reasoning

Use notebooks to verify your understanding with executable code.

### Step 1: Create Notebook
```javascript
notebook({
  operation: "create",
  args: {
    title: "API Response Validation",
    language: "typescript"
  }
})
// Returns: { id: "abc123", ... }
```

### Step 2: Document the Problem
```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "abc123",
    cellType: "markdown",
    content: `## Problem Statement

We need to validate that our API response parsing handles all edge cases:
- Empty responses
- Malformed JSON
- Missing required fields
- Unexpected field types`
  }
})
```

### Step 3: Add Executable Test
```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "abc123",
    cellType: "code",
    content: `interface User {
  id: number;
  name: string;
  email: string;
}

function parseUserResponse(json: string): User | null {
  try {
    const data = JSON.parse(json);
    if (!data.id || !data.name || !data.email) {
      return null;
    }
    return data as User;
  } catch {
    return null;
  }
}

// Test cases
console.log('Empty:', parseUserResponse(''));
console.log('Malformed:', parseUserResponse('{invalid}'));
console.log('Missing field:', parseUserResponse('{"id":1,"name":"Test"}'));
console.log('Valid:', parseUserResponse('{"id":1,"name":"Test","email":"test@example.com"}'));`,
    filename: "validate.ts"
  }
})
```

### Step 4: Execute and Verify
```javascript
notebook({
  operation: "run_cell",
  args: {
    notebookId: "abc123",
    cellId: "cell_xyz"  // ID from add_cell response
  }
})
// Returns: { stdout: "Empty: null\nMalformed: null\n...", exitCode: 0 }
```

### Step 5: Document Conclusions
```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "abc123",
    cellType: "markdown",
    content: `## Conclusions

The parser correctly handles:
- ✅ Empty responses (returns null)
- ✅ Malformed JSON (returns null)
- ✅ Missing fields (returns null)
- ✅ Valid responses (returns User object)

**Next step**: Add type validation for field types.`
  }
})
```

### Step 6: Export for Persistence
```javascript
notebook({
  operation: "export",
  args: {
    notebookId: "abc123",
    path: "./notebooks/api-validation.src.md"
  }
})
```

---

## Workflow 2: Sequential Feynman Learning

The Sequential Feynman template provides a structured approach for deep learning with validated understanding.

### Phase 1: Create from Template
```javascript
notebook({
  operation: "create",
  args: {
    title: "React Server Components",
    language: "typescript",
    template: "sequential-feynman"
  }
})
```

This creates a notebook with pre-structured sections:
- Progress Checklist
- Phase 1: Research & Synthesis
- Phase 2: Feynman Explanation
- Phase 3: Refinement Cycles
- Phase 4: Expert Re-Encoding
- Meta-Reflection

### Phase 2: Research & Synthesis

Use the template's structure to:
1. Define what you need to learn
2. Track sources and key findings
3. Explicitly note gaps in understanding

```javascript
notebook({
  operation: "update_cell",
  args: {
    notebookId: "...",
    cellId: "sources-cell",
    content: `### Source 1: React Docs
- Key point: RSC run on the server only
- Key point: Can directly access backend resources
- Questions raised: How does caching work?

### Source 2: Next.js Documentation
- Key point: Default components are Server Components
- Key point: Use 'use client' directive for client components
- Questions raised: How to share state between server/client?`
  }
})
```

### Phase 3: Feynman Explanation

Write your explanation as if teaching an intelligent novice:

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `## What We're Learning Today

Imagine you're building a website that shows product information. Every time someone visits, your server has to:
1. Receive the request
2. Fetch data from your database
3. Build the HTML
4. Send it to the browser
5. JavaScript loads and makes the page interactive

**The problem**: Steps 3-5 happen on EVERY visit, even for content that rarely changes.

**React Server Components** solve this by letting you run React on the server, where the data already lives. It's like having a chef in the kitchen (server) prepare dishes (components) instead of shipping ingredients (data) to each table (browser) for assembly.`
  }
})
```

### Phase 4: Validate with Code

Add executable examples to verify understanding:

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `// Server Component - runs on server, no client JavaScript
async function ProductList() {
  // Direct database access - no API needed!
  const products = await db.query('SELECT * FROM products');

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}

// Client Component - runs in browser, handles interactivity
'use client';
function AddToCartButton({ productId }) {
  const [adding, setAdding] = useState(false);

  return (
    <button onClick={() => addToCart(productId)}>
      {adding ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}

console.log('Server Component: no useState, async, direct DB access');
console.log('Client Component: useState, onClick, runs in browser');`,
    filename: "rsc-demo.ts"
  }
})
```

### Phase 5: Refinement with Thoughtbox

Use thoughtbox to analyze and improve your explanation:

```javascript
thoughtbox({
  thought: "Analyzing Feynman explanation for React Server Components - checking for technical accuracy",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Issue 1: Didn't explain how data is serialized between server and client components",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Issue 2: Missing explanation of the streaming/Suspense integration",
  thoughtNumber: 3,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

// Then update notebook with improvements
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `## Concept 4: Serialization Boundary

When a Server Component passes data to a Client Component, React must serialize that data. This is like converting a 3D object into a 2D photo - some information can't cross the boundary:

**Can cross**: JSON-serializable data (strings, numbers, arrays, objects)
**Cannot cross**: Functions, class instances, Dates (without special handling)

This is why you can't pass an onClick handler from server to client - functions aren't serializable!`
  }
})
```

### Phase 6: Expert Re-Encoding

Extract patterns for rapid future reference:

```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `## Expert Cheat Sheet

### Decision: Server or Client Component?

| Need | Component Type |
|------|----------------|
| Database access | Server |
| User interaction (onClick) | Client |
| useState/useEffect | Client |
| Sensitive API keys | Server |
| Large dependencies (charts) | Server |
| Real-time updates | Client |

### Quick Patterns

\`\`\`tsx
// ✅ Fetch data in Server Component
async function Page() {
  const data = await fetchData(); // runs on server
  return <ClientChart data={data} />;
}

// ❌ WRONG: Trying to use hooks in Server Component
function BadPage() {
  const [data, setData] = useState(); // Error!
}
\`\`\``
  }
})
```

---

## Workflow 3: Exploratory Development

Use notebooks for prototyping and experimentation.

### Step 1: Set Up Environment
```javascript
// Create notebook
notebook({
  operation: "create",
  args: {
    title: "Algorithm Exploration",
    language: "typescript"
  }
})

// Add dependencies
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `// package.json cell
{
  "dependencies": {
    "lodash": "^4.17.21"
  }
}`,
    filename: "package.json"
  }
})

// Install dependencies
notebook({
  operation: "install_deps",
  args: { notebookId: "..." }
})
```

### Step 2: Iterative Development
```javascript
// First attempt
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `function findDuplicates(arr: number[]): number[] {
  const seen = new Set();
  const duplicates = new Set();

  for (const num of arr) {
    if (seen.has(num)) {
      duplicates.add(num);
    }
    seen.add(num);
  }

  return [...duplicates];
}

console.log(findDuplicates([1, 2, 3, 2, 4, 3, 5]));`,
    filename: "attempt1.ts"
  }
})

// Run and evaluate
notebook({
  operation: "run_cell",
  args: { notebookId: "...", cellId: "..." }
})
// Output: [2, 3]
```

### Step 3: Document Learnings
```javascript
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `## Analysis

**Time complexity**: O(n) - single pass through array
**Space complexity**: O(n) - two sets in worst case

**Trade-off**: Uses extra memory for speed. Alternative would be O(n²) with O(1) space using nested loops.

For large arrays (>10K elements), this approach is preferred.`
  }
})
```

---

## Workflow 4: Documentation Generation

Create executable documentation that validates itself.

### Structure
```javascript
// Create documentation notebook
notebook({
  operation: "create",
  args: {
    title: "API Documentation - User Service",
    language: "typescript"
  }
})

// Add endpoint documentation with executable examples
notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "markdown",
    content: `# User Service API

## GET /users

Returns a list of all users.

### Response Format`
  }
})

notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `// Response type definition
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

// Example response
const exampleResponse: UsersResponse = {
  users: [
    { id: 1, name: "Alice", email: "alice@example.com", createdAt: "2024-01-01" },
    { id: 2, name: "Bob", email: "bob@example.com", createdAt: "2024-01-02" }
  ],
  total: 2,
  page: 1,
  pageSize: 10
};

console.log(JSON.stringify(exampleResponse, null, 2));`,
    filename: "users-response.ts"
  }
})
```

---

## Integration with Thoughtbox

### Pattern: Reason First, Then Validate

```javascript
// Step 1: Use thoughtbox to reason about approach
thoughtbox({
  thought: "Need to implement rate limiting. Options: token bucket, sliding window, fixed window",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Token bucket seems best - allows bursts while maintaining average rate",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

// Step 2: Validate reasoning with notebook
notebook({
  operation: "create",
  args: {
    title: "Rate Limiter Prototype",
    language: "typescript"
  }
})

notebook({
  operation: "add_cell",
  args: {
    notebookId: "...",
    cellType: "code",
    content: `class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  tryConsume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

// Test: 10 tokens, refills 2/sec
const limiter = new TokenBucket(10, 2);

// Burst of 15 requests
let allowed = 0;
for (let i = 0; i < 15; i++) {
  if (limiter.tryConsume()) allowed++;
}
console.log(\`Allowed \${allowed} of 15 burst requests\`); // Should be 10`,
    filename: "rate-limiter.ts"
  }
})

// Step 3: Run and confirm
notebook({
  operation: "run_cell",
  args: { notebookId: "...", cellId: "..." }
})

// Step 4: Update reasoning based on results
thoughtbox({
  thought: "Validation confirms token bucket works. Allowed 10/15 burst requests as expected.",
  thoughtNumber: 3,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

---

## Best Practices

### 1. Document Before Coding
Add markdown cells explaining your intent before adding code.

### 2. Small, Focused Cells
Keep code cells focused on one concept. Easier to debug and understand.

### 3. Include Expected Output
Document what you expect before running, then compare.

### 4. Use Meaningful Filenames
`rate-limiter.ts` is better than `code1.ts`.

### 5. Export Valuable Notebooks
Don't lose good work. Export to `.src.md` for version control.

### 6. Combine with Thoughtbox
Use thoughtbox for reasoning, notebook for validation. Best of both worlds.

---

## Template Reference

### Sequential Feynman Template

Pre-structured notebook for deep learning workflows:

**Phases:**
1. **Research & Synthesis** - Gather sources, identify gaps
2. **Feynman Explanation** - Explain to intelligent novice
3. **Refinement Cycles** - Three cycles of improvement
4. **Expert Re-Encoding** - Extract patterns for rapid use

**Sections included:**
- Progress checklist
- "What I Need to Learn" framework
- Source tracking
- Analogy development scaffold
- Concept explanation templates
- Refinement prompts
- Expert cheat sheet structure
- Meta-reflection

**Create with:**
```javascript
notebook({
  operation: "create",
  args: {
    title: "Your Topic",
    language: "typescript",
    template: "sequential-feynman"
  }
})
```
