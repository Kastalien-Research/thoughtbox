import type { JsonObject, JsonValue, PeerManifestRecord } from "./types.js";
import { PeerNotebookError } from "./types.js";
import type { PeerNotebookRepository } from "./repositories.js";

export interface BrokerProxyCall {
  invocationId: string;
  workspaceId: string;
  scopedToken: string;
  manifestHash: string;
  target: string;
  args: JsonObject;
}

export type BrokerProxyResult =
  | { ok: true; result: JsonValue }
  | { ok: false; denied: true; error: { code: "outbound_denied"; message: string } };

export type BrokerProxyTarget = (args: JsonObject) => Promise<JsonValue>;

export interface BrokerProxyOptions {
  repository: PeerNotebookRepository;
  manifest: PeerManifestRecord;
  scopedToken: string;
  traceInvocationId: string;
  traceWorkspaceId: string;
  targets?: Record<string, BrokerProxyTarget>;
}

interface TrustedTraceScope {
  workspaceId: string;
  invocationId: string;
}

export class BrokerProxy {
  constructor(private readonly options: BrokerProxyOptions) {}

  createClient(invocationId: string, workspaceId: string, manifestHash: string): BrokerProxyClient {
    const traceScope = {
      workspaceId,
      invocationId,
    };
    return {
      callTool: (target, args) =>
        this.call(
          {
            invocationId,
            workspaceId,
            scopedToken: this.options.scopedToken,
            manifestHash,
            target,
            args,
          },
          traceScope,
        ),
    };
  }

  async call(request: BrokerProxyCall, traceScope?: TrustedTraceScope): Promise<BrokerProxyResult> {
    if (
      request.scopedToken !== this.options.scopedToken ||
      request.workspaceId !== this.options.manifest.workspaceId ||
      request.manifestHash !== this.options.manifest.manifestHash
    ) {
      return this.deny(request, "Broker proxy credentials do not match invocation scope", traceScope);
    }

    if (!this.options.manifest.manifest.mayCall.mcpTools.includes(request.target)) {
      return this.deny(request, `Outbound call to ${request.target} is not allowed by active manifest`, traceScope);
    }

    const result = await this.forward(request);
    await this.options.repository.appendTraceEvent({
      workspaceId: request.workspaceId,
      invocationId: request.invocationId,
      eventType: "outbound_call_allowed",
      severity: "info",
      attrs: {
        target: request.target,
      },
    });
    return { ok: true, result };
  }

  private async forward(request: BrokerProxyCall): Promise<JsonValue> {
    if (request.target === "artifact.get") {
      const artifactId = request.args.artifactId;
      if (typeof artifactId !== "string") {
        throw new PeerNotebookError("artifact_not_found", "artifact.get requires string artifactId");
      }
      const artifact = await this.options.repository.getArtifact(request.workspaceId, artifactId);
      if (!artifact) {
        throw new PeerNotebookError("artifact_not_found", `Artifact ${artifactId} does not exist`);
      }
      return {
        artifact: {
          id: artifact.id,
          name: artifact.name,
          mimeType: artifact.mimeType,
          byteSize: artifact.byteSize,
          sha256: artifact.sha256,
          content: artifact.content,
        },
      };
    }

    const target = this.options.targets?.[request.target];
    if (!target) {
      throw new PeerNotebookError("tool_not_found", `No broker proxy target registered for ${request.target}`);
    }
    return target(request.args);
  }

  private async deny(
    request: BrokerProxyCall,
    message: string,
    traceScope?: TrustedTraceScope,
  ): Promise<BrokerProxyResult> {
    await this.options.repository.appendTraceEvent({
      workspaceId: traceScope?.workspaceId ?? this.options.traceWorkspaceId,
      invocationId: traceScope?.invocationId ?? this.options.traceInvocationId,
      eventType: "denied_outbound_call",
      severity: "warn",
      body: message,
      attrs: {
        target: request.target,
      },
    });
    return {
      ok: false,
      denied: true,
      error: {
        code: "outbound_denied",
        message,
      },
    };
  }
}

export interface BrokerProxyClient {
  callTool(target: string, args: JsonObject): Promise<BrokerProxyResult>;
}
