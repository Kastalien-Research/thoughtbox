import { randomUUID } from "node:crypto";
import type { Notebook } from "../notebook/types.js";
import { compilePeerManifestDraft } from "./manifest.js";
import type { PeerNotebookRepository } from "./repositories.js";
import type {
  CompiledPeerManifest,
  ManifestDraftSource,
  PeerManifestRecord,
  PeerNotebookRecord,
} from "./types.js";

const MANIFEST_SOURCE_NAME = "peer.manifest.json";
const FILENAME_CELL_ADAPTER = "filename-cell-v0";

export interface PeerManifestLifecycleServiceOptions {
  repository: PeerNotebookRepository;
  idGenerator?: () => string;
  now?: () => Date;
}

export interface CompileDraftFromNotebookInput {
  workspaceId: string;
  notebook: Notebook;
  createdBy?: string;
  displayName?: string;
  description?: string;
}

export interface CompileDraftFromNotebookResult {
  peer: PeerNotebookRecord;
  manifest: PeerManifestRecord;
  compiled: CompiledPeerManifest;
}

export interface ApproveAndActivateNotebookManifestInput {
  workspaceId: string;
  peerId: string;
  manifestId: string;
  approvedBy: string;
  approvedAt?: string;
}

export class PeerManifestLifecycleService {
  private readonly idGenerator: () => string;
  private readonly now: () => Date;

  constructor(private readonly options: PeerManifestLifecycleServiceOptions) {
    this.idGenerator = options.idGenerator ?? randomUUID;
    this.now = options.now ?? (() => new Date());
  }

  async compileDraftFromNotebook(input: CompileDraftFromNotebookInput): Promise<CompileDraftFromNotebookResult> {
    const sources = extractManifestDraftSourcesFromNotebook(input.notebook);
    const compiled = compilePeerManifestDraft(sources);
    const now = this.now().toISOString();
    const existingPeer = await this.options.repository.getPeerByPeerId(input.workspaceId, compiled.manifest.peerId);

    const peer: PeerNotebookRecord = {
      id: existingPeer?.id ?? this.idGenerator(),
      workspaceId: input.workspaceId,
      peerId: compiled.manifest.peerId,
      displayName: input.displayName ?? existingPeer?.displayName ?? compiled.manifest.peerId,
      description: input.description ?? existingPeer?.description,
      sourceNotebookRef: {
        kind: "notebook",
        adapter: FILENAME_CELL_ADAPTER,
        notebookId: input.notebook.id,
        sourceName: MANIFEST_SOURCE_NAME,
      },
      createdBy: existingPeer?.createdBy ?? input.createdBy ?? null,
      status: existingPeer?.status ?? "draft",
      activeManifestId: existingPeer?.activeManifestId ?? null,
      createdAt: existingPeer?.createdAt ?? now,
      updatedAt: now,
    };

    await this.options.repository.savePeer(peer);

    const existingManifests = await this.options.repository.listManifestsForPeer(input.workspaceId, peer.id);
    const existingManifest = existingManifests.find(manifest => manifest.manifestHash === compiled.manifestHash);
    if (existingManifest) {
      return { peer, manifest: existingManifest, compiled };
    }

    const manifest: PeerManifestRecord = {
      id: this.idGenerator(),
      workspaceId: input.workspaceId,
      peerRecordId: peer.id,
      peerId: peer.peerId,
      version: nextManifestVersion(existingManifests),
      schemaVersion: compiled.manifest.schemaVersion,
      manifest: compiled.manifest,
      manifestHash: compiled.manifestHash,
      status: "draft",
      compiledFrom: compiled.compiledFrom,
      createdBy: input.createdBy ?? null,
      approvedBy: null,
      approvedAt: null,
      createdAt: now,
    };

    await this.options.repository.saveManifest(manifest);
    return { peer, manifest, compiled };
  }

  async approveAndActivateManifest(input: ApproveAndActivateNotebookManifestInput): Promise<void> {
    await this.options.repository.approveAndActivateManifest(input);
  }
}

export function extractManifestDraftSourcesFromNotebook(notebook: Notebook): ManifestDraftSource[] {
  return notebook.cells.flatMap(cell => {
    if (!("filename" in cell) || cell.filename !== MANIFEST_SOURCE_NAME || !("source" in cell)) {
      return [];
    }

    return [{
      name: MANIFEST_SOURCE_NAME,
      content: cell.source,
      sourceType: "cell" as const,
    }];
  });
}

function nextManifestVersion(manifests: PeerManifestRecord[]): number {
  return Math.max(0, ...manifests.map(manifest => manifest.version)) + 1;
}
