import { randomUUID } from "node:crypto";
import { BrokerProxy, type BrokerProxyTarget } from "./broker-proxy.js";
import { hashJson } from "./manifest.js";
import { validateJsonSchemaSubset } from "./json-schema.js";
import type { PeerNotebookRepository } from "./repositories.js";
import type { RuntimeProvider } from "./runtime-provider.js";
import type { JsonObject, JsonValue, PeerInvocationRecord, RuntimeProviderName } from "./types.js";
import { PeerNotebookError } from "./types.js";

export interface PeerInvokeInput {
  peerId: string;
  tool: string;
  args: JsonObject;
}

export interface PeerInvokeResult {
  invocationId: string;
  manifestHash: string;
  result: JsonValue;
}

export interface PeerBrokerOptions {
  workspaceId: string;
  repository: PeerNotebookRepository;
  runtimeProviders: Partial<Record<RuntimeProviderName, RuntimeProvider>>;
  proxyTargets?: Record<string, BrokerProxyTarget>;
}

export class PeerBroker {
  readonly peer = {
    invoke: (input: PeerInvokeInput) => this.invoke(input),
  };

  constructor(private readonly options: PeerBrokerOptions) {}

  async invoke(input: PeerInvokeInput): Promise<PeerInvokeResult> {
    const peer = await this.options.repository.getPeerByPeerId(this.options.workspaceId, input.peerId);
    if (!peer) {
      throw new PeerNotebookError("peer_not_found", `Peer ${input.peerId} does not exist`);
    }
    if (peer.status !== "active") {
      throw new PeerNotebookError("peer_not_active", `Peer ${input.peerId} is ${peer.status}`);
    }
    if (!peer.activeManifestId) {
      const manifests = await this.options.repository.listManifests(this.options.workspaceId, peer.id);
      const latest = manifests.at(-1);
      throw new PeerNotebookError(
        "manifest_not_active",
        latest
          ? `Peer ${input.peerId} has no active manifest; latest manifest ${latest.id} is ${latest.status}`
          : `Peer ${input.peerId} has no active manifest`,
      );
    }

    const manifest = await this.options.repository.getManifest(this.options.workspaceId, peer.activeManifestId);
    if (!manifest) {
      throw new PeerNotebookError(
        "manifest_not_active",
        `Peer ${input.peerId} active manifest ${peer.activeManifestId} does not exist`,
      );
    }
    if (manifest.status !== "active") {
      throw new PeerNotebookError(
        "manifest_not_active",
        `Peer ${input.peerId} manifest ${manifest.id} is ${manifest.status}, not active`,
      );
    }

    const tool = manifest.manifest.exposes.tools.find(candidate => candidate.name === input.tool);
    if (!tool) {
      throw new PeerNotebookError("tool_not_found", `Tool ${input.tool} is not exposed by ${input.peerId}`);
    }

    const argsValidation = validateJsonSchemaSubset(input.args, tool.inputSchema);
    if (!argsValidation.valid) {
      throw new PeerNotebookError("invalid_args", "Peer invocation args failed schema validation", {
        errors: argsValidation.errors,
      });
    }

    const provider = this.options.runtimeProviders[manifest.manifest.runtime.provider];
    if (!provider) {
      throw new PeerNotebookError(
        "runtime_provider_not_found",
        `Runtime provider ${manifest.manifest.runtime.provider} is not registered`,
      );
    }

    const invocation = this.createInvocation(
      peer.id,
      input.peerId,
      manifest.id,
      manifest.manifestHash,
      manifest.manifest.runtime.provider,
      input,
    );
    await this.options.repository.saveInvocation(invocation);
    await this.options.repository.appendTraceEvent({
      workspaceId: this.options.workspaceId,
      invocationId: invocation.id,
      eventType: "peer_invocation_created",
      severity: "info",
      attrs: {
        peerId: input.peerId,
        tool: input.tool,
        manifestHash: manifest.manifestHash,
      },
    });

    invocation.status = "running";
    invocation.startedAt = new Date().toISOString();
    await this.options.repository.updateInvocation(invocation);

    const scopedToken = `peer-token:${invocation.id}`;
    const proxy = new BrokerProxy({
      repository: this.options.repository,
      manifest,
      scopedToken,
      traceInvocationId: invocation.id,
      traceWorkspaceId: this.options.workspaceId,
      targets: this.options.proxyTargets,
    }).createClient(invocation.id, this.options.workspaceId, manifest.manifestHash);

    try {
      const runtimeResult = await withTimeout(
        provider.invoke({
          invocationId: invocation.id,
          workspaceId: this.options.workspaceId,
          peerId: input.peerId,
          manifestHash: manifest.manifestHash,
          tool: input.tool,
          args: input.args,
          entry: manifest.manifest.runtime.entry,
          notebook: manifest.compiledFrom.notebook,
          brokerProxyUrl: "memory://broker-proxy",
          scopedToken,
          budgets: manifest.manifest.budgets,
          brokerProxy: proxy,
        }),
        resolveTimeoutMs(manifest.manifest.runtime.timeoutMs, manifest.manifest.budgets.maxDurationMs),
      );

      const resultValidation = validateJsonSchemaSubset(runtimeResult.result, tool.outputSchema);
      if (!resultValidation.valid) {
        throw new PeerNotebookError("invalid_result", "Peer runtime result failed schema validation", {
          errors: resultValidation.errors,
        });
      }

      for (const artifact of runtimeResult.artifacts) {
        await this.options.repository.saveArtifactInput({
          id: artifact.artifactId,
          workspaceId: this.options.workspaceId,
          invocationId: invocation.id,
          peerRecordId: peer.id,
          peerId: peer.peerId,
          kind: artifact.kind,
          name: artifact.name,
          mimeType: artifact.mimeType,
          content: artifact.content,
          preview: artifact.preview,
        });
        await this.options.repository.appendTraceEvent({
          workspaceId: this.options.workspaceId,
          invocationId: invocation.id,
          eventType: "peer_artifact_written",
          severity: "info",
          attrs: {
            artifactId: artifact.artifactId,
            name: artifact.name,
          },
        });
      }

      invocation.status = "completed";
      invocation.result = runtimeResult.result;
      invocation.resultHash = hashJson(runtimeResult.result);
      invocation.completedAt = new Date().toISOString();
      await this.options.repository.updateInvocation(invocation);
      await this.options.repository.appendTraceEvent({
        workspaceId: this.options.workspaceId,
        invocationId: invocation.id,
        eventType: "peer_invocation_completed",
        severity: "info",
        attrs: {
          resultHash: invocation.resultHash,
        },
      });

      return {
        invocationId: invocation.id,
        manifestHash: manifest.manifestHash,
        result: runtimeResult.result,
      };
    } catch (error) {
      invocation.status = error instanceof PeerNotebookError && error.code === "outbound_denied"
        ? "denied"
        : error instanceof PeerNotebookError && error.code === "timeout"
          ? "timeout"
          : "failed";
      invocation.error = {
        message: error instanceof Error ? error.message : String(error),
      };
      invocation.completedAt = new Date().toISOString();
      await this.options.repository.updateInvocation(invocation);
      throw error;
    }
  }

  private createInvocation(
    peerRecordId: string,
    peerId: string,
    manifestId: string,
    manifestHash: string,
    runtimeProvider: RuntimeProviderName,
    input: PeerInvokeInput,
  ): PeerInvocationRecord {
    return {
      id: randomUUID(),
      workspaceId: this.options.workspaceId,
      peerRecordId,
      peerId,
      manifestId,
      manifestHash,
      toolName: input.tool,
      argsHash: hashJson(input.args),
      resultHash: null,
      status: "queued",
      runtimeProvider,
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };
  }
}

export function createPeerBroker(options: PeerBrokerOptions): PeerBroker {
  return new PeerBroker(options);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new PeerNotebookError("timeout", `Peer runtime exceeded maxDurationMs=${timeoutMs}`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

function resolveTimeoutMs(runtimeTimeoutMs: number | undefined, budgetTimeoutMs: number): number {
  return Math.min(runtimeTimeoutMs ?? budgetTimeoutMs, budgetTimeoutMs);
}
