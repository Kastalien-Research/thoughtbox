import type { Notebook, Cell, NotebookMetadata, CodeLanguage } from "./types.js";
import { randomid, buildDefaultTsconfig, buildDefaultPackageJson } from "./types.js";

/**
 * Encode a notebook to .src.md format
 * Format: Markdown with metadata header and code fences for cells
 */
export function encode(notebook: Notebook): string {
  const lines: string[] = [];

  // Add metadata header
  const metadata: NotebookMetadata = {
    language: notebook.language,
  };
  if (notebook["tsconfig.json"]) {
    metadata["tsconfig.json"] = notebook["tsconfig.json"];
  }
  lines.push(`<!-- srcbook:${JSON.stringify(metadata)} -->`);
  lines.push("");

  // Process each cell
  for (const cell of notebook.cells) {
    if (cell.type === "title") {
      lines.push(`# ${cell.text}`);
      lines.push("");
    } else if (cell.type === "markdown") {
      lines.push(cell.text);
      lines.push("");
    } else if (cell.type === "package.json") {
      lines.push("###### package.json");
      lines.push("");
      lines.push("```json");
      lines.push(cell.source);
      lines.push("```");
      lines.push("");
    } else if (cell.type === "code") {
      lines.push(`###### ${cell.filename}`);
      lines.push("");
      const langTag = cell.language === "typescript" ? "typescript" : "javascript";
      lines.push(`\`\`\`${langTag}`);
      lines.push(cell.source);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Decode a .src.md file to a notebook
 */
export function decode(srcmd: string): Notebook {
  const lines = srcmd.split("\n");
  const cells: Cell[] = [];
  let metadata: NotebookMetadata | null = null;
  let i = 0;

  // Parse metadata header
  if (lines[i]?.trim().startsWith("<!-- srcbook:")) {
    const metadataLine = lines[i].trim();
    const jsonMatch = metadataLine.match(/<!-- srcbook:(.+) -->/);
    if (jsonMatch) {
      try {
        metadata = JSON.parse(jsonMatch[1]);
      } catch (e) {
        throw new Error("Invalid metadata in srcbook header");
      }
    }
    i++;
  }

  if (!metadata) {
    throw new Error("Missing or invalid srcbook metadata header");
  }

  // Skip empty lines after header
  while (i < lines.length && lines[i].trim() === "") {
    i++;
  }

  // Parse cells
  while (i < lines.length) {
    const line = lines[i];

    // Title cell (# Title)
    if (line.startsWith("# ")) {
      cells.push({
        id: randomid(),
        type: "title",
        text: line.substring(2),
      });
      i++;
      // Skip following empty line
      if (i < lines.length && lines[i].trim() === "") i++;
    }
    // Code cell (###### filename)
    else if (line.startsWith("###### ")) {
      const filename = line.substring(7).trim();
      i++;

      // Skip empty line
      if (i < lines.length && lines[i].trim() === "") i++;

      // Expect code fence
      if (i < lines.length && lines[i].startsWith("```")) {
        const fenceLine = lines[i];
        const langMatch = fenceLine.match(/```(\w+)/);
        const lang = langMatch?.[1] || "javascript";
        i++;

        // Collect code lines until closing fence
        const codeLines: string[] = [];
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }

        // Skip closing fence
        if (i < lines.length && lines[i].startsWith("```")) i++;

        // Skip following empty line
        if (i < lines.length && lines[i].trim() === "") i++;

        const source = codeLines.join("\n");

        // Package.json cell
        if (filename === "package.json") {
          cells.push({
            id: randomid(),
            type: "package.json",
            source,
            filename: "package.json",
            status: "idle",
          });
        }
        // Code cell
        else {
          const language: CodeLanguage =
            lang === "typescript" ? "typescript" : "javascript";
          cells.push({
            id: randomid(),
            type: "code",
            language,
            filename,
            source,
            status: "idle",
          });
        }
      }
    }
    // Markdown cell (everything else)
    else {
      const markdownLines: string[] = [];

      // Collect lines until we hit a title or code cell marker
      while (
        i < lines.length &&
        !lines[i].startsWith("# ") &&
        !lines[i].startsWith("###### ")
      ) {
        markdownLines.push(lines[i]);
        i++;
      }

      // Trim trailing empty lines
      while (
        markdownLines.length > 0 &&
        markdownLines[markdownLines.length - 1].trim() === ""
      ) {
        markdownLines.pop();
      }

      if (markdownLines.length > 0) {
        cells.push({
          id: randomid(),
          type: "markdown",
          text: markdownLines.join("\n"),
        });
      }
    }
  }

  return {
    id: randomid(),
    cells,
    language: metadata.language,
    "tsconfig.json": metadata["tsconfig.json"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Create a new empty notebook
 */
export function createEmptyNotebook(
  title: string,
  language: CodeLanguage
): Notebook {
  const cells: Cell[] = [
    {
      id: randomid(),
      type: "title",
      text: title,
    },
    {
      id: randomid(),
      type: "package.json",
      source: buildDefaultPackageJson(language),
      filename: "package.json",
      status: "idle",
    },
  ];

  const notebook: Notebook = {
    id: randomid(),
    cells,
    language,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (language === "typescript") {
    notebook["tsconfig.json"] = buildDefaultTsconfig();
  }

  return notebook;
}
