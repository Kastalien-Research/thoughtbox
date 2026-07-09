import { z } from "zod";
import type { Notebook, Cell, CodeCell, NotebookMetadata, CodeLanguage } from "./types.js";
import { randomid, buildDefaultTsconfig, buildDefaultPackageJson } from "./types.js";
import { AttachedContractSchema, verifyAttachedContract } from "./contracts.js";

/**
 * Per-cell binding metadata persisted in the .src.md format as an HTML comment
 * (`<!-- thoughtbox:cell {...} -->`) between the `###### filename` heading and
 * the code fence. Carries the contract/validator bindings introduced by
 * SPEC-AGX-SUBSTRATE B4a, plus the cell id so `validatorFor` references
 * survive an export → load round trip.
 */
const CellBindingMetadataSchema = z
  .object({
    id: z.string().min(1),
    contract: AttachedContractSchema.optional(),
    validatorFor: z.string().min(1).optional(),
    validatorSnapshotHash: z.string().min(1).optional(),
  })
  .refine((m) => m.contract === undefined || m.validatorFor === undefined, {
    message: "a cell declares either a tier-1 contract or validatorFor, not both",
  });

type CellBindingMetadata = z.infer<typeof CellBindingMetadataSchema>;

const CELL_BINDING_PREFIX = "<!-- thoughtbox:cell ";

/**
 * Await-cell persistence (SPEC-AGX-SUBSTRATE B6): a standalone HTML comment
 * line (`<!-- thoughtbox:await {...} -->`). Await cells have no code fence —
 * they execute nothing — so the comment IS the cell. The persisted id keeps
 * instance execution records resolvable across an export → load round trip.
 */
const AwaitCellMetadataSchema = z.object({
  id: z.string().min(1),
  claimId: z.string().min(1),
  until: z
    .array(z.enum(["asserted", "supported", "invalidated", "superseded"]))
    .min(1),
});

const AWAIT_CELL_PREFIX = "<!-- thoughtbox:await ";

