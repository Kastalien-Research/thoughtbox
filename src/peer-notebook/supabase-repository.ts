import { createHash, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canonicalizeJson } from "./manifest.js";
import type {
  ArtifactKind,
  JsonObject,
  JsonValue,
  PeerArtifactRecord,
  PeerInvocationRecord,
  PeerInvocationStatus,
  PeerManifest,
  PeerManifestRecord,
  PeerManifestStatus,
  PeerNotebookRecord,
  PeerNotebookStatus,
  PeerTraceEventRecord,
  RuntimeProviderName,
} from "./types.js";
import { PeerNotebookError } from "./types.js";
import type { PeerNotebookRepository, SaveArtifactInput } from "./repositories.js";

export interface SupabasePeerNotebookRepositoryConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  artifactBucket?: string;
}

type PeerNotebookRow = {
  id: string;
  workspace_id: string;
  slug: string;
  display_name: string;
  description: string | null;
  status: string;
  active_manifest_id: string | null;
  created_at: string;
  updated_at: string;
};

type PeerManifestRow = {
  id: string;
  workspace_id: string;
  peer_id: string;
  version: number;
  schema_version: string;
  manifest: JsonValue;
  manifest_hash: string;
  status: string;
  compiled_from: JsonValue;
  created_at: string;
};

