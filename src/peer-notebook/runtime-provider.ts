import type { BrokerProxyClient } from "./broker-proxy.js";
import type {
  ArtifactKind,
  JsonObject,
  JsonValue,
  RuntimeProviderName,
} from "./types.js";

export interface RuntimeProviderDescription {
  provider: RuntimeProviderName;
  isolation: "mock" | "none" | "external";
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
}