function parseAwaitCellLine(line: string): z.infer<typeof AwaitCellMetadataSchema> {
  const match = line.trim().match(/^<!-- thoughtbox:await (.+) -->$/);
  if (!match) {
    throw new Error(`Malformed thoughtbox:await metadata line: ${line.trim()}`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(
      `thoughtbox:await metadata is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const parsed = AwaitCellMetadataSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`thoughtbox:await metadata failed validation: ${issues}`);
  }
  return parsed.data;
}

function encodeCellBinding(
  cell: CodeCell,
  validatorTargetIds: Set<string>,
): string | null {
  const hasBinding =
    cell.contract !== undefined ||
    cell.validatorFor !== undefined ||
    cell.validatorSnapshotHash !== undefined;
  if (!hasBinding && !validatorTargetIds.has(cell.id)) {
    return null;
  }
  const metadata: CellBindingMetadata = {
    id: cell.id,
    ...(cell.contract !== undefined ? { contract: cell.contract } : {}),
    ...(cell.validatorFor !== undefined ? { validatorFor: cell.validatorFor } : {}),
    ...(cell.validatorSnapshotHash !== undefined
      ? { validatorSnapshotHash: cell.validatorSnapshotHash }
      : {}),
  };
  return `${CELL_BINDING_PREFIX}${JSON.stringify(metadata)} -->`;
}

/**
 * Parse a `<!-- thoughtbox:cell {...} -->` line. Throws on malformed JSON,
 * schema violations, or a contract whose hash no longer matches its body
 * (tampering) — contract bindings must never be dropped or accepted silently.
 */
function parseCellBinding(line: string): CellBindingMetadata {
  const match = line.trim().match(/^<!-- thoughtbox:cell (.+) -->$/);
  if (!match) {
    throw new Error(`Malformed thoughtbox:cell metadata line: ${line.trim()}`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(
      `thoughtbox:cell metadata is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const parsed = CellBindingMetadataSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`thoughtbox:cell metadata failed validation: ${issues}`);
  }
  if (parsed.data.contract !== undefined) {
    // Loud tamper detection at import time (same Ulysses gate as run time).
    verifyAttachedContract(parsed.data.id, parsed.data.contract);
  }
  return parsed.data;
}

/**
 * Encode a notebook to .src.md format
 * Format: Markdown with metadata header and code fences for cells
 */
export function encode(notebook: Notebook): string {
  const lines: string[] = [];

  // Cells referenced by a validator need their id persisted so the
  // validatorFor link survives a decode (which otherwise regenerates ids).
  const validatorTargetIds = new Set<string>();
  for (const cell of notebook.cells) {
    if (cell.type === "code" && cell.validatorFor !== undefined) {
      validatorTargetIds.add(cell.validatorFor);
    }
  }

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
      const binding = encodeCellBinding(cell, validatorTargetIds);
      if (binding !== null) {
        lines.push(binding);
        lines.push("");
      }
      const langTag = cell.language === "typescript" ? "typescript" : "javascript";
      lines.push(`\`\`\`${langTag}`);
      lines.push(cell.source);
      lines.push("```");
      lines.push("");
    } else if (cell.type === "await") {
      lines.push(
        `${AWAIT_CELL_PREFIX}${JSON.stringify({
          id: cell.id,
          claimId: cell.claimId,
          until: cell.until,
        })} -->`,
      );
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

      // Optional per-cell binding metadata (contracts / validator bindings)
      let binding: CellBindingMetadata | undefined;
      if (i < lines.length && lines[i].trim().startsWith(CELL_BINDING_PREFIX)) {
        binding = parseCellBinding(lines[i]);
        i++;
        // Skip empty line after the metadata comment
        if (i < lines.length && lines[i].trim() === "") i++;
      }

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
          if (binding !== undefined) {
            throw new Error(
              "thoughtbox:cell metadata is not supported on package.json cells",
            );
          }
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
            id: binding?.id ?? randomid(),
            type: "code",
            language,
            filename,
            source,
            status: "idle",
            ...(binding?.contract !== undefined ? { contract: binding.contract } : {}),
            ...(binding?.validatorFor !== undefined
              ? { validatorFor: binding.validatorFor }
              : {}),
            ...(binding?.validatorSnapshotHash !== undefined
              ? { validatorSnapshotHash: binding.validatorSnapshotHash }
              : {}),
          });
        }
      } else if (binding !== undefined) {
        throw new Error(
          `thoughtbox:cell metadata for cell ${binding.id} is not followed by a code fence`,
        );
      }
    }
    // Await cell (B6): a standalone thoughtbox:await comment line.
    else if (line.trim().startsWith(AWAIT_CELL_PREFIX)) {
      const awaitMeta = parseAwaitCellLine(line);
      cells.push({
        id: awaitMeta.id,
        type: "await",
        claimId: awaitMeta.claimId,
        until: awaitMeta.until,
      });
      i++;
      // Skip following empty line
      if (i < lines.length && lines[i].trim() === "") i++;
    }
    // Markdown cell (everything else)
    else {
      const markdownLines: string[] = [];

      // Collect lines until we hit a title, code cell, or await cell marker
      while (
        i < lines.length &&
        !lines[i].startsWith("# ") &&
        !lines[i].startsWith("###### ") &&
        !lines[i].trim().startsWith(AWAIT_CELL_PREFIX)
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

  // Structural integrity: persisted ids must be unique and every
  // validatorFor binding must resolve to a code cell. A dangling binding
  // would silently degrade to a run-time error, so refuse the load instead.
  const seenIds = new Set<string>();
  for (const cell of cells) {
    if (seenIds.has(cell.id)) {
      throw new Error(`Duplicate cell id "${cell.id}" in thoughtbox:cell metadata`);
    }
    seenIds.add(cell.id);
  }
  for (const cell of cells) {
    if (cell.type !== "code" || cell.validatorFor === undefined) continue;
    const target = cells.find((c) => c.id === cell.validatorFor);
    if (!target || target.type !== "code") {
      throw new Error(
        `validatorFor target ${cell.validatorFor} (declared by cell ${cell.id}) ` +
          "not found or not a code cell",
      );
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
