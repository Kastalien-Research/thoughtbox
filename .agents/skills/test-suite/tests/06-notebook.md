# 06 — thoughtbox_notebook

Stage: STAGE_2_CIPHER_LOADED (requires init + cipher)
Operations: notebook_create, notebook_list, notebook_load, notebook_add_cell, notebook_update_cell, notebook_run_cell, notebook_install_deps, notebook_list_cells, notebook_get_cell, notebook_export

---

## Test 1: Create and List

**Goal:** Verify notebook creation and discovery.

**Steps:**
1. Call `thoughtbox_notebook { operation: "notebook_create", title: "Test Notebook", language: "typescript" }`
2. Verify response includes notebookId, title, language, cells array
3. Call `{ operation: "notebook_list" }`
4. Verify created notebook appears in list

**Expected:** Notebook created with unique ID, discoverable via list

---

## Test 2: Cell Operations

**Goal:** Verify adding and managing cells.

**Steps:**
1. Create a notebook
2. Add title cell: `cellType: "title", content: "My Analysis"`
3. Add markdown cell: `cellType: "markdown", content: "## Introduction"`
4. Add code cell: `cellType: "code", content: "console.log('hello')", filename: "hello.ts"`
5. Call `notebook_list_cells` with notebookId
6. Verify all three cells present with correct types

**Expected:** All cell types work, retrievable

---

## Test 3: Code Execution

**Goal:** Verify code cells execute correctly.

**Steps:**
1. Create notebook with `language: "typescript"`
2. Add code cell: `const x = 1 + 1; console.log(x);`
3. Call `notebook_run_cell` with notebookId and cellId
4. Verify output contains "2"
5. Verify cell status is "completed"

**Expected:** Code executes, output captured, status updated

---

## Test 4: Cell Update

**Goal:** Verify cell content modification.

**Steps:**
1. Create notebook with a code cell
2. Call `notebook_update_cell` with new content
3. Call `notebook_get_cell` to verify content changed
4. Run the updated cell
5. Verify new output reflects updated code

**Expected:** Updates persist, execution uses new content

---

## Test 5: Export and Load

**Goal:** Verify .src.md roundtrip.

**Steps:**
1. Create notebook with title, markdown, and code cells
2. Call `notebook_export` with notebookId
3. Verify response includes content in .src.md format
4. Call `notebook_load` with the exported content string
5. Verify loaded notebook has same cells as original

**Expected:** Lossless roundtrip through .src.md format

---

## Test 6: Template Instantiation

**Goal:** Verify template creates pre-populated notebook.

**Steps:**
1. Call `notebook_create` with `template: "sequential-feynman", title: "Test Topic"`
2. Verify notebook created with pre-populated cells
3. Cells should include scaffolded structure from template

**Expected:** Template provides starting structure

---

## Test 7: Dependency Installation

**Goal:** Verify pnpm dependencies install.

**Steps:**
1. Create notebook
2. Call `notebook_install_deps` with notebookId
3. Verify installation completes
4. Add code cell using a dependency
5. Run cell — verify it works

**Expected:** Dependencies available to code cells after install

---

## Test 8: Error Handling

**Goal:** Verify graceful error handling.

**Steps:**
1. `notebook_run_cell` with nonexistent notebookId — should error
2. `notebook_get_cell` with invalid cellId — should error
3. Run code cell with syntax error — should show error in output, not crash

**Expected:** Clear errors, failed cells have error info
