/**
 * Concurrency-safe template version resolution (SPEC-AGX-SUBSTRATE B4b).
 *
 * `getLatestTemplate` → compute `version + 1` → `saveTemplate` is a
 * check-then-act sequence: two concurrent runs of the same notebook can both
 * read the same latest version, both compute the same next version, and the
 * loser's insert hits the (templateId, version) uniqueness guarantee — the
 * runbook_templates primary key on the Supabase backend, the duplicate-key
 * check on the InMemory backend. `ensureTemplateVersion` makes the loser
 * recover instead of failing the run: on a version conflict it re-fetches,
 * reuses the winner's just-written version when the cells hash matches, and
 * appends the next version when the content actually diverged.
 */

import {
  hashTemplateCells,
  type RunbookStorage,
  type RunbookTemplate,
  type RunbookTemplateCell,
} from "./types.js";

/**
 * Thrown by `RunbookStorage.saveTemplate` when (templateId, version) already
 * exists. Typed (rather than a message-matched generic Error) so
 * `ensureTemplateVersion` can distinguish a lost version race — recoverable —
 * from a genuine storage failure, on both backends.
 */
export class TemplateVersionConflictError extends Error {
  constructor(
    readonly templateId: string,
    readonly version: number,
    detail?: string,
  ) {
    super(
      `template ${templateId} version ${version} already exists — ` +
        `versions are immutable; append a new version` +
        (detail ? ` (${detail})` : ""),
    );
    this.name = "TemplateVersionConflictError";
  }
}

const MAX_VERSION_ATTEMPTS = 5;

/**
 * Resolve the template version for the given cells: reuse the latest version
 * when its canonical cells hash matches, otherwise append the next version.
 * Safe under concurrent callers — a lost `saveTemplate` race is retried
 * against the fresh latest version instead of propagating as a failure.
 */
export async function ensureTemplateVersion(
  storage: RunbookStorage,
  args: { templateId: string; cells: RunbookTemplateCell[]; createdBy: string },
): Promise<RunbookTemplate> {
  const cellsHash = hashTemplateCells(args.cells);
  for (let attempt = 1; attempt <= MAX_VERSION_ATTEMPTS; attempt += 1) {
    const latest = await storage.getLatestTemplate(args.templateId);
    if (latest && latest.cellsHash === cellsHash) return latest;
    const candidate: RunbookTemplate = {
      templateId: args.templateId,
      version: (latest?.version ?? 0) + 1,
      cells: args.cells,
      cellsHash,
      createdBy: args.createdBy,
      createdAt: new Date().toISOString(),
    };
    try {
      await storage.saveTemplate(candidate);
      return candidate;
    } catch (cause) {
      if (!(cause instanceof TemplateVersionConflictError)) throw cause;
      // Lost the race: a concurrent caller wrote this version first. Loop —
      // the re-fetch reuses the winner's version when its cells hash matches
      // ours, or appends the next version when the content diverged.
    }
  }
  throw new Error(
    `ensureTemplateVersion failed for template ${args.templateId}: ` +
      `version still contended after ${MAX_VERSION_ATTEMPTS} attempts`,
  );
}