type PeerInvocationRow = {
  id: string;
  workspace_id: string;
  peer_id: string;
  manifest_id: string;
  manifest_hash: string;
  tool_name: string;
  args_hash: string;
  result_hash: string | null;
  status: string;
  runtime_provider: string;
  result: JsonValue | null;
  error: JsonValue | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type PeerTraceEventRow = {
  id: string;
  workspace_id: string;
  invocation_id: string;
  seq: number;
  event_type: string;
  severity: string;
  timestamp_at: string;
  body: string | null;
  attrs: JsonValue;
};

type PeerArtifactRow = {
  id: string;
  workspace_id: string;
  invocation_id: string | null;
  peer_id: string | null;
  kind: string;
  name: string;
  mime_type: string;
  byte_size: number;
  sha256: string;
  storage_backend: string;
  storage_bucket: string;
  storage_path: string;
  preview: JsonValue | null;
  created_at: string;
};

const DEFAULT_ARTIFACT_BUCKET = "peer-artifacts";

export class SupabasePeerNotebookRepository implements PeerNotebookRepository {
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly artifactBucket: string;
  private client: SupabaseClient | null = null;

  constructor(config: SupabasePeerNotebookRepositoryConfig) {
    this.supabaseUrl = config.supabaseUrl;
    this.serviceRoleKey = config.serviceRoleKey;
    this.artifactBucket = config.artifactBucket ?? DEFAULT_ARTIFACT_BUCKET;
  }

  async savePeer(peer: PeerNotebookRecord): Promise<void> {
    const { error } = await this.ensureClient()
      .from("peer_notebooks")
      .upsert({
        id: peer.id,
        workspace_id: peer.workspaceId,
        slug: peer.peerId,
        display_name: peer.displayName,
        description: peer.description ?? null,
        source_notebook_ref: {
          kind: "static-pilot",
          peerId: peer.peerId,
        },
        status: peer.status,
        active_manifest_id: peer.activeManifestId,
        created_at: peer.createdAt,
        updated_at: peer.updatedAt,
      }, { onConflict: "id" });

    if (error) {
      throw new Error(`Failed to save peer notebook ${peer.peerId}: ${error.message}`);
    }
  }

  async getPeerByPeerId(workspaceId: string, peerId: string): Promise<PeerNotebookRecord | null> {
    const { data, error } = await this.ensureClient()
      .from("peer_notebooks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("slug", peerId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get peer notebook ${peerId}: ${error.message}`);
    }
    return data ? this.rowToPeer(data as PeerNotebookRow) : null;
  }

  async saveManifest(manifest: PeerManifestRecord): Promise<void> {
    const { error } = await this.ensureClient()
      .from("peer_manifests")
      .upsert({
        id: manifest.id,
        workspace_id: manifest.workspaceId,
        peer_id: manifest.peerRecordId,
        version: manifest.version,
        schema_version: manifest.schemaVersion,
        manifest: manifest.manifest,
        manifest_hash: manifest.manifestHash,
        status: manifest.status,
        compiled_from: manifest.compiledFrom,
        created_at: manifest.createdAt,
      }, { onConflict: "id" });

    if (error) {
      throw new Error(`Failed to save peer manifest ${manifest.id}: ${error.message}`);
    }
  }

  async getManifest(workspaceId: string, manifestId: string): Promise<PeerManifestRecord | null> {
    const { data, error } = await this.ensureClient()
      .from("peer_manifests")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", manifestId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get peer manifest ${manifestId}: ${error.message}`);
    }
    return data ? this.rowToManifest(data as PeerManifestRow) : null;
  }

  async saveInvocation(invocation: PeerInvocationRecord): Promise<void> {
    const { error } = await this.ensureClient()
      .from("peer_invocations")
      .insert(this.invocationToRow(invocation));

    if (error) {
      throw new Error(`Failed to save peer invocation ${invocation.id}: ${error.message}`);
    }
  }

  async updateInvocation(invocation: PeerInvocationRecord): Promise<void> {
    const { data, error } = await this.ensureClient()
      .from("peer_invocations")
      .update({
        result_hash: invocation.resultHash,
        status: invocation.status,
        started_at: invocation.startedAt,
        completed_at: invocation.completedAt,
        duration_ms: durationMs(invocation.startedAt, invocation.completedAt),
        runtime_provider: invocation.runtimeProvider,
        result: invocation.result,
        error: invocation.error,
      })
      .eq("workspace_id", invocation.workspaceId)
      .eq("id", invocation.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update peer invocation ${invocation.id}: ${error.message}`);
    }
    if (!data) {
      throw new PeerNotebookError("invocation_not_found", `Invocation ${invocation.id} does not exist`);
    }
  }

  async getInvocation(workspaceId: string, invocationId: string): Promise<PeerInvocationRecord | null> {
    const { data, error } = await this.ensureClient()
      .from("peer_invocations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", invocationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get peer invocation ${invocationId}: ${error.message}`);
    }
    return data ? this.rowToInvocation(data as PeerInvocationRow) : null;
  }

  async listInvocations(workspaceId: string): Promise<PeerInvocationRecord[]> {
    const { data, error } = await this.ensureClient()
      .from("peer_invocations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list peer invocations: ${error.message}`);
    }
    const rows = (data ?? []) as PeerInvocationRow[];
    const peerSlugs = await this.getPeerSlugsByRecordId(
      workspaceId,
      [...new Set(rows.map(row => row.peer_id))],
    );
    return rows.map(row => this.rowToInvocation(row, peerSlugs));
  }

  async appendTraceEvent(
    event: Omit<PeerTraceEventRecord, "id" | "seq" | "timestampAt">,
  ): Promise<PeerTraceEventRecord> {
    const { data, error } = await this.ensureClient().rpc("append_peer_trace_event", {
      p_workspace_id: event.workspaceId,
      p_invocation_id: event.invocationId,
      p_event_type: event.eventType,
      p_severity: event.severity,
      p_body: event.body ?? null,
      p_attrs: event.attrs,
    });

    if (error) {
      throw new Error(`Failed to append peer trace event: ${error.message}`);
    }
    return this.rowToTraceEvent(data as unknown as PeerTraceEventRow);
  }

  async listTraceEvents(workspaceId: string, invocationId: string): Promise<PeerTraceEventRecord[]> {
    const { data, error } = await this.ensureClient()
      .from("peer_trace_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("invocation_id", invocationId)
      .order("seq", { ascending: true });

    if (error) {
      throw new Error(`Failed to list peer trace events: ${error.message}`);
    }
    return (data ?? []).map(row => this.rowToTraceEvent(row as PeerTraceEventRow));
  }

  async saveArtifactInput(input: SaveArtifactInput): Promise<PeerArtifactRecord> {
    const client = this.ensureClient();
    const id = input.id ?? randomUUID();
    assertUuid(id, "artifact id");
    const payload = canonicalizeJson(input.content);
    const storagePath = artifactStoragePath({
      workspaceId: input.workspaceId,
      peerId: input.peerRecordId,
      invocationId: input.invocationId,
      artifactId: id,
      name: input.name,
    });

    const upload = await client.storage
      .from(this.artifactBucket)
      .upload(storagePath, payload, {
        contentType: "application/json",
        upsert: true,
      });

    if (upload.error) {
      throw new Error(`Failed to upload peer artifact payload ${id}: ${upload.error.message}`);
    }

    const row = {
      id,
      workspace_id: input.workspaceId,
      invocation_id: input.invocationId,
      peer_id: input.peerRecordId,
      kind: input.kind,
      name: input.name,
      mime_type: input.mimeType,
      byte_size: Buffer.byteLength(payload, "utf8"),
      sha256: createHash("sha256").update(payload, "utf8").digest("hex"),
      storage_backend: "supabase_storage",
      storage_bucket: this.artifactBucket,
      storage_path: storagePath,
      preview: input.preview ?? createPreview(input.content),
    };

    const { data, error } = await client
      .from("peer_artifacts")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      await client.storage.from(this.artifactBucket).remove([storagePath]);
      throw new Error(`Failed to save peer artifact metadata ${id}: ${error.message}`);
    }

    return this.rowToArtifact(data as PeerArtifactRow, { includeContent: true });
  }

  async getArtifact(workspaceId: string, artifactId: string): Promise<PeerArtifactRecord | null> {
    const { data, error } = await this.ensureClient()
      .from("peer_artifacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", artifactId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get peer artifact ${artifactId}: ${error.message}`);
    }
    return data ? this.rowToArtifact(data as PeerArtifactRow, { includeContent: true }) : null;
  }

  async listArtifacts(workspaceId: string, invocationId: string): Promise<PeerArtifactRecord[]> {
    const { data, error } = await this.ensureClient()
      .from("peer_artifacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("invocation_id", invocationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list peer artifacts: ${error.message}`);
    }
    return (data ?? []).map(row => this.rowToArtifact(row as PeerArtifactRow, { includeContent: false }));
  }

  private ensureClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(this.supabaseUrl, this.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.client;
  }

  private rowToPeer(row: PeerNotebookRow): PeerNotebookRecord {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      peerId: row.slug,
      displayName: row.display_name,
      description: row.description ?? undefined,
      status: row.status as PeerNotebookStatus,
      activeManifestId: row.active_manifest_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private rowToManifest(row: PeerManifestRow): PeerManifestRecord {
    const manifest = row.manifest as unknown as PeerManifest;
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      peerRecordId: row.peer_id,
      peerId: manifest.peerId,
      version: row.version,
      schemaVersion: row.schema_version,
      manifest,
      manifestHash: row.manifest_hash,
      status: row.status as PeerManifestStatus,
      compiledFrom: row.compiled_from as PeerManifestRecord["compiledFrom"],
      createdAt: row.created_at,
    };
  }

  private rowToInvocation(row: PeerInvocationRow, peerSlugs?: Map<string, string>): PeerInvocationRecord {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      peerRecordId: row.peer_id,
      peerId: peerSlugs?.get(row.peer_id) ?? row.peer_id,
      manifestId: row.manifest_id,
      manifestHash: row.manifest_hash,
      toolName: row.tool_name,
      argsHash: row.args_hash,
      resultHash: row.result_hash,
      status: row.status as PeerInvocationStatus,
      runtimeProvider: row.runtime_provider as RuntimeProviderName,
      result: row.result,
      error: row.error,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }

  private rowToTraceEvent(row: PeerTraceEventRow): PeerTraceEventRecord {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      invocationId: row.invocation_id,
      seq: row.seq,
      eventType: row.event_type,
      severity: row.severity as PeerTraceEventRecord["severity"],
      timestampAt: row.timestamp_at,
      body: row.body ?? undefined,
      attrs: (row.attrs ?? {}) as JsonObject,
    };
  }

  private async rowToArtifact(
    row: PeerArtifactRow,
    options: { includeContent: true },
  ): Promise<PeerArtifactRecord>;
  private rowToArtifact(
    row: PeerArtifactRow,
    options: { includeContent: false },
  ): PeerArtifactRecord;
  private rowToArtifact(
    row: PeerArtifactRow,
    options: { includeContent: boolean },
  ): PeerArtifactRecord | Promise<PeerArtifactRecord> {
    if (options.includeContent) {
      return this.rowToArtifactWithContent(row);
    }

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      invocationId: row.invocation_id,
      peerRecordId: row.peer_id,
      peerId: row.peer_id,
      kind: row.kind as ArtifactKind,
      name: row.name,
      mimeType: row.mime_type,
      byteSize: Number(row.byte_size),
      sha256: row.sha256,
      storageBackend: "supabase_storage",
      storageBucket: row.storage_bucket,
      storagePath: row.storage_path,
      preview: row.preview ?? undefined,
      content: row.preview ?? null,
      createdAt: row.created_at,
    };
  }

  private async rowToArtifactWithContent(row: PeerArtifactRow): Promise<PeerArtifactRecord> {
    const download = await this.ensureClient().storage
      .from(row.storage_bucket)
      .download(row.storage_path);

    if (download.error) {
      throw new Error(`Failed to download peer artifact payload ${row.id}: ${download.error.message}`);
    }

    const payloadText = await download.data.text();
    return {
      ...this.rowToArtifact(row, { includeContent: false }),
      peerId: row.peer_id ? (await this.getPeerByRecordId(row.workspace_id, row.peer_id))?.peerId ?? row.peer_id : null,
      content: JSON.parse(payloadText) as JsonValue,
    };
  }

  private invocationToRow(invocation: PeerInvocationRecord) {
    return {
      id: invocation.id,
      workspace_id: invocation.workspaceId,
      peer_id: invocation.peerRecordId,
      manifest_id: invocation.manifestId,
      manifest_hash: invocation.manifestHash,
      caller_type: "agent",
      tool_name: invocation.toolName,
      args_hash: invocation.argsHash,
      result_hash: invocation.resultHash,
      status: invocation.status,
      started_at: invocation.startedAt,
      completed_at: invocation.completedAt,
      duration_ms: durationMs(invocation.startedAt, invocation.completedAt),
      runtime_provider: invocation.runtimeProvider,
      error: invocation.error,
      result: invocation.result,
      created_at: invocation.createdAt,
    };
  }

  private async getPeerByRecordId(workspaceId: string, peerRecordId: string): Promise<PeerNotebookRecord | null> {
    const { data, error } = await this.ensureClient()
      .from("peer_notebooks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", peerRecordId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get peer notebook record ${peerRecordId}: ${error.message}`);
    }
    return data ? this.rowToPeer(data as PeerNotebookRow) : null;
  }

  private async getPeerSlugsByRecordId(workspaceId: string, peerRecordIds: string[]): Promise<Map<string, string>> {
    if (peerRecordIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.ensureClient()
      .from("peer_notebooks")
      .select("id, slug")
      .eq("workspace_id", workspaceId)
      .in("id", peerRecordIds);

    if (error) {
      throw new Error(`Failed to get peer notebook slugs: ${error.message}`);
    }

    return new Map(
      ((data ?? []) as Array<{ id: string; slug: string }>).map(row => [row.id, row.slug]),
    );
  }
}

function durationMs(startedAt: string | null, completedAt: string | null): number | null {
  if (!startedAt || !completedAt) {
    return null;
  }
  return Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
}

function artifactStoragePath(input: {
  workspaceId: string;
  peerId: string | null;
  invocationId: string | null;
  artifactId: string;
  name: string;
}): string {
  return [
    input.workspaceId,
    input.peerId ?? "unowned",
    input.invocationId ?? "seeded",
    input.artifactId,
    sanitizePathSegment(input.name),
  ].join("/");
}

function sanitizePathSegment(segment: string): string {
  return segment.replace(/[\\/#?]/g, "_");
}

function createPreview(content: JsonValue): JsonValue {
  if (typeof content === "string") {
    return content.length > 500 ? `${content.slice(0, 497)}...` : content;
  }
  return content;
}

function assertUuid(value: string, label: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Supabase peer notebook repository requires UUID ${label}; received ${value}`);
  }
}
