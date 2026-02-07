# Notebook Toolhost - Behavioral Tests

Workflows for verifying the `thoughtbox_gateway` notebook sub-operations.

**Tool:** `thoughtbox_gateway`
**Operation:** `notebook` (with sub-operations via `args.operation`)
**Required stage:** Stage 1 (init_complete) — call `start_new` or `load_context` first

**Arg shape (double-nested):**
```
{ operation: "notebook", args: { operation: "<sub-op>", args: { <params> } } }
```
The gateway extracts `args.operation` for routing and `args.args` for the notebook handler.

---

## NB-001: Create and List Flow

**Goal:** Verify notebook creation and discovery.

**Steps:**
1. Advance to Stage 1 via `start_new`
2. Call:
   ```json
   { "operation": "notebook", "args": { "operation": "create", "args": { "title": "Test Notebook", "language": "typescript" } } }
   ```
3. Verify response includes notebookId, title, language, cells array
4. Call:
   ```json
   { "operation": "notebook", "args": { "operation": "list" } }
   ```
5. Verify created notebook appears in list with correct metadata

**Expected:** Notebook created with unique ID, discoverable via list

---

## NB-002: Cell Operations Flow

**Goal:** Verify adding and managing cells.

**Steps:**
1. Create a notebook (NB-001 step 2)
2. Add title cell:
   ```json
   { "operation": "notebook", "args": { "operation": "add_cell", "args": { "notebookId": "<id>", "cellType": "title", "content": "My Analysis" } } }
   ```
3. Add markdown cell:
   ```json
   { "operation": "notebook", "args": { "operation": "add_cell", "args": { "notebookId": "<id>", "cellType": "markdown", "content": "## Introduction\nThis notebook..." } } }
   ```
4. Add code cell:
   ```json
   { "operation": "notebook", "args": { "operation": "add_cell", "args": { "notebookId": "<id>", "cellType": "code", "content": "console.log('hello')", "filename": "hello.ts" } } }
   ```
5. List cells:
   ```json
   { "operation": "notebook", "args": { "operation": "list_cells", "args": { "notebookId": "<id>" } } }
   ```
6. Verify all three cells present with correct types
7. Get a specific cell:
   ```json
   { "operation": "notebook", "args": { "operation": "get_cell", "args": { "notebookId": "<id>", "cellId": "<cellId>" } } }
   ```
8. Verify full cell details returned

**Expected:** All cell types work, retrievable by ID

---

## NB-003: Code Execution Flow

**Goal:** Verify code cells execute correctly.

**Steps:**
1. Create notebook with language: "typescript"
2. Add code cell with content: `const x = 1 + 1; console.log(x);`
3. Run cell:
   ```json
   { "operation": "notebook", "args": { "operation": "run_cell", "args": { "notebookId": "<id>", "cellId": "<cellId>" } } }
   ```
4. Verify output contains "2"
5. Verify cell status is "completed"

**Expected:** Code executes, output captured, status updated

---

## NB-004: Cell Update Flow

**Goal:** Verify cell content can be modified.

**Steps:**
1. Create notebook with a code cell
2. Update cell:
   ```json
   { "operation": "notebook", "args": { "operation": "update_cell", "args": { "notebookId": "<id>", "cellId": "<cellId>", "content": "console.log('updated')" } } }
   ```
3. Get cell to verify content changed
4. Run the updated cell
5. Verify new output reflects updated code

**Expected:** Updates persist, execution uses new content

---

## NB-005: Export/Load Flow

**Goal:** Verify .src.md serialization roundtrip.

**Steps:**
1. Create notebook with title, markdown, and code cells
2. Export:
   ```json
   { "operation": "notebook", "args": { "operation": "export", "args": { "notebookId": "<id>" } } }
   ```
3. Verify response includes content in .src.md format
4. Content should have metadata comment, cells with proper markers
5. Load from content string:
   ```json
   { "operation": "notebook", "args": { "operation": "load", "args": { "content": "<exported .src.md content>" } } }
   ```
6. Verify loaded notebook has same cells as original

**Expected:** Lossless roundtrip through .src.md format

---

## NB-006: Template Flow

**Goal:** Verify template instantiation.

**Steps:**
1. Create with template:
   ```json
   { "operation": "notebook", "args": { "operation": "create", "args": { "template": "sequential-feynman", "title": "React Hooks" } } }
   ```
2. Verify notebook created with pre-populated cells
3. Cells should include scaffolded structure from template
4. List cells to see template structure

**Expected:** Template provides starting structure, not empty notebook

---

## NB-007: Dependency Installation Flow

**Goal:** Verify npm dependencies can be installed.

**Steps:**
1. Create notebook
2. Add package.json cell or update existing with dependencies
3. Install deps:
   ```json
   { "operation": "notebook", "args": { "operation": "install_deps", "args": { "notebookId": "<id>" } } }
   ```
4. Verify installation completes (may take time)
5. Add code cell that uses installed dependency
6. Run cell, verify it works

**Expected:** Dependencies available to code cells after install

---

## NB-008: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Run cell with nonexistent notebookId:
   ```json
   { "operation": "notebook", "args": { "operation": "run_cell", "args": { "notebookId": "nonexistent", "cellId": "fake" } } }
   ```
   Should return error, not crash
2. Get cell with invalid cellId — should error
3. Add cell with invalid cellType — should error
4. Run code cell with syntax error — should show error in output, status "failed"

**Expected:** Clear errors, failed cells have error info

---

## NB-009: Load from Filesystem Path

**Goal:** Verify `load` can import a notebook from a filesystem path (not just a content string).

**Steps:**
1. Create and export a notebook to get a .src.md file
2. Note the export path (or save content to a known path)
3. Load from path:
   ```json
   { "operation": "notebook", "args": { "operation": "load", "args": { "path": "/path/to/exported.src.md" } } }
   ```
4. Verify notebook loaded with same cells as original
5. Verify cell content, types, and order preserved

**Expected:** Filesystem path loading works as alternative to content string

---

## NB-010: add_cell with Position Parameter

**Goal:** Verify `add_cell` can insert a cell at a specific position.

**Steps:**
1. Create a notebook
2. Add cell A (default position):
   ```json
   { "operation": "notebook", "args": { "operation": "add_cell", "args": { "notebookId": "<id>", "cellType": "markdown", "content": "Cell A" } } }
   ```
3. Add cell B (default position):
   ```json
   { "operation": "notebook", "args": { "operation": "add_cell", "args": { "notebookId": "<id>", "cellType": "markdown", "content": "Cell B" } } }
   ```
4. Add cell C at position 1 (between A and B):
   ```json
   { "operation": "notebook", "args": { "operation": "add_cell", "args": { "notebookId": "<id>", "cellType": "markdown", "content": "Cell C", "position": 1 } } }
   ```
5. List cells
6. Verify order is: A, C, B (C inserted at position 1, B shifted to position 2)

**Expected:** Position parameter controls insertion point, existing cells shift

---

## Running These Tests

All notebook tests require Stage 1 minimum. Execute by calling `thoughtbox_gateway` with `operation: "notebook"` and sub-operation in `args.operation`. Parameters for the sub-operation go in `args.args`.

**Setup:** Each notebook gets an isolated workspace. Clean up by letting notebooks expire or restarting server.
