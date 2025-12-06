# Notebook Tool

Literate programming with executable JavaScript/TypeScript cells.

## 10 Operations

### Notebook Management

| Operation | Purpose | Example |
|-----------|---------|---------|
| `create` | New notebook | `{ title: "Analysis", language: "typescript", template: "sequential-feynman" }` |
| `list` | All active notebooks | `{}` |
| `load` | Load from .src.md | `{ path: "/path/to/notebook.src.md" }` or `{ content: "..." }` |
| `export` | Export to .src.md | `{ notebookId: "...", path: "/output.src.md" }` |

### Cell Operations

| Operation | Purpose | Example |
|-----------|---------|---------|
| `add_cell` | Add cell | `{ notebookId: "...", cellType: "code", content: "...", filename: "test.ts" }` |
| `update_cell` | Modify cell | `{ notebookId: "...", cellId: "...", content: "..." }` |
| `list_cells` | List all cells | `{ notebookId: "..." }` |
| `get_cell` | Cell details | `{ notebookId: "...", cellId: "..." }` |

### Execution

| Operation | Purpose | Example |
|-----------|---------|---------|
| `run_cell` | Execute code | `{ notebookId: "...", cellId: "..." }` |
| `install_deps` | Install npm packages | `{ notebookId: "..." }` |

## Cell Types

| Type | Purpose |
|------|---------|
| `title` | Notebook/section title |
| `markdown` | Documentation, explanation |
| `code` | Executable JS/TS |

## Sequential Feynman Template

Deep learning workflow with 4 phases:

```javascript
notebook({ operation: "create", args: {
  title: "React Server Components",
  language: "typescript",
  template: "sequential-feynman"
}})
```

### Phase 1: Research & Synthesis
Gather information, document sources.

### Phase 2: Feynman Explanation
Explain in simple terms as if teaching.

### Phase 3: Refinement Cycles
Find gaps, iterate on explanation.

### Phase 4: Expert Re-encoding
Translate back to technical precision.

## Common Workflows

### Create and Execute

```javascript
// 1. Create
const nb = notebook({ operation: "create", args: { title: "Debug", language: "typescript" }})

// 2. Add code
notebook({ operation: "add_cell", args: {
  notebookId: nb.id,
  cellType: "code",
  content: "console.log('test');",
  filename: "test.ts"
}})

// 3. Run
notebook({ operation: "run_cell", args: { notebookId: nb.id, cellId: "..." }})
```

### Load, Modify, Export

```javascript
// Load existing
const nb = notebook({ operation: "load", args: { path: "./analysis.src.md" }})

// Update cell
notebook({ operation: "update_cell", args: { notebookId: nb.id, cellId: "...", content: "..." }})

// Export
notebook({ operation: "export", args: { notebookId: nb.id, path: "./updated.src.md" }})
```

### With Dependencies

```javascript
// Install packages first
notebook({ operation: "install_deps", args: { notebookId: nb.id }})

// Then run cells that use them
notebook({ operation: "run_cell", args: { notebookId: nb.id, cellId: "..." }})
```

## MCP Resources

- Operations catalog: `thoughtbox://notebook/operations`
- Templates available via `create` operation's `template` arg

## Cross-References

- Combine with reasoning: [THOUGHTBOX.md](THOUGHTBOX.md)
- Orchestration patterns: [PATTERNS.md](PATTERNS.md)
- Feynman workflow example: [EXAMPLES.md](EXAMPLES.md)
