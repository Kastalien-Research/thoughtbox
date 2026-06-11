import { randomUUID } from "node:crypto";
import { createPeerBroker } from "./broker.js";
import { compilePeerManifestDraft } from "./manifest.js";
import { MockPeerRuntimeProvider } from "./mock-runtime-provider.js";
import { createBrokerProxyTargets, type BrokerProxyTargetDeps } from "./proxy-targets.js";
import { InMemoryPeerNotebookRepository, type PeerNotebookRepository } from "./repositories.js";
import { PeerNotebookError } from "./types.js";
import type {
  JsonObject,
  PeerArtifactRecord,
  PeerInvocationRecord,
  PeerManifest,
  PeerManifestRecord,
  PeerManifestStatus,
  PeerNotebookRecord,
  PeerTraceEventRecord,
  RuntimeProviderName,
} from "./types.js";

const CLAIM_EXTRACTOR_PEER_ID = "claim-extractor";
const CLAIM_EXTRACTOR_PEER_RECORD_ID = "7b54fe91-31df-43dd-ae25-b95bc2cf6406";
const CLAIM_EXTRACTOR_MANIFEST_ID = "b6d03683-6566-46c8-9424-b9b1344f5f32";
const CLAIM_EXTRACTOR_NOTEBOOK_ID = "nb_claim_extractor";
const BOOTSTRAP_TIMESTAMP = "2026-04-30T00:00:00.000Z";

// SPEC-CONTROL-PLANE c2 bootstrap exception: the claim-extractor pilot is the
// platform-owned built-in peer and is the ONLY manifest permitted to bootstrap
// directly to "active" so it works out of the box. Every other creation path
// (createManifestDraft, future notebook graduation) persists status "draft"
// and requires an explicit peer_manifest_approve before broker dispatch.
const PLATFORM_BUILTIN_BOOTSTRAP_MANIFEST_STATUS: PeerManifestStatus = "active";

export interface PeerNotebookHandlerOptions {
  workspaceId?: string;
  getWorkspaceId?: () => string | undefined;
  repository?: PeerNotebookRepository;
  mockRuntimeProvider?: MockPeerRuntimeProvider;
  /**
   * Real outbound handlers behind the broker proxy targets. Optional: absent
   * handlers yield target_unavailable errors at call time, never crashes.
   */
  proxyTargetDeps?: BrokerProxyTargetDeps;
}

export interface PeerArtifactSeedInput {
  text: string;
  name?: string;
}

export interface PeerInvokeToolInput {
  peerId: string;
  tool: string;
  args: JsonObject;
}

export interface PeerManifestCreateInput {
  manifestJson: string;
  displayName?: string;
  description?: string;
}

export class PeerNotebookHandler {
  private readonly repository: PeerNotebookRepository;
  private readonly mockRuntimeProvider: MockPeerRuntimeProvider;
  private readonly bootstrappedWorkspaces = new Set<string>();
  private readonly bootstrapPromises = new Map<string, Promise<void>>();

  constructor(private readonly options: PeerNotebookHandlerOptions = {}) {
    this.repository = options.repository ?? new InMemoryPeerNotebookRepository();
    this.mockRuntimeProvider = options.mockRuntimeProvider ?? new MockPeerRuntimeProvider();
  }

  getRuntimeProviderNames(): RuntimeProviderName[] {
    return ["mock"];
  }

  async seedArtifact(input: PeerArtifactSeedInput): Promise<{ artifact: PeerArtifactRecord }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const artifact = await this.repository.saveArtifactInput({
      workspaceId,
      invocationId: null,
      peerRecordId: null,
      peerId: null,
      kind: "text",
      name: input.name ?? "input.txt",
      mimeType: "text/plain",
      content: input.text,
      preview: previewText(input.text),
    });

