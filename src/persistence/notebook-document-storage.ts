/**
 * Durable notebook-document persistence behind the `notebook_persist`
 * contract (.specs/agentic-runbooks.md H4; dual-backend architecture
 * decision — FileSystem for local/self-hosted, Supabase for deployed).
 *
 * The persisted unit is the notebook's canonical `.src.md` encoding (the
 * same content `notebook_export` returns; contract/validator bindings
 * survive via the `thoughtbox:cell` comments, SPEC-AGX-SUBSTRATE §5.1.6)
 * plus identifying metadata. Notebooks are living documents: `save` is an
 * upsert keyed by notebookId — latest persisted document wins. This is
 * deliberately NOT the append-only runbook substrate (templates/instances/
 * ledger live in RunbookStorage); it is cross-session document recall.
 *
 * Restore path: `notebook_load { notebookId }` reads the persisted document
 * and re-materializes it under its original notebook id.
 */

import * as fs from "fs/promises";
import * as path from "path";

export interface PersistedNotebookDocument {
  notebookId: string;
  title: string;
  language: "javascript" | "typescript";
  /** Canonical .src.md encoding of the notebook. */
  content: string;
  /** ISO timestamp of this persist. */
  persistedAt: string;
}

export type NotebookDocumentSummary = Omit<PersistedNotebookDocument, "content">;

export interface NotebookDocumentStorage {
  /** Label reported by notebook_persist as its `persistence` field. */
  readonly backend: "in_memory" | "file_system" | "supabase";
  /** Upsert by notebookId — notebooks are living documents, latest wins. */
  save(doc: PersistedNotebookDocument): Promise<void>;
  load(notebookId: string): Promise<PersistedNotebookDocument | null>;
  list(): Promise<NotebookDocumentSummary[]>;
}

/**
 * Notebook ids are randomid()/decode-generated alphanumerics; enforcing the
 * shape here keeps filesystem paths traversal-safe and matches both backends
 * so behavior cannot diverge on odd ids.
 */
export function assertValidNotebookId(notebookId: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(notebookId)) {
    throw new Error(
      `Invalid notebook id for persistence: "${notebookId}" ` +
        `(expected [A-Za-z0-9_-]+)`,
    );
  }
}

/** Volatile backend for tests and as the honest default label. */
export class InMemoryNotebookDocumentStorage implements NotebookDocumentStorage {
  readonly backend = "in_memory" as const;
  private docs = new Map<string, PersistedNotebookDocument>();

  async save(doc: PersistedNotebookDocument): Promise<void> {
    assertValidNotebookId(doc.notebookId);
    this.docs.set(doc.notebookId, { ...doc });
  }

  async load(notebookId: string): Promise<PersistedNotebookDocument | null> {
    assertValidNotebookId(notebookId);
    const doc = this.docs.get(notebookId);
    return doc ? { ...doc } : null;
  }

  async list(): Promise<NotebookDocumentSummary[]> {
    return Array.from(this.docs.values())
      .map(({ content: _content, ...summary }) => summary)
      .sort((a, b) => a.notebookId.localeCompare(b.notebookId));
  }
}

/**
 * FileSystem backend (local/self-hosted): one `<notebookId>.src.md` per
 * notebook plus a `<notebookId>.meta.json` sidecar carrying the metadata
 * the .src.md encoding does not (title duplication aside, persistedAt and
 * language are authoritative in the sidecar).
 */
export class FileSystemNotebookDocumentStorage implements NotebookDocumentStorage {
  readonly backend = "file_system" as const;

  constructor(private readonly baseDir: string) {}

  private contentPath(notebookId: string): string {
    return path.join(this.baseDir, `${notebookId}.src.md`);
  }

  private metaPath(notebookId: string): string {
    return path.join(this.baseDir, `${notebookId}.meta.json`);
  }

  async save(doc: PersistedNotebookDocument): Promise<void> {
    assertValidNotebookId(doc.notebookId);
    await fs.mkdir(this.baseDir, { recursive: true });
    const meta: NotebookDocumentSummary = {
      notebookId: doc.notebookId,
      title: doc.title,
      language: doc.language,
      persistedAt: doc.persistedAt,
    };
    await fs.writeFile(this.contentPath(doc.notebookId), doc.content, "utf8");
    await fs.writeFile(
      this.metaPath(doc.notebookId),
      JSON.stringify(meta, null, 2),
      "utf8",
    );
  }

  async load(notebookId: string): Promise<PersistedNotebookDocument | null> {
    assertValidNotebookId(notebookId);
    let content: string;
    let metaRaw: string;
    try {
      [content, metaRaw] = await Promise.all([
        fs.readFile(this.contentPath(notebookId), "utf8"),
        fs.readFile(this.metaPath(notebookId), "utf8"),
      ]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
    const meta = JSON.parse(metaRaw) as NotebookDocumentSummary;
    return { ...meta, notebookId, content };
  }

  async list(): Promise<NotebookDocumentSummary[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.baseDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    const summaries: NotebookDocumentSummary[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".meta.json")) continue;
      const metaRaw = await fs.readFile(path.join(this.baseDir, entry), "utf8");
      summaries.push(JSON.parse(metaRaw) as NotebookDocumentSummary);
    }
    return summaries.sort((a, b) => a.notebookId.localeCompare(b.notebookId));
  }
}
