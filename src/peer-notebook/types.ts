export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type PeerManifestStatus = "draft" | "approved" | "active" | "retired" | "rejected";
export type PeerNotebookStatus = "draft" | "active" | "disabled" | "archived";
export type PeerInvocationStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "denied"
  | "timeout"
  | "cancelled";

export type RuntimeProviderName = "mock" | "local-process" | "smolvm";
export type ArtifactKind = "notebook_export" | "json" | "log" | "dataset" | "report" | "binary";

export interface JsonSchemaSubset {
  type?: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, JsonSchemaSubset>;
  required?: string[];
  items?: JsonSchemaSubset;
  additionalProperties?: boolean;
}

export interface PeerToolManifest {
  name: string;
  description: string;
  inputSchema: JsonSchemaSubset;
  outputSchema: JsonSchemaSubset;
}

export interface PeerManifest {
  schemaVersion: "peer-notebook.v0";
  peerId: string;
  notebookId: string;
  runtime: {
    provider: RuntimeProviderName;
    image?: string;
    cpus?: number;
    memoryMiB?: number;
    timeoutMs?: number;
  };
  exposes: {
    tools: PeerToolManifest[];
    resources: JsonValue[];
    prompts: JsonValue[];
  };
  mayCall: {
    mcpTools: string[];
  };
  network: {
    enabled: boolean;
    allowHosts: string[];
  };
  filesystem: {
    mounts: Array<{
      name: string;
      mode: "ro" | "rw";
      target: string;
    }>;
  };
  secrets: {
    bindings: JsonValue[];
  };
  persistence: {
    snapshot?: "manual" | "never" | "onInvoke";
    exportNotebookOnInvoke?: boolean;
    retainArtifactsDays?: number;
  };
  budgets: {
    maxDurationMs: number;
    maxToolCalls: number;
    maxArtifactBytes: number;
  };
}

export interface ManifestDraftSource {
  name: string;
  content: string;
  sourceType?: "file" | "cell";
}

export interface CompiledPeerManifest {
  manifest: PeerManifest;
  canonicalJson: string;
  manifestHash: string;
  status: "draft";
  compiledFrom: {
    sourceName: string;
    sourceType: "file" | "cell";
  };
}

export interface PeerNotebookRecord {
  id: string;
  workspaceId: string;
  peerId: string;
  displayName: string;
  description?: string;
  status: PeerNotebookStatus;
  activeManifestId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PeerManifestRecord {
  id: string;
  workspaceId: string;
  peerRecordId: string;
  peerId: string;
  version: number;
  schemaVersion: string;
  manifest: PeerManifest;
  manifestHash: string;
  status: PeerManifestStatus;
  compiledFrom: CompiledPeerManifest["compiledFrom"];
  createdAt: string;
}

export interface PeerInvocationRecord {
  id: string;
  workspaceId: string;
  peerRecordId: string;
  peerId: string;
  manifestId: string;
  manifestHash: string;
  toolName: string;
  argsHash: string;
  resultHash: string | null;
  status: PeerInvocationStatus;
  runtimeProvider: RuntimeProviderName;
  result: JsonValue | null;
  error: JsonValue | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PeerTraceEventRecord {
  id: string;
  workspaceId: string;
  invocationId: string;
  seq: number;
  eventType: string;
  severity: "debug" | "info" | "warn" | "error";
  timestampAt: string;
  body?: string;
  attrs: JsonObject;
}

export interface PeerArtifactRecord {
  id: string;
  workspaceId: string;
  invocationId: string | null;
  peerRecordId: string | null;
  peerId: string | null;
  kind: ArtifactKind;
  name: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  storageBackend: "memory";
  storagePath: string;
  preview?: JsonValue;
  content: JsonValue;
  createdAt: string;
}

export class PeerNotebookError extends Error {
  constructor(
    public readonly code:
      | "manifest_compile_error"
      | "invocation_not_found"
      | "peer_not_found"
      | "peer_not_active"
      | "manifest_not_active"
      | "tool_not_found"
      | "invalid_args"
      | "invalid_result"
      | "runtime_provider_not_found"
      | "artifact_not_found"
      | "outbound_denied"
      | "timeout",
    message: string,
    public readonly details?: JsonValue,
  ) {
    super(message);
    this.name = "PeerNotebookError";
  }
}