    return { artifact };
  }

  async invoke(input: PeerInvokeToolInput) {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const broker = createPeerBroker({
      workspaceId,
      repository: this.repository,
      runtimeProviders: {
        mock: this.mockRuntimeProvider,
      },
      proxyTargets: createBrokerProxyTargets(this.options.proxyTargetDeps),
    });

    const result = await broker.peer.invoke(input);
    const artifacts = await this.repository.listArtifacts(workspaceId, result.invocationId);

    return {
      ...result,
      artifactRefs: artifacts.map(toArtifactRef),
    };
  }

  async getInvocation(invocationId: string): Promise<{ invocation: PeerInvocationRecord }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const invocation = await this.repository.getInvocation(workspaceId, invocationId);
    if (!invocation) {
      throw new PeerNotebookError("invocation_not_found", `Invocation ${invocationId} does not exist`);
    }

    return { invocation };
  }

  async listTraceEvents(invocationId: string): Promise<{ events: PeerTraceEventRecord[] }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const invocation = await this.repository.getInvocation(workspaceId, invocationId);
    if (!invocation) {
      throw new PeerNotebookError("invocation_not_found", `Invocation ${invocationId} does not exist`);
    }

    return {
      events: await this.repository.listTraceEvents(workspaceId, invocationId),
    };
  }

  async getArtifact(artifactId: string): Promise<{ artifact: PeerArtifactRecord }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const artifact = await this.repository.getArtifact(workspaceId, artifactId);
    if (!artifact) {
      throw new PeerNotebookError("artifact_not_found", `Artifact ${artifactId} does not exist`);
    }

    return { artifact };
  }

  async createManifestDraft(input: PeerManifestCreateInput): Promise<{ manifest: PeerManifestRecord }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const compiled = compilePeerManifestDraft([
      {
        name: "peer.manifest.json",
        sourceType: "file",
        content: input.manifestJson,
      },
    ]);

    const now = new Date().toISOString();
    let peer = await this.repository.getPeerByPeerId(workspaceId, compiled.manifest.peerId);
    if (!peer) {
      peer = {
        id: randomUUID(),
        workspaceId,
        peerId: compiled.manifest.peerId,
        displayName: input.displayName ?? compiled.manifest.peerId,
        description: input.description,
        status: "active",
        activeManifestId: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.repository.savePeer(peer);
    }

    const existing = await this.repository.listManifests(workspaceId, peer.id);
    const duplicate = existing.find(record => record.manifestHash === compiled.manifestHash);
    if (duplicate) {
      throw new PeerNotebookError(
        "manifest_duplicate",
        `Peer ${peer.peerId} already has manifest ${duplicate.id} (status ${duplicate.status}) with hash ${compiled.manifestHash}`,
      );
    }

    const manifest: PeerManifestRecord = {
      id: randomUUID(),
      workspaceId,
      peerRecordId: peer.id,
      peerId: peer.peerId,
      version: (existing.at(-1)?.version ?? 0) + 1,
      schemaVersion: compiled.manifest.schemaVersion,
      manifest: compiled.manifest,
      manifestHash: compiled.manifestHash,
      status: "draft",
      compiledFrom: compiled.compiledFrom,
      approvedAt: null,
      createdAt: now,
    };
    await this.repository.saveManifest(manifest);

    return { manifest };
  }

  async approveManifest(
    manifestId: string,
  ): Promise<{ manifest: PeerManifestRecord; retiredManifestId: string | null }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const manifest = await this.requireManifest(workspaceId, manifestId);
    if (manifest.status !== "draft") {
      throw new PeerNotebookError(
        "invalid_manifest_transition",
        `Manifest ${manifest.id} is ${manifest.status}; only draft manifests can be approved`,
      );
    }

    const peer = await this.repository.getPeerByPeerId(workspaceId, manifest.peerId);
    if (!peer) {
      throw new PeerNotebookError("peer_not_found", `Peer ${manifest.peerId} does not exist`);
    }

    let retiredManifestId: string | null = null;
    if (peer.activeManifestId && peer.activeManifestId !== manifest.id) {
      const previous = await this.repository.getManifest(workspaceId, peer.activeManifestId);
      if (previous?.status === "active") {
        await this.repository.saveManifest({ ...previous, status: "retired" });
        retiredManifestId = previous.id;
      }
    }

    const now = new Date().toISOString();
    const approved: PeerManifestRecord = { ...manifest, status: "active", approvedAt: now };
    await this.repository.saveManifest(approved);
    await this.repository.savePeer({ ...peer, activeManifestId: approved.id, updatedAt: now });

    return { manifest: approved, retiredManifestId };
  }

  async rejectManifest(manifestId: string): Promise<{ manifest: PeerManifestRecord }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const manifest = await this.requireManifest(workspaceId, manifestId);
    if (manifest.status !== "draft") {
      throw new PeerNotebookError(
        "invalid_manifest_transition",
        `Manifest ${manifest.id} is ${manifest.status}; only draft manifests can be rejected`,
      );
    }

    const rejected: PeerManifestRecord = { ...manifest, status: "rejected" };
    await this.repository.saveManifest(rejected);

    return { manifest: rejected };
  }

  async listManifests(peerId: string): Promise<{ manifests: PeerManifestRecord[] }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const peer = await this.repository.getPeerByPeerId(workspaceId, peerId);
    if (!peer) {
      throw new PeerNotebookError("peer_not_found", `Peer ${peerId} does not exist`);
    }

    return { manifests: await this.repository.listManifests(workspaceId, peer.id) };
  }

  private async requireManifest(workspaceId: string, manifestId: string): Promise<PeerManifestRecord> {
    const manifest = await this.repository.getManifest(workspaceId, manifestId);
    if (!manifest) {
      throw new PeerNotebookError("manifest_not_found", `Manifest ${manifestId} does not exist`);
    }
    return manifest;
  }

  private resolveWorkspaceId(): string {
    return this.options.getWorkspaceId?.() ?? this.options.workspaceId ?? "default";
  }

  private async bootstrapWorkspace(workspaceId: string): Promise<void> {
    if (this.bootstrappedWorkspaces.has(workspaceId)) {
      return;
    }

    const existingPromise = this.bootstrapPromises.get(workspaceId);
    if (existingPromise) {
      await existingPromise;
      return;
    }

    const bootstrapPromise = this.performBootstrapWorkspace(workspaceId).finally(() => {
      this.bootstrapPromises.delete(workspaceId);
    });
    this.bootstrapPromises.set(workspaceId, bootstrapPromise);
    await bootstrapPromise;
  }

  private async performBootstrapWorkspace(workspaceId: string): Promise<void> {
    const existing = await this.repository.getPeerByPeerId(workspaceId, CLAIM_EXTRACTOR_PEER_ID);
    if (existing?.activeManifestId) {
      this.bootstrappedWorkspaces.add(workspaceId);
      return;
    }

    const compiled = compilePeerManifestDraft([
      {
        name: "peer.manifest.json",
        sourceType: "file",
        content: JSON.stringify(claimExtractorManifest()),
      },
    ]);

    const peer: PeerNotebookRecord = {
      id: CLAIM_EXTRACTOR_PEER_RECORD_ID,
      workspaceId,
      peerId: CLAIM_EXTRACTOR_PEER_ID,
      displayName: "Claim extractor",
      description: "Deterministic mock peer that extracts sentence-level claims from a text artifact.",
      status: "active",
      activeManifestId: CLAIM_EXTRACTOR_MANIFEST_ID,
      createdAt: BOOTSTRAP_TIMESTAMP,
      updatedAt: BOOTSTRAP_TIMESTAMP,
    };

    const manifest: PeerManifestRecord = {
      id: CLAIM_EXTRACTOR_MANIFEST_ID,
      workspaceId,
      peerRecordId: peer.id,
      peerId: peer.peerId,
      version: 1,
      schemaVersion: compiled.manifest.schemaVersion,
      manifest: compiled.manifest,
      manifestHash: compiled.manifestHash,
      status: PLATFORM_BUILTIN_BOOTSTRAP_MANIFEST_STATUS,
      compiledFrom: compiled.compiledFrom,
      approvedAt: BOOTSTRAP_TIMESTAMP,
      createdAt: BOOTSTRAP_TIMESTAMP,
    };

    await this.repository.savePeer(peer);
    await this.repository.saveManifest(manifest);
    this.bootstrappedWorkspaces.add(workspaceId);
  }
}

