import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import type {
  Notebook,
  Cell,
  CodeCell,
  CodeLanguage,
  PackageJsonCell,
  VariableCell,
} from "./types.js";
import { randomid } from "./types.js";
import {
  executeCodeCell,
  executeWithREPL,
  installDependencies,
  writeCodeCellToDisk,
  writePackageJsonToDisk,
  writeTsconfigToDisk,
  type ExecutionResult,
  type REPLHandler,
} from "./execution.js";
import { encode, decode, createEmptyNotebook } from "./encoding.js";
import { getTemplate, AVAILABLE_TEMPLATES } from "./templates.generated.js";

/**
 * Sanitize and validate a file path to prevent path traversal attacks
 * @param userPath User-provided path
 * @param allowedDir Base directory that paths must resolve within
 * @returns Sanitized absolute path
 * @throws Error if path traversal is detected
 */
function sanitizePath(userPath: string, allowedDir: string): string {
  const normalized = path.normalize(userPath);
  const resolved = path.resolve(allowedDir, normalized);

  // Ensure resolved path stays within allowed directory
  if (!resolved.startsWith(allowedDir)) {
    throw new Error("Path traversal not allowed");
  }

  return resolved;
}

/**
 * Notebook state manager
 * Manages in-memory notebook state and execution
 */
export class NotebookStateManager {
  private notebooks: Map<string, Notebook> = new Map();
  private notebookDirs: Map<string, string> = new Map();
  private tempDir: string;

  constructor(tempDir?: string) {
    this.tempDir = tempDir || path.join(os.tmpdir(), "thoughtbox-notebooks");
  }

  /**
   * Initialize temporary directory
   */
  async init(): Promise<void> {
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  /**
   * Create a new notebook
   */
  async createNotebook(
    title: string,
    language: CodeLanguage
  ): Promise<Notebook> {
    const notebook = createEmptyNotebook(title, language);

    // Create notebook directory
    const notebookDir = path.join(this.tempDir, notebook.id);
    await fs.mkdir(notebookDir, { recursive: true });
    await fs.mkdir(path.join(notebookDir, "src"), { recursive: true });

    // Write initial files to disk
    await this.writeNotebookToDisk(notebook, notebookDir);

    // Store in memory
    this.notebooks.set(notebook.id, notebook);
    this.notebookDirs.set(notebook.id, notebookDir);

    return notebook;
  }

  /**
   * Create a notebook from a template
   */
  async createNotebookFromTemplate(
    title: string,
    language: CodeLanguage,
    templateName: string
  ): Promise<Notebook> {
    // Load template content from embedded templates
    let templateContent: string;
    try {
      templateContent = getTemplate(templateName);
    } catch (error) {
      const available = AVAILABLE_TEMPLATES.join(', ');
      throw new Error(
        `Template "${templateName}" not found. Available templates: ${available}`
      );
    }

    // Substitute placeholders
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const populatedContent = templateContent
      .replace(/\[TOPIC\]/g, title)
      .replace(/\[DATE\]/g, date)
      .replace(/\[LANGUAGE\]/g, language);

    // Decode the populated template
    const notebook = decode(populatedContent);

    // Override metadata with provided values
    notebook.language = language;
    if (language === "typescript" && !notebook["tsconfig.json"]) {
      const { buildDefaultTsconfig } = await import("./types.js");
      notebook["tsconfig.json"] = buildDefaultTsconfig();
    }

    // Create notebook directory
    const notebookDir = path.join(this.tempDir, notebook.id);
    await fs.mkdir(notebookDir, { recursive: true });
    await fs.mkdir(path.join(notebookDir, "src"), { recursive: true });

    // Write files to disk
    await this.writeNotebookToDisk(notebook, notebookDir);

    // Store in memory
    this.notebooks.set(notebook.id, notebook);
    this.notebookDirs.set(notebook.id, notebookDir);

    return notebook;
  }

  /**
   * Load a notebook from path or content
   */
  async loadNotebook(
    source: { path: string } | { content: string }
  ): Promise<Notebook> {
    let notebookContent: string;

    // Determine source
    if ("path" in source) {
      // Sanitize path to prevent directory traversal
      const safePath = sanitizePath(source.path, process.cwd());
      notebookContent = await fs.readFile(safePath, "utf8");
    } else {
      notebookContent = source.content;
    }

    // Decode from .src.md format
    const notebook = decode(notebookContent);

    // Create notebook directory
    const notebookDir = path.join(this.tempDir, notebook.id);
    await fs.mkdir(notebookDir, { recursive: true });
    await fs.mkdir(path.join(notebookDir, "src"), { recursive: true });

    // Write files to disk
    await this.writeNotebookToDisk(notebook, notebookDir);

    // Store in memory
    this.notebooks.set(notebook.id, notebook);
    this.notebookDirs.set(notebook.id, notebookDir);

    return notebook;
  }

  /**
   * Get a notebook by ID
   */
  getNotebook(notebookId: string): Notebook | undefined {
    return this.notebooks.get(notebookId);
  }

  /**
   * Get all notebooks
   */
  listNotebooks(): Notebook[] {
    return Array.from(this.notebooks.values());
  }

  /**
   * Add a cell to a notebook
   */
  async addCell(
    notebookId: string,
    cell: Cell,
    position?: number
  ): Promise<Notebook> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    const notebookDir = this.notebookDirs.get(notebookId)!;

    // Assign ID if not present
    if (!cell.id) {
      (cell as any).id = randomid();
    }

    // Insert at position or append
    if (position !== undefined && position >= 0 && position <= notebook.cells.length) {
      notebook.cells.splice(position, 0, cell);
    } else {
      notebook.cells.push(cell);
    }

    notebook.updatedAt = Date.now();

    // Write to disk if it's a code or package.json cell
    if (cell.type === "code") {
      await writeCodeCellToDisk(notebookDir, cell.filename, cell.source);
    } else if (cell.type === "package.json") {
      await writePackageJsonToDisk(notebookDir, cell.source);
    }

    return notebook;
  }

