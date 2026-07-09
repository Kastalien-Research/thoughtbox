import { randomUUID } from "node:crypto";
import { createPeerBroker } from "./broker.js";
import { LocalProcessRuntimeProvider } from "./local-process-runtime-provider.js";
import { compilePeerManifestDraft } from "./manifest.js";
import { createBrokerProxyTargets, type BrokerProxyTargetDeps } from "./proxy-targets.js";
import { InMemoryPeerNotebookRepository, type PeerNotebookRepository } from "./repositories.js";
import type { RuntimeProvider } from "./runtime-provider.js";
import { notebookEntryFilename, PeerNotebookError } from "./types.js";
import type {
  CompiledPeerManifest,
  JsonObject,
  ManifestDraftSource,
  PeerArtifactRecord,
  PeerInvocationRecord,
  PeerManifest,
  PeerManifestRecord,
  PeerManifestStatus,
  PeerNotebookCodeSnapshot,
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
// (createManifestDraft and graduateNotebook) persists status "draft" and
// requires an explicit peer_manifest_approve before broker dispatch.
const PLATFORM_BUILTIN_BOOTSTRAP_MANIFEST_STATUS: PeerManifestStatus = "active";

/**
 * Notebook graduation convention: the manifest lives in a code cell whose
 * filename is exactly this name; the cell's source TEXT is parsed as JSON.
 */
const MANIFEST_CELL_FILENAME = "peer.manifest.json";

/**
 * Structural view of a notebook cell for graduation. Only code cells carry
 * filename/source; graduation reads cell TEXT as data and never executes it.
 */
export interface PeerGraduationNotebookCell {
  id: string;
  type: string;
  filename?: string;
  source?: string;
}

export interface PeerGraduationNotebook {
  id: string;
  cells: PeerGraduationNotebookCell[];
  /** Notebook language; drives how a `notebook:` entry cell executes. */
  language?: string;
  /** Optional tsconfig captured into the graduation code snapshot. */
  "tsconfig.json"?: string;
}

/** Read-only notebook lookup used by peer_graduate_notebook. */
export interface PeerGraduationNotebookSource {
  getNotebook(notebookId: string): PeerGraduationNotebook | undefined;
}

export interface PeerNotebookHandlerOptions {
  workspaceId?: string;
  getWorkspaceId?: () => string | undefined;
  repository?: PeerNotebookRepository;
  /**
   * Notebook lookup for peer_graduate_notebook. Graduation reads the manifest
   * cell text as pure data; absent wiring fails graduation with a clear error.
   */
  notebookSource?: PeerGraduationNotebookSource;
  /**
   * Runtime provider override; tests inject MockPeerRuntimeProvider here.
   * Production wiring keeps the default development-only local-process
   * provider, so the mock never registers outside tests.
   */
  runtimeProvider?: RuntimeProvider;
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

export interface PeerGraduateNotebookInput {
  notebookId: string;
  displayName?: string;
  description?: string;
}

export class PeerNotebookHandler {
  private readonly repository: PeerNotebookRepository;
  private readonly runtimeProvider: RuntimeProvider;
  private readonly runtimeProviderName: RuntimeProviderName;
  private readonly bootstrappedWorkspaces = new Set<string>();
  private readonly bootstrapPromises = new Map<string, Promise<void>>();

  constructor(private readonly options: PeerNotebookHandlerOptions = {}) {
    this.repository = options.repository ?? new InMemoryPeerNotebookRepository();
    this.runtimeProvider = options.runtimeProvider ?? new LocalProcessRuntimeProvider();
    this.runtimeProviderName = this.runtimeProvider.describe().provider;
  }

  getRuntimeProviderNames(): RuntimeProviderName[] {
    return [this.runtimeProviderName];
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
        [this.runtimeProviderName]: this.runtimeProvider,
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
        name: MANIFEST_CELL_FILENAME,
        sourceType: "file",
        content: input.manifestJson,
      },
    ]);

    const { manifest } = await this.persistDraft(workspaceId, compiled, input, {
      supersedeGraduatedDrafts: false,
    });
    return { manifest };
  }

  /**
   * Promote a notebook into a draft peer manifest. The manifest is declared
   * in a code cell whose filename is exactly `peer.manifest.json`; the cell's
   * source text is parsed and validated as pure JSON data — graduation never
   * executes notebook code. Graduated manifests are always drafts; the 5.1
   * approval flow governs activation.
   */
  async graduateNotebook(
    input: PeerGraduateNotebookInput,
  ): Promise<{ manifest: PeerManifestRecord; supersededManifestIds: string[] }> {
    const workspaceId = this.resolveWorkspaceId();
    await this.bootstrapWorkspace(workspaceId);

    const notebookSource = this.options.notebookSource;
    if (!notebookSource) {
      throw new Error(
        "peer_graduate_notebook requires a notebook source; this handler was constructed without notebookSource",
      );
    }

    const notebook = notebookSource.getNotebook(input.notebookId);
    if (!notebook) {
      throw new PeerNotebookError("notebook_not_found", `Notebook ${input.notebookId} does not exist`);
    }

    const sources = manifestDraftSourcesFromNotebook(notebook);
    if (!sources.some(source => source.name === MANIFEST_CELL_FILENAME)) {
      throw new PeerNotebookError(
        "manifest_compile_error",
        `Notebook ${notebook.id} has no code cell named ${MANIFEST_CELL_FILENAME}; ` +
          "graduation requires exactly one manifest cell whose text is the peer manifest JSON",
      );
    }

    const compiled = compilePeerManifestDraft(sources);
    if (compiled.manifest.notebookId !== notebook.id) {
      throw new PeerNotebookError(
        "manifest_compile_error",
        `${MANIFEST_CELL_FILENAME} declares notebookId "${compiled.manifest.notebookId}" ` +
          `but the graduating notebook is "${notebook.id}"`,
      );
    }
    this.validateGraduatedRuntimeBinding(compiled.manifest);

    // A `notebook:` runtime entry graduates with an immutable code snapshot on
    // the manifest record: the notebook's executable cells, captured now, are
    // what the runtime provider will execute — never live notebook state, so
    // the peer keeps working after the authoring session is gone.
    const entryCellFilename = notebookEntryFilename(compiled.manifest.runtime.entry);
    if (entryCellFilename !== null) {
      compiled.compiledFrom.notebook = buildNotebookCodeSnapshot(notebook, entryCellFilename);
    }

    return this.persistDraft(workspaceId, compiled, input, { supersedeGraduatedDrafts: true });
  }

  /**
   * Graduated manifests must be invocable once approved: the declared runtime
   * provider has to be registered on this handler, and providers with a fixed
   * entry registry (local-process) must resolve runtime.entry now, at
   * graduation, instead of failing at first invoke.
   */
  private validateGraduatedRuntimeBinding(manifest: PeerManifest): void {
    if (manifest.runtime.provider !== this.runtimeProviderName) {
      throw new PeerNotebookError(
        "runtime_provider_not_found",
        `Graduated manifest declares runtime.provider "${manifest.runtime.provider}" ` +
          `but only "${this.runtimeProviderName}" is registered`,
      );
    }

    const provider = this.runtimeProvider;
    if (!provider.resolvesEntry) {
      return;
    }
    if (!manifest.runtime.entry) {
      throw new PeerNotebookError(
        "manifest_compile_error",
        `Graduated manifest omits runtime.entry, which provider "${this.runtimeProviderName}" ` +
          "requires to resolve a registered entry script",
      );
    }
    if (!provider.resolvesEntry(manifest.runtime.entry)) {
      throw new PeerNotebookError(
        "manifest_compile_error",
        `Graduated manifest names runtime.entry "${manifest.runtime.entry}", ` +
          `which is not a registered ${this.runtimeProviderName} entry script`,
      );
    }
  }

  private async persistDraft(
    workspaceId: string,
    compiled: CompiledPeerManifest,
    identity: { displayName?: string; description?: string },
    options: { supersedeGraduatedDrafts: boolean },
  ): Promise<{ manifest: PeerManifestRecord; supersededManifestIds: string[] }> {
    const now = new Date().toISOString();
    let peer = await this.repository.getPeerByPeerId(workspaceId, compiled.manifest.peerId);
    if (!peer) {
      peer = {
        id: randomUUID(),
        workspaceId,
        peerId: compiled.manifest.peerId,
        displayName: identity.displayName ?? compiled.manifest.peerId,
        description: identity.description,
        status: "active",
        activeManifestId: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.repository.savePeer(peer);
    }

    const existing = await this.repository.listManifests(workspaceId, peer.id);
    const duplicate = existing.find(
      record =>
        (record.status === "draft" || record.status === "active")
        && record.manifestHash === compiled.manifestHash,
    );
    if (duplicate) {
      throw new PeerNotebookError(
        "manifest_duplicate",
        `Peer ${peer.peerId} already has manifest ${duplicate.id} (status ${duplicate.status}) with hash ${compiled.manifestHash}`,
      );
    }

    // Re-graduation supersedes the prior pending graduated draft the same way
    // approval supersedes the prior active manifest (5.1): the old record is
    // retired and can no longer be approved. Only cell-sourced drafts are
    // touched; operator-created file drafts keep their pending status.
    const supersededManifestIds: string[] = [];
    if (options.supersedeGraduatedDrafts) {
      for (const record of existing) {
        if (record.status === "draft" && record.compiledFrom.sourceType === "cell") {
          await this.repository.saveManifest({ ...record, status: "retired" });
          supersededManifestIds.push(record.id);
        }
      }
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

    return { manifest, supersededManifestIds };
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
      await this.reconcileBuiltinManifestProvider(workspaceId, existing.activeManifestId);
      this.bootstrappedWorkspaces.add(workspaceId);
      return;
    }

    const compiled = compilePeerManifestDraft([
      {
        name: "peer.manifest.json",
        sourceType: "file",
        content: JSON.stringify(claimExtractorManifest(this.runtimeProviderName)),
      },
    ]);

    const peer: PeerNotebookRecord = {
      id: CLAIM_EXTRACTOR_PEER_RECORD_ID,
      workspaceId,
      peerId: CLAIM_EXTRACTOR_PEER_ID,
      displayName: "Claim extractor",
      description: "Deterministic peer that extracts sentence-level claims from a text artifact.",
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

  /**
   * Platform-owned builtin maintenance: workspaces bootstrapped before the
   * local-process slice persisted the claim-extractor manifest pinned to the
   * mock provider. Recompile the builtin manifest record in place so broker
   * dispatch resolves the currently registered runtime provider. Only the
   * platform manifest record is ever touched; operator-created manifests are
   * left alone.
   */
  private async reconcileBuiltinManifestProvider(workspaceId: string, activeManifestId: string): Promise<void> {
    if (activeManifestId !== CLAIM_EXTRACTOR_MANIFEST_ID) {
      return;
    }
    const manifest = await this.repository.getManifest(workspaceId, activeManifestId);
    if (!manifest || manifest.manifest.runtime.provider === this.runtimeProviderName) {
      return;
    }

    const compiled = compilePeerManifestDraft([
      {
        name: "peer.manifest.json",
        sourceType: "file",
        content: JSON.stringify(claimExtractorManifest(this.runtimeProviderName)),
      },
    ]);
    await this.repository.saveManifest({
      ...manifest,
      schemaVersion: compiled.manifest.schemaVersion,
      manifest: compiled.manifest,
      manifestHash: compiled.manifestHash,
    });
  }
}

function claimExtractorManifest(provider: RuntimeProviderName): PeerManifest {
  return {
    schemaVersion: "peer-notebook.v0",
    peerId: CLAIM_EXTRACTOR_PEER_ID,
    notebookId: CLAIM_EXTRACTOR_NOTEBOOK_ID,
    runtime: {
      provider,
      entry: "claim-extractor",
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

/**
 * Map notebook code cells to manifest draft sources. Cell source is carried
 * as opaque text for JSON parsing; non-code cells (title, markdown) and the
 * package.json cell never match the manifest cell filename.
 */
function manifestDraftSourcesFromNotebook(notebook: PeerGraduationNotebook): ManifestDraftSource[] {
  const sources: ManifestDraftSource[] = [];
  for (const cell of notebook.cells) {
    if (cell.type !== "code") continue;
    if (typeof cell.filename !== "string" || typeof cell.source !== "string") continue;
    sources.push({ name: cell.filename, content: cell.source, sourceType: "cell" });
  }
  return sources;
}

/**
 * Capture the executable code snapshot for a `notebook:` runtime entry.
 * Included: every code cell except the manifest cell, the package.json cell,
 * and the notebook tsconfig. Cell text is captured as data — nothing executes
 * at graduation. v1 boundary: notebook peers must be dependency-free (node
 * builtins only); the local-process provider materializes the snapshot into a
 * scratch directory without running an install step.
 */
function buildNotebookCodeSnapshot(
  notebook: PeerGraduationNotebook,
  entryCellFilename: string,
): PeerNotebookCodeSnapshot {
  const cells: PeerNotebookCodeSnapshot["cells"] = [];
  let packageJson: string | undefined;
  for (const cell of notebook.cells) {
    if (cell.type === "package.json" && typeof cell.source === "string") {
      packageJson = cell.source;
      continue;
    }
    if (cell.type !== "code") continue;
    if (typeof cell.filename !== "string" || typeof cell.source !== "string") continue;
    if (cell.filename === MANIFEST_CELL_FILENAME) continue;
    cells.push({ filename: cell.filename, source: cell.source });
  }

  if (!cells.some(cell => cell.filename === entryCellFilename)) {
    throw new PeerNotebookError(
      "manifest_compile_error",
      `Graduated manifest names runtime.entry "notebook:${entryCellFilename}" ` +
        `but notebook ${notebook.id} has no code cell named "${entryCellFilename}"`,
    );
  }

  if (packageJson !== undefined) {
    let dependencies: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(packageJson) as { dependencies?: Record<string, unknown> };
      dependencies = parsed.dependencies ?? {};
    } catch {
      throw new PeerNotebookError(
        "manifest_compile_error",
        `Notebook ${notebook.id} package.json cell is not valid JSON`,
      );
    }
    if (Object.keys(dependencies).length > 0) {
      throw new PeerNotebookError(
        "manifest_compile_error",
        `Notebook ${notebook.id} package.json declares dependencies ` +
          `(${Object.keys(dependencies).join(", ")}); notebook peers must be dependency-free in v1`,
      );
    }
  }

  const language: PeerNotebookCodeSnapshot["language"] =
    notebook.language === "typescript" || (notebook.language === undefined && entryCellFilename.endsWith(".ts"))
      ? "typescript"
      : "javascript";

  return {
    notebookId: notebook.id,
    entryFilename: entryCellFilename,
    language,
    cells,
    ...(packageJson !== undefined ? { packageJson } : {}),
    ...(notebook["tsconfig.json"] !== undefined ? { tsconfigJson: notebook["tsconfig.json"] } : {}),
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
