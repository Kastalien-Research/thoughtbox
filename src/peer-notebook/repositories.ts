import { createHash, randomUUID } from "node:crypto";
import type {
  ArtifactKind,
  JsonValue,
  PeerArtifactRecord,
  PeerInvocationRecord,
  PeerManifestRecord,
  PeerNotebookRecord,
  PeerTraceEventRecord,
} from "./types.js";
import { PeerNotebookError } from "./types.js";
import { canonicalizeJson } from "./manifest.js";

export interface PeerNotebookRepository {
  savePeer(peer: PeerNotebookRecord): Promise<void>;
  getPeerByPeerId(workspaceId: string, peerId: string): Promise<PeerNotebookRecord | null>;
  saveManifest(manifest: PeerManifestRecord): Promise<void>;
  getManifest(workspaceId: string, manifestId: string): Promise<PeerManifestRecord | null>;
  saveInvocation(invocation: PeerInvocationRecord): Promise<void>;
  updateInvocation(invocation: PeerInvocationRecord): Promise<void>;
  getInvocation(workspaceId: string, invocationId: string): Promise<PeerInvocationRecord | null>;
  appendTraceEvent(event: Omit<PeerTraceEventRecord, "id" | "seq" | "timestampAt">): Promise<PeerTraceEventRecord>;
  listTraceEvents(workspaceId: string, invocationId: string): Promise<PeerTraceEventRecord[]>;
  saveArtifactInput(input: SaveArtifactInput): Promise<PeerArtifactRecord>;
  getArtifact(workspaceId: string, artifactId: string): Promise<PeerArtifactRecord | null>;
  listArtifacts(workspaceId: string, invocationId: string): Promise<PeerArtifactRecord[]>;
}

export interface SaveArtifactInput {
  id?: string;
  workspaceId: string;
  invocationId: string | null;
  peerRecordId: string | null;
  peerId: string | null;
  kind: ArtifactKind;
  name: string;
  mimeType: string;
  content: JsonValue;
  preview?: JsonValue;
}

export class InMemoryPeerNotebookRepository implements PeerNotebookRepository {
  private peers = new Map<string, PeerNotebookRecord>();
  private manifests = new Map<string, PeerManifestRecord>();
  private invocations = new Map<string, PeerInvocationRecord>();
  private traceEvents = new Map<string, PeerTraceEventRecord[]>();
  private artifacts = new Map<string, PeerArtifactRecord>();

  async savePeer(peer: PeerNotebookRecord): Promise<void> {
    this.peers.set(peerKey(peer.workspaceId, peer.peerId), { ...peer });
  }

  async getPeerByPeerId(workspaceId: string, peerId: string): Promise<PeerNotebookRecord | null> {
    return this.peers.get(peerKey(workspaceId, peerId)) ?? null;
  }

  async saveManifest(manifest: PeerManifestRecord): Promise<void> {
    this.manifests.set(manifestKey(manifest.workspaceId, manifest.id), { ...manifest });
  }

  async getManifest(workspaceId: string, manifestId: string): Promise<PeerManifestRecord | null> {
    return this.manifests.get(manifestKey(workspaceId, manifestId)) ?? null;
  }

  async saveInvocation(invocation: PeerInvocationRecord): Promise<void> {
    this.invocations.set(invocationKey(invocation.workspaceId, invocation.id), { ...invocation });
  }

  async updateInvocation(invocation: PeerInvocationRecord): Promise<void> {
    if (!this.invocations.has(invocationKey(invocation.workspaceId, invocation.id))) {
      throw new PeerNotebookError("peer_not_found", `Invocation ${invocation.id} does not exist`);
    }
    await this.saveInvocation(invocation);
  }

  async getInvocation(workspaceId: string, invocationId: string): Promise<PeerInvocationRecord | null> {
    return this.invocations.get(invocationKey(workspaceId, invocationId)) ?? null;
  }

  async appendTraceEvent(
    event: Omit<PeerTraceEventRecord, "id" | "seq" | "timestampAt">,
  ): Promise<PeerTraceEventRecord> {
    const key = invocationKey(event.workspaceId, event.invocationId);
    const existing = this.traceEvents.get(key) ?? [];
    const record: PeerTraceEventRecord = {
      ...event,
      id: randomUUID(),
      seq: existing.length + 1,
      timestampAt: new Date().toISOString(),
    };
    this.traceEvents.set(key, [...existing, record]);
    return record;
  }

  async listTraceEvents(workspaceId: string, invocationId: string): Promise<PeerTraceEventRecord[]> {
    return [...(this.traceEvents.get(invocationKey(workspaceId, invocationId)) ?? [])];
  }

  async saveArtifactInput(input: SaveArtifactInput): Promise<PeerArtifactRecord> {
    const payload = canonicalizeJson(input.content);
    const id = input.id ?? randomUUID();
    const record: PeerArtifactRecord = {
      id,
      workspaceId: input.workspaceId,
      invocationId: input.invocationId,
      peerRecordId: input.peerRecordId,
      peerId: input.peerId,
      kind: input.kind,
      name: input.name,
      mimeType: input.mimeType,
      byteSize: Buffer.byteLength(payload, "utf8"),
      sha256: createHash("sha256").update(payload, "utf8").digest("hex"),
      storageBackend: "memory",
      storagePath: `memory://${input.workspaceId}/${input.peerId ?? "unowned"}/${id}/${input.name}`,
      preview: input.preview,
      content: input.content,
      createdAt: new Date().toISOString(),
    };
    this.artifacts.set(artifactKey(record.workspaceId, record.id), record);
    return record;
  }

  async getArtifact(workspaceId: string, artifactId: string): Promise<PeerArtifactRecord | null> {
    return this.artifacts.get(artifactKey(workspaceId, artifactId)) ?? null;
  }

  async listArtifacts(workspaceId: string, invocationId: string): Promise<PeerArtifactRecord[]> {
    return [...this.artifacts.values()].filter(
      artifact => artifact.workspaceId === workspaceId && artifact.invocationId === invocationId,
    );
  }
}

function peerKey(workspaceId: string, peerId: string): string {
  return `${workspaceId}:${peerId}`;
}

function manifestKey(workspaceId: string, manifestId: string): string {
  return `${workspaceId}:${manifestId}`;
}

function invocationKey(workspaceId: string, invocationId: string): string {
  return `${workspaceId}:${invocationId}`;
}

function artifactKey(workspaceId: string, artifactId: string): string {
  return `${workspaceId}:${artifactId}`;
}
