# Notebook Toolhost - Behavioral Tests

Workflows for Claude to execute when verifying the notebook toolhost functions correctly.

## Test 1: Create and List Flow

**Goal:** Verify notebook creation and discovery.

**Steps:**
1. Call `notebook` with operation `create`, args: { title: "Test Notebook", language: "typescript" }
2. Verify response includes notebookId, title, language, cells array
3. Call operation `list`
4. Verify created notebook appears in list with correct metadata

**Expected:** Notebook created with unique ID, discoverable via list

---

## Test 2: Cell Operations Flow

**Goal:** Verify adding and managing cells.

**Steps:**
1. Create a notebook
2. Add title cell: operation `add_cell`, cellType: "title", content: "My Analysis"
3. Add markdown cell: cellType: "markdown", content: "## Introduction\nThis notebook..."
4. Add code cell: cellType: "code", content: "console.log('hello')", filename: "hello.ts"
5. Call operation `list_cells` with notebookId
6. Verify all three cells present with correct types
7. Call operation `get_cell` for the code cell
8. Verify full cell details returned

**Expected:** All cell types work, retrievable by ID

---

## Test 3: Code Execution Flow

**Goal:** Verify code cells execute correctly.

**Steps:**
1. Create notebook with language: "typescript"
2. Add code cell: `const x = 1 + 1; console.log(x);`
3. Call operation `run_cell` with notebookId and cellId
4. Verify output contains "2"
5. Verify cell status is "completed"

**Expected:** Code executes, output captured, status updated

---

## Test 4: Cell Update Flow

**Goal:** Verify cell content can be modified.

**Steps:**
1. Create notebook with a code cell
2. Call operation `update_cell` with new content
3. Call `get_cell` to verify content changed
4. Run the updated cell
5. Verify new output reflects updated code

**Expected:** Updates persist, execution uses new content

---

## Test 5: Export/Load Flow

**Goal:** Verify .src.md serialization roundtrip.

**Steps:**
1. Create notebook with title, markdown, and code cells
2. Call operation `export` with notebookId
3. Verify response includes content in .src.md format
4. Content should have metadata comment, cells with proper markers
5. Call operation `load` with the exported content string
6. Verify loaded notebook has same cells as original

**Expected:** Lossless roundtrip through .src.md format

---

## Test 6: Template Flow

**Goal:** Verify template instantiation.

**Steps:**
1. Call `create` with template: "sequential-feynman", title: "React Hooks"
2. Verify notebook created with pre-populated cells
3. Cells should include scaffolded structure from template
4. Call `list_cells` to see template structure

**Expected:** Template provides starting structure, not empty notebook

---

## Test 7: Dependency Installation Flow

**Goal:** Verify npm dependencies can be installed.

**Steps:**
1. Create notebook
2. Add package.json cell or update existing with dependencies
3. Call operation `install_deps` with notebookId
4. Verify installation completes (may take time)
5. Add code cell that uses installed dependency
6. Run cell, verify it works

**Expected:** Dependencies available to code cells after install

---

## Test 8: Error Handling Flow

**Goal:** Verify graceful error handling.

**Steps:**
1. Call `run_cell` with nonexistent notebookId - should error
2. Call `get_cell` with invalid cellId - should error
3. Call `add_cell` with invalid cellType - should error
4. Run code cell with syntax error - should show error in output, status "failed"

**Expected:** Clear errors, failed cells have error info

---

## Running These Tests

Execute by calling the `notebook` MCP tool with operation and args. Each notebook gets an isolated workspace. Clean up by letting notebooks expire or restarting server.
