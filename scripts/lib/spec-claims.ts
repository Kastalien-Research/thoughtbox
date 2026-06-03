import { promises as fsp } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

export const SpecClaimSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  type: z.enum(["implementation", "behavioral", "governance", "performance"]),
  behavioral: z.boolean(),
  required_evidence: z.string().optional(),
});

export const SpecFrontmatterSchema = z.object({
  spec_id: z.string().regex(/^SPEC-[A-Z0-9-]+$/),
  title: z.string().min(1),
  status: z.enum(["draft", "active", "deprecated", "superseded"]),
  date: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)),
  branch: z.string().optional(),
  claims: z.array(SpecClaimSchema).min(1),
  links: z.array(z.string()).optional(),
});

export type SpecClaim = z.infer<typeof SpecClaimSchema>;
export type SpecFrontmatter = z.infer<typeof SpecFrontmatterSchema>;

export interface IndexedSpecClaim {
  specId: string;
  claimId: string;
  ref: string;
  behavioral: boolean;
  filePath: string;
}

const SPEC_CLAIM_REF = /^([A-Z0-9-]+):([a-z0-9]+)$/i;

export function parseSpecClaimRef(ref: string): { specId: string; claimId: string } | null {
  if (ref === "__none__") return null;
  const match = SPEC_CLAIM_REF.exec(ref);
  if (!match) return null;
  return { specId: match[1], claimId: match[2] };
}

export function formatSpecClaimRef(specId: string, claimId: string): string {
  return `${specId}:${claimId}`;
}

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function loadSpecClaimIndex(specsRoot: string): Promise<Map<string, IndexedSpecClaim>> {
  const index = new Map<string, IndexedSpecClaim>();

  let files: string[];
  try {
    files = await walkMarkdownFiles(specsRoot);
  } catch {
    return index;
  }

  for (const filePath of files) {
    const raw = await fsp.readFile(filePath, "utf8");
    const parsed = matter(raw);
    const result = SpecFrontmatterSchema.safeParse(parsed.data);
    if (!result.success) continue;

    const spec = result.data;
    for (const claim of spec.claims) {
      const ref = formatSpecClaimRef(spec.spec_id, claim.id);
      index.set(ref, {
        specId: spec.spec_id,
        claimId: claim.id,
        ref,
        behavioral: claim.behavioral,
        filePath,
      });
    }
  }

  return index;
}
