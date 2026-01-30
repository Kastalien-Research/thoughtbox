 # Notebook Toolhost
 
 The notebook system provides headless, executable notebooks with JavaScript/TypeScript cells and markdown documentation.
 
 ## Core capabilities
 
 - Create, list, load, and export notebooks.
 - Add, update, list, and retrieve cells (title, markdown, code).
 - Execute code cells with captured stdout/stderr/exit code.
 - Install npm dependencies via a `package.json` cell.
 - Export to `.src.md` format with optional filesystem output.
 
 ## Operations
 
 The `notebook` toolhost supports these operations:
 
 - `create` (language: `javascript` or `typescript`, optional template)
 - `list`
 - `load` (from `path` or raw `content`)
 - `add_cell` (title, markdown, code)
 - `update_cell`
 - `run_cell`
 - `install_deps`
 - `list_cells`
 - `get_cell`
 - `export`
 
 ## Templates
 
 - `sequential-feynman` (pre-structured, guided learning workflow)
 
 ## Execution model
 
 - JavaScript executed with `node`
 - TypeScript executed with `npx tsx`
 - Code is written under a per-notebook workspace folder
 - Execution has a default 30s timeout
 
 ## Resources and guidance
 
 - `system://status` — notebook server health snapshot
 - `thoughtbox://notebook/operations` — full operation catalog with schemas
 - `thoughtbox://patterns-cookbook` — embedded on demand by thoughtbox
 - `thoughtbox://notebook-export-pattern` — notebook export workflow
 
 ## Behavioral tests
 
 - `test-notebook` / `thoughtbox://tests/notebook`
 
 These cover creation, cell management, execution, exports, templates, and error handling.