  /**
   * Update a cell in a notebook
   */
  async updateCell(
    notebookId: string,
    cellId: string,
    updates: Partial<Cell>
  ): Promise<Notebook> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    const cellIndex = notebook.cells.findIndex((c) => c.id === cellId);
    if (cellIndex === -1) {
      throw new Error(`Cell ${cellId} not found`);
    }

    const notebookDir = this.notebookDirs.get(notebookId)!;
    const cell = notebook.cells[cellIndex];

    // Update cell properties
    Object.assign(cell, updates);
    notebook.updatedAt = Date.now();

    // Write to disk if source changed
    if (cell.type === "code") {
      const codeCell = cell as CodeCell;
      if ("source" in updates) {
        await writeCodeCellToDisk(notebookDir, codeCell.filename, codeCell.source);
      }
    } else if (cell.type === "package.json") {
      const pkgCell = cell as PackageJsonCell;
      if ("source" in updates) {
        await writePackageJsonToDisk(notebookDir, pkgCell.source);
      }
    }

    return notebook;
  }

  /**
   * Get a cell from a notebook
   */
  getCell(notebookId: string, cellId: string): Cell | undefined {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) return undefined;

    return notebook.cells.find((c) => c.id === cellId);
  }

  /**
   * Execute a code cell
   */
  async executeCell(
    notebookId: string,
    cellId: string
  ): Promise<ExecutionResult> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    const cell = notebook.cells.find((c) => c.id === cellId);
    if (!cell) {
      throw new Error(`Cell ${cellId} not found`);
    }

    if (cell.type !== "code" && cell.type !== "package.json") {
      throw new Error(`Cell ${cellId} is not executable (type: ${cell.type})`);
    }

    const notebookDir = this.notebookDirs.get(notebookId)!;

    // Check if cell is already running to prevent race conditions
    if (cell.status === "running") {
      throw new Error(`Cell ${cellId} is already running`);
    }

    // Update cell status
    cell.status = "running";
    cell.output = undefined;
    cell.error = undefined;

    let result: ExecutionResult;

    try {
      if (cell.type === "package.json") {
        // Run pnpm install
        result = await installDependencies({ cwd: notebookDir });
      } else {
        // Execute code cell
        result = await executeCodeCell(cell.filename, cell.language, {
          cwd: notebookDir,
        });
      }

      // Update cell with results
      if (result.success) {
        cell.status = "completed";
        cell.output = result.stdout || result.stderr;
      } else {
        cell.status = "failed";
        cell.error = result.stderr || result.stdout;
      }
    } catch (error) {
      cell.status = "failed";
      cell.error = error instanceof Error ? error.message : String(error);
      result = {
        stdout: "",
        stderr: cell.error,
        exitCode: -1,
        success: false,
      };
    }

    notebook.updatedAt = Date.now();

    return result;
  }

  /**
   * Export notebook to .src.md format
   * Always returns content string, optionally writes to path
   */
  async exportNotebook(
    notebookId: string,
    path?: string
  ): Promise<string> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    // Always encode to content string
    const content = encode(notebook);

    // If path provided, write to filesystem
    if (path) {
      const safePath = sanitizePath(path, process.cwd());
      await fs.writeFile(safePath, content, "utf8");
    }

    // Always return content
    return content;
  }

  /**
   * Store a variable in a notebook
   */
  storeVar(
    notebookId: string,
    name: string,
    value: string
  ): VariableCell {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    if (value.length > 100_000) {
      throw new Error(
        `Variable "${name}" exceeds 100K char limit (${value.length} chars)`
      );
    }

    const existing = notebook.cells.find(
      (c): c is VariableCell => c.type === "variable" && c.name === name
    );

    if (existing) {
      const otherChars = notebook.cells
        .filter(
          (c): c is VariableCell =>
            c.type === "variable" && c.name !== name
        )
        .reduce((s, c) => s + c.size, 0);
      if (otherChars + value.length > 1_000_000) {
        throw new Error(
          `Total variable storage would exceed 1M char limit ` +
            `(current: ${otherChars}, adding: ${value.length})`
        );
      }
      existing.value = value;
      existing.size = value.length;
      notebook.updatedAt = Date.now();
      return existing;
    }

    const varCells = notebook.cells.filter(
      (c) => c.type === "variable"
    );
    if (varCells.length >= 100) {
      throw new Error(
        "Variable cell limit reached (max 100 per notebook)"
      );
    }

    const totalChars = varCells.reduce(
      (sum, c) => sum + (c as VariableCell).size,
      0
    );
    if (totalChars + value.length > 1_000_000) {
      throw new Error(
        `Total variable storage would exceed 1M char limit ` +
        `(current: ${totalChars}, adding: ${value.length})`
      );
    }

    const cell: VariableCell = {
      id: randomid(),
      type: "variable",
      name,
      value,
      size: value.length,
    };
    notebook.cells.push(cell);
    notebook.updatedAt = Date.now();
    return cell;
  }

  /**
   * Peek at a variable in a notebook
   */
  peekVar(
    notebookId: string,
    name: string,
    start?: number,
    end?: number
  ): { value: string; size: number } {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    const cell = notebook.cells.find(
      (c): c is VariableCell => c.type === "variable" && c.name === name
    );
    if (!cell) {
      throw new Error(
        `Variable "${name}" not found in notebook ${notebookId}`
      );
    }

    const sliced =
      start !== undefined || end !== undefined
        ? cell.value.slice(start, end)
        : cell.value;

    return { value: sliced, size: cell.size };
  }

  /**
   * Add a code cell, write it to disk, return the cell ID.
   */
  async addCodeCell(
    notebookId: string,
    filename: string,
    source: string
  ): Promise<string> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }
    const notebookDir = this.notebookDirs.get(notebookId)!;

    const cell: CodeCell = {
      id: randomid(),
      type: "code",
      language: notebook.language,
      filename,
      source,
      status: "idle",
    };
    notebook.cells.push(cell);
    notebook.updatedAt = Date.now();

    await writeCodeCellToDisk(notebookDir, filename, source);
    return cell.id;
  }

  /**
   * Execute a code cell with REPL globals (IPC bridge).
   */
  async runCellWithREPL(
    notebookId: string,
    cellId: string
  ): Promise<ExecutionResult> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }
    const cell = notebook.cells.find((c) => c.id === cellId);
    if (!cell || cell.type !== "code") {
      throw new Error(`Code cell ${cellId} not found`);
    }
    if (cell.status === "running") {
      throw new Error(`Cell ${cellId} is already running`);
    }

    const notebookDir = this.notebookDirs.get(notebookId)!;
    const filepath = path.join(notebookDir, "src", cell.filename);

    cell.status = "running";
    cell.output = undefined;
    cell.error = undefined;

    const handler: REPLHandler = {
      onStore: async (name, value) => {
        this.storeVar(notebookId, name, value);
      },
      onPeek: async (name, start?, end?) => {
        return this.peekVar(notebookId, name, start, end);
      },
      onVars: async () => {
        const nb = this.notebooks.get(notebookId)!;
        return nb.cells
          .filter(
            (c): c is VariableCell => c.type === "variable"
          )
          .map((c) => c.name);
      },
      onFinal: (result) => {
        finalResult = result;
      },
      onSubCall: async (prompt, opts) => {
        let Anthropic;
        try {
          const mod = await import("@anthropic-ai/sdk");
          Anthropic = mod.default ?? mod.Anthropic;
        } catch {
          throw new Error(
            "sub_call requires @anthropic-ai/sdk — " +
              "install it with npm install @anthropic-ai/sdk"
          );
        }
        const client = new Anthropic();
        const resp = await client.messages.create({
          model: opts?.model ?? "claude-sonnet-4-5-20250929",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });
        const textBlock = resp.content.find(
          (b: { type: string }) => b.type === "text"
        );
        return (textBlock as { text: string })?.text ?? "";
      },
    };

    let finalResult: string | undefined;
    let execResult: ExecutionResult;
    try {
      execResult = await executeWithREPL(
        filepath,
        { cwd: notebookDir },
        handler
      );
      if (execResult.success) {
        cell.status = "completed";
        cell.output = execResult.stdout || execResult.stderr;
      } else {
        cell.status = "failed";
        cell.error = execResult.stderr || execResult.stdout;
      }
    } catch (err) {
      cell.status = "failed";
      cell.error =
        err instanceof Error ? err.message : String(err);
      execResult = {
        stdout: "",
        stderr: cell.error,
        exitCode: -1,
        success: false,
      };
    }

    notebook.updatedAt = Date.now();
    return { ...execResult, finalResult };
  }

  /**
   * Delete a notebook
   */
  async deleteNotebook(notebookId: string): Promise<void> {
    const notebookDir = this.notebookDirs.get(notebookId);
    if (notebookDir) {
      await fs.rm(notebookDir, { recursive: true, force: true });
    }

    this.notebooks.delete(notebookId);
    this.notebookDirs.delete(notebookId);
  }

  /**
   * Write all notebook files to disk
   */
  private async writeNotebookToDisk(
    notebook: Notebook,
    notebookDir: string
  ): Promise<void> {
    // Write tsconfig if TypeScript
    if (notebook["tsconfig.json"]) {
      await writeTsconfigToDisk(notebookDir, notebook["tsconfig.json"]);
    }

    // Write cells to disk
    for (const cell of notebook.cells) {
      if (cell.type === "code") {
        await writeCodeCellToDisk(notebookDir, cell.filename, cell.source);
      } else if (cell.type === "package.json") {
        await writePackageJsonToDisk(notebookDir, cell.source);
      }
    }

    // Write .src.md file
    const srcmd = encode(notebook);
    await fs.writeFile(path.join(notebookDir, "README.md"), srcmd, "utf8");
  }
}
