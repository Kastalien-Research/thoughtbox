import type { BrokerProxyClient } from "./broker-proxy.js";
import type {
  ArtifactKind,
  JsonObject,
  JsonValue,
  PeerNotebookCodeSnapshot,
  RuntimeProviderName,
} from "./types.js";

export interface RuntimeProviderDescription {
  provider: RuntimeProviderName;
  isolation: "mock" | "none" | "external";
  /** Honest declaration: true for providers that must never serve production isolation claims. */
  developmentOnly: boolean;
  supportsCancel: boolean;
  supportsSnapshots: boolean;
}

export interface RuntimeInvocationInput {
  invocationId: string;
  workspaceId: string;
  peerId: string;
  manifestHash: string;
  tool: string;
  args: JsonObject;
  /** Executable entry name from manifest runtime.entry (required by local-process). */
  entry?: string;
  /**
   * Graduated-notebook code snapshot from the manifest record
   * (compiledFrom.notebook); present when entry is `notebook:<filename>`.
   */
  notebook?: PeerNotebookCodeSnapshot;
  brokerProxyUrl: string;
  scopedToken: string;
  budgets: {
    maxDurationMs: number;
    maxToolCalls: number;
    maxArtifactBytes: number;
  };
  brokerProxy: BrokerProxyClient;
}

export interface RuntimeArtifactOutput {
  artifactId: string;
  kind: ArtifactKind;
  name: string;
  mimeType: string;
  content: JsonValue;
  preview?: JsonValue;
}

export interface RuntimeInvocationResult {
  result: JsonValue;
  artifacts: RuntimeArtifactOutput[];
}

export interface RuntimeProvider {
  describe(): RuntimeProviderDescription;
  invoke(input: RuntimeInvocationInput): Promise<RuntimeInvocationResult>;
  cancel(input: { invocationId: string }): Promise<void>;
  "snapshot/export"(input: { invocationId: string }): Promise<JsonValue>;
  heartbeat(input: { peerRuntimeId: string; invocationId: string }): Promise<void>;
  /**
   * Providers that resolve manifest runtime.entry names from a fixed script
   * registry report whether an entry resolves, so graduation can reject
   * unregistered entries up front instead of failing at first invoke.
   */
  resolvesEntry?(entry: string): boolean;
}
