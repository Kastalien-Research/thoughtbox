import { z } from "zod";

// Cell Schemas
export const TitleCellSchema = z.object({
  id: z.string(),
  type: z.literal("title"),
  text: z.string(),
});

export const MarkdownCellSchema = z.object({
  id: z.string(),
  type: z.literal("markdown"),
  text: z.string(),
});

export const PackageJsonCellSchema = z.object({
  id: z.string(),
  type: z.literal("package.json"),
  source: z.string(),
  filename: z.literal("package.json"),
  status: z.union([
    z.literal("idle"),
    z.literal("running"),
    z.literal("completed"),
    z.literal("failed"),
  ]),
  output: z.string().optional(),
  error: z.string().optional(),
});

export const CodeCellSchema = z.object({
  id: z.string(),
  type: z.literal("code"),
  language: z.union([z.literal("javascript"), z.literal("typescript")]),
  filename: z.string(),
  source: z.string(),
  status: z.union([
    z.literal("idle"),
    z.literal("running"),
    z.literal("completed"),
    z.literal("failed"),
  ]),
  output: z.string().optional(),
  error: z.string().optional(),
});

export const CellSchema = z.union([
  TitleCellSchema,
  MarkdownCellSchema,
  PackageJsonCellSchema,
  CodeCellSchema,
]);

// Notebook Schema
export const NotebookMetadataSchema = z.object({
  language: z.union([z.literal("javascript"), z.literal("typescript")]),
  "tsconfig.json": z.string().optional(),
});

export const NotebookSchema = z.object({
  id: z.string(),
  cells: z.array(CellSchema),
  language: z.union([z.literal("javascript"), z.literal("typescript")]),
  "tsconfig.json": z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Type exports
export type TitleCell = z.infer<typeof TitleCellSchema>;
export type MarkdownCell = z.infer<typeof MarkdownCellSchema>;
export type PackageJsonCell = z.infer<typeof PackageJsonCellSchema>;
export type CodeCell = z.infer<typeof CodeCellSchema>;
export type Cell = z.infer<typeof CellSchema>;

export type NotebookMetadata = z.infer<typeof NotebookMetadataSchema>;
export type Notebook = z.infer<typeof NotebookSchema>;

export type CodeLanguage = "javascript" | "typescript";
export type CellStatus = "idle" | "running" | "completed" | "failed";

// Utility function to generate random IDs
export function randomid(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Default tsconfig for TypeScript notebooks
export function buildDefaultTsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ES2022",
        moduleResolution: "node",
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true,
      },
    },
    null,
    2
  );
}

// Default package.json templates
export function buildDefaultPackageJson(language: CodeLanguage): string {
  return JSON.stringify(
    {
      type: "module",
      dependencies: {},
    },
    null,
    2
  );
}
