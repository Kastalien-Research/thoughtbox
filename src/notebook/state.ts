import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import type {
  Notebook,
  Cell,
  CodeCell,
  CodeLanguage,
  PackageJsonCell,
} from "./types.js";
import { randomid } from "./types.js";
import {
  executeCodeCell,
  installDependencies,
  writeCodeCellToDisk,
  writePackageJsonToDisk,
  writeTsconfigToDisk,
  type ExecutionResult,
} from "./execution.js";
import { encode, decode, createEmptyNotebook } from "./encoding.js";

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
    // Resolve template path (works in both ESM and CJS environments)
    const projectRoot = process.cwd();
    const templatePath = path.join(
      projectRoot,
      "templates",
      `${templateName}-template.src.md`
    );

    // Load template content
    let templateContent: string;
    try {
      templateContent = await fs.readFile(templatePath, "utf8");
    } catch (error) {
      throw new Error(
        `Template '${templateName}' not found at ${templatePath}`
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
   * Load a notebook from .src.md file
   */
  async loadNotebook(srcmdPath: string): Promise<Notebook> {
    // Sanitize path to prevent directory traversal
    const safePath = sanitizePath(srcmdPath, process.cwd());
    const content = await fs.readFile(safePath, "utf8");
    const notebook = decode(content);

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
        // Run npm install
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
   */
  async exportNotebook(
    notebookId: string,
    outputPath: string
  ): Promise<string> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found`);
    }

    // Sanitize output path to prevent directory traversal
    const safePath = sanitizePath(outputPath, process.cwd());

    const srcmd = encode(notebook);
    await fs.writeFile(safePath, srcmd, "utf8");

    return safePath;
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