function claimExtractorManifest(): PeerManifest {
  return {
    schemaVersion: "peer-notebook.v0",
    peerId: CLAIM_EXTRACTOR_PEER_ID,
    notebookId: CLAIM_EXTRACTOR_NOTEBOOK_ID,
    runtime: {
      provider: "mock",
      timeoutMs: 120_000,
    },
    exposes: {
      tools: [
        {
          name: "extract_claims",
          description: "Extract atomic claims from a text artifact",
          inputSchema: {
            type: "object",
            properties: {
              textArtifactId: { type: "string" },
            },
            required: ["textArtifactId"],
            additionalProperties: false,
          },
          outputSchema: {
            type: "object",
            properties: {
              claimsArtifactId: { type: "string" },
              claimCount: { type: "number" },
            },
            required: ["claimsArtifactId", "claimCount"],
            additionalProperties: false,
          },
        },
      ],
      resources: [],
      prompts: [],
    },
    mayCall: {
      mcpTools: ["artifact.get"],
    },
    network: {
      enabled: false,
      allowHosts: [],
    },
    filesystem: {
      mounts: [],
    },
    secrets: {
      bindings: [],
    },
    persistence: {
      snapshot: "manual",
      exportNotebookOnInvoke: true,
      retainArtifactsDays: 30,
    },
    budgets: {
      maxDurationMs: 120_000,
      maxToolCalls: 10,
      maxArtifactBytes: 10_000_000,
    },
  };
}

function previewText(text: string): string {
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}

function toArtifactRef(artifact: PeerArtifactRecord) {
  return {
    artifactId: artifact.id,
    kind: artifact.kind,
    name: artifact.name,
    mimeType: artifact.mimeType,
    byteSize: artifact.byteSize,
    sha256: artifact.sha256,
    preview: artifact.preview,
  };
}
