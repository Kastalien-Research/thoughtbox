import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  InMemoryPeerNotebookRepository,
  KNOWLEDGE_QUERY_GRAPH_TARGET,
  PeerNotebookHandler,
  SESSION_GET_TARGET,
  compilePeerManifestDraft,
  createBrokerProxyTargets,
  createPeerBroker,
  type BrokerProxyResult,
  type BrokerProxyTarget,
  type JsonObject,
  type KnowledgeProxyHandler,
  type PeerManifestRecord,
  type PeerNotebookRecord,
  type RuntimeInvocationInput,
  type RuntimeInvocationResult,
  type RuntimeProvider,
} from "../index.js";
import { MockPeerRuntimeProvider } from "../mock-runtime-provider.js";
import { KnowledgeHandler } from "../../knowledge/handler.js";
import { FileSystemKnowledgeStorage } from "../../knowledge/storage.js";
import { InMemoryStorage } from "../../persistence/index.js";
import { SessionHandler } from "../../sessions/index.js";
import { ThoughtHandler } from "../../thought-handler.js";

const workspaceId = "workspace_proxy_targets";
const tmpKnowledgeDir = fs.mkdtempSync(path.join(os.tmpdir(), "tb-proxy-targets-"));

afterAll(() => {
  fs.rmSync(tmpKnowledgeDir, { recursive: true, force: true });
});

class OutboundProbeProvider implements RuntimeProvider {
  lastResult: BrokerProxyResult | null = null;

  constructor(
    private readonly target: string,
    private readonly targetArgs: JsonObject,
  ) {}

  describe() {
    return {
      provider: "mock" as const,
      isolation: "mock" as const,
      supportsCancel: false,
      supportsSnapshots: false,
    };
  }

  async invoke(input: RuntimeInvocationInput): Promise<RuntimeInvocationResult> {
    this.lastResult = await input.brokerProxy.callTool(this.target, this.targetArgs);
    return { result: { allowed: this.lastResult.ok }, artifacts: [] };
  }

  async cancel(): Promise<void> {}

  async "snapshot/export"(): Promise<null> {
    return null;
  }

  async heartbeat(): Promise<void> {}
}

describe("broker proxy targets", () => {
  it("forwards allowed queryGraph calls to the real knowledge handler", async () => {
    const knowledgeStorage = new FileSystemKnowledgeStorage({ basePath: tmpKnowledgeDir });
    await knowledgeStorage.setProject("proxy-target-test");
    const knowledgeHandler = new KnowledgeHandler(knowledgeStorage);

    const created = await knowledgeHandler.processOperation({
      operation: "create_entity",
      name: "proxy-target-entity",
      type: "Concept",
      label: "Proxy target entity",
    });
    const entityId = (JSON.parse(created.content[0].text) as { entity_id: string }).entity_id;
    expect(entityId).toBeTruthy();

    const provider = new OutboundProbeProvider(KNOWLEDGE_QUERY_GRAPH_TARGET, {
      start_entity_id: entityId,
    });
    const { broker, repository } = await setupProbeHarness({
      mayCall: [KNOWLEDGE_QUERY_GRAPH_TARGET],
      provider,
      proxyTargets: createBrokerProxyTargets({ knowledgeHandler }),
    });

    const invocation = await broker.peer.invoke({ peerId: "outbound-probe", tool: "probe", args: {} });

    expect(invocation.result).toEqual({ allowed: true });
    expect(provider.lastResult).toMatchObject({ ok: true });
    const graph = (provider.lastResult as { ok: true; result: unknown }).result as {
      entity_count: number;
      entities: Array<{ id: string; name: string }>;
    };
    expect(graph.entity_count).toBe(1);
    expect(graph.entities).toEqual([
      expect.objectContaining({ id: entityId, name: "proxy-target-entity" }),
    ]);

    const events = await repository.listTraceEvents(workspaceId, invocation.invocationId);
    expect(events).toContainEqual(
      expect.objectContaining({
        eventType: "outbound_call_allowed",
        attrs: expect.objectContaining({ target: KNOWLEDGE_QUERY_GRAPH_TARGET }),
      }),
    );
  });

  it("forwards allowed session.get calls to the real session handler", async () => {
    const { sessionHandler, session } = await setupSessionHandler();

    const provider = new OutboundProbeProvider(SESSION_GET_TARGET, { sessionId: session.id });
    const { broker, repository } = await setupProbeHarness({
      mayCall: [SESSION_GET_TARGET],
      provider,
      proxyTargets: createBrokerProxyTargets({ sessionHandler }),
    });

    const invocation = await broker.peer.invoke({ peerId: "outbound-probe", tool: "probe", args: {} });

    expect(invocation.result).toEqual({ allowed: true });
    const sessionResult = (provider.lastResult as { ok: true; result: unknown }).result as {
      session: { id: string; title: string };
    };
    expect(sessionResult.session).toMatchObject({ id: session.id, title: "Proxy target session" });

    const events = await repository.listTraceEvents(workspaceId, invocation.invocationId);
    expect(events).toContainEqual(
      expect.objectContaining({
        eventType: "outbound_call_allowed",
        attrs: expect.objectContaining({ target: SESSION_GET_TARGET }),
      }),
    );
  });

  it("denies unlisted targets before they reach a registered handler", async () => {
    const forwarded: JsonObject[] = [];
    const recordingKnowledgeHandler: KnowledgeProxyHandler = {
      processOperation: async args => {
        forwarded.push(args);
        return { content: [{ type: "text", text: "{}" }] };
      },
    };

    const provider = new OutboundProbeProvider(KNOWLEDGE_QUERY_GRAPH_TARGET, {
      start_entity_id: "irrelevant",
    });
    const { broker, repository } = await setupProbeHarness({
      mayCall: ["artifact.get"],
      provider,
      proxyTargets: createBrokerProxyTargets({ knowledgeHandler: recordingKnowledgeHandler }),
    });

    const invocation = await broker.peer.invoke({ peerId: "outbound-probe", tool: "probe", args: {} });

    expect(invocation.result).toEqual({ allowed: false });
    expect(provider.lastResult).toMatchObject({
      ok: false,
      denied: true,
      error: { code: "outbound_denied" },
    });
    expect(forwarded).toHaveLength(0);

    const events = await repository.listTraceEvents(workspaceId, invocation.invocationId);
    expect(events).toContainEqual(
      expect.objectContaining({
        eventType: "denied_outbound_call",
        attrs: expect.objectContaining({ target: KNOWLEDGE_QUERY_GRAPH_TARGET }),
      }),
    );
  });

  it("fails the invocation with target_unavailable when the knowledge handler is absent", async () => {
    const provider = new OutboundProbeProvider(KNOWLEDGE_QUERY_GRAPH_TARGET, {
      start_entity_id: "irrelevant",
    });
    const { broker, repository } = await setupProbeHarness({
      mayCall: [KNOWLEDGE_QUERY_GRAPH_TARGET],
      provider,
      proxyTargets: createBrokerProxyTargets({
        knowledgeUnavailableReason: "knowledge storage failed in test",
      }),
    });

    await expect(
      broker.peer.invoke({ peerId: "outbound-probe", tool: "probe", args: {} }),
    ).rejects.toMatchObject({
      code: "target_unavailable",
      message: expect.stringContaining("knowledge storage failed in test"),
    });

    const invocations = await repository.listInvocations(workspaceId);
    expect(invocations).toHaveLength(1);
    expect(invocations[0].status).toBe("failed");
    expect(invocations[0].error?.message).toContain("unavailable");
  });

  it("throws target_unavailable when the session handler is absent", async () => {
    const targets = createBrokerProxyTargets({});

    await expect(targets[SESSION_GET_TARGET]({ sessionId: "any" })).rejects.toMatchObject({
      code: "target_unavailable",
      message: expect.stringContaining("session handler is not configured"),
    });
  });

  it("surfaces handler errors as target_failed", async () => {
    const { sessionHandler } = await setupSessionHandler();
    const targets = createBrokerProxyTargets({ sessionHandler });

    await expect(targets[SESSION_GET_TARGET]({ sessionId: "missing-session" })).rejects.toMatchObject({
      code: "target_failed",
      message: expect.stringContaining("missing-session not found"),
    });
  });
});

describe("PeerNotebookHandler proxy target wiring", () => {
  it("threads proxyTargetDeps into the broker so manifest-approved peers reach real handlers", async () => {
    const { sessionHandler, session } = await setupSessionHandler();

    class SessionProbeMockProvider extends MockPeerRuntimeProvider {
      lastResult: BrokerProxyResult | null = null;

      override async invoke(input: RuntimeInvocationInput): Promise<RuntimeInvocationResult> {
        if (input.tool !== "get_session") {
          return super.invoke(input);
        }
        this.lastResult = await input.brokerProxy.callTool(SESSION_GET_TARGET, input.args);
        return { result: { found: this.lastResult.ok }, artifacts: [] };
      }
    }

    const provider = new SessionProbeMockProvider();
    const handler = new PeerNotebookHandler({
      workspaceId: "workspace_handler_targets",
      repository: new InMemoryPeerNotebookRepository(),
      runtimeProvider: provider,
      proxyTargetDeps: { sessionHandler },
    });

    const { manifest } = await handler.createManifestDraft({
      manifestJson: JSON.stringify(sessionProbeManifest()),
    });
    await handler.approveManifest(manifest.id);

    const result = await handler.invoke({
      peerId: "session-probe",
      tool: "get_session",
      args: { sessionId: session.id },
    });

    expect(result.result).toEqual({ found: true });
    const sessionResult = (provider.lastResult as { ok: true; result: unknown }).result as {
      session: { id: string };
    };
    expect(sessionResult.session.id).toBe(session.id);
  });
});

async function setupSessionHandler() {
  const storage = new InMemoryStorage();
  await storage.initialize();
  const session = await storage.createSession({ title: "Proxy target session" });
  const thoughtHandler = new ThoughtHandler(true, storage);
  const sessionHandler = new SessionHandler({ storage, thoughtHandler });
  await sessionHandler.init();
  return { sessionHandler, session };
}

async function setupProbeHarness(options: {
  mayCall: string[];
  provider: RuntimeProvider;
  proxyTargets: Record<string, BrokerProxyTarget>;
}) {
  const repository = new InMemoryPeerNotebookRepository();
  const compiled = compilePeerManifestDraft([
    {
      name: "peer.manifest.json",
      content: JSON.stringify(probeManifest(options.mayCall)),
    },
  ]);

  const now = "2026-06-11T00:00:00.000Z";
  const peer: PeerNotebookRecord = {
    id: "0a4f51f4-39a4-4cf9-9e16-2b9f6f1f2a01",
    workspaceId,
    peerId: "outbound-probe",
    displayName: "Outbound probe",
    status: "active",
    activeManifestId: "8a0a3a52-66cf-49ef-bf6c-04d8a4f5c302",
    createdAt: now,
    updatedAt: now,
  };
  const manifest: PeerManifestRecord = {
    id: "8a0a3a52-66cf-49ef-bf6c-04d8a4f5c302",
    workspaceId,
    peerRecordId: peer.id,
    peerId: peer.peerId,
    version: 1,
    schemaVersion: compiled.manifest.schemaVersion,
    manifest: compiled.manifest,
    manifestHash: compiled.manifestHash,
    status: "active",
    compiledFrom: compiled.compiledFrom,
    approvedAt: now,
    createdAt: now,
  };

  await repository.savePeer(peer);
  await repository.saveManifest(manifest);

  return {
    broker: createPeerBroker({
      workspaceId,
      repository,
      runtimeProviders: { mock: options.provider },
      proxyTargets: options.proxyTargets,
    }),
    repository,
  };
}

function probeManifest(mayCallTools: string[]) {
  return {
    schemaVersion: "peer-notebook.v0",
    peerId: "outbound-probe",
    notebookId: "nb_outbound_probe",
    runtime: {
      provider: "mock",
      timeoutMs: 120_000,
    },
    exposes: {
      tools: [
        {
          name: "probe",
          description: "Issue a single outbound broker proxy call",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          outputSchema: {
            type: "object",
            properties: {
              allowed: { type: "boolean" },
            },
            required: ["allowed"],
            additionalProperties: false,
          },
        },
      ],
      resources: [],
      prompts: [],
    },
    mayCall: {
      mcpTools: mayCallTools,
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

function sessionProbeManifest() {
  return {
    schemaVersion: "peer-notebook.v0",
    peerId: "session-probe",
    notebookId: "nb_session_probe",
    runtime: {
      provider: "mock",
      timeoutMs: 120_000,
    },
    exposes: {
      tools: [
        {
          name: "get_session",
          description: "Read a reasoning session through the broker proxy",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string" },
            },
            required: ["sessionId"],
            additionalProperties: false,
          },
          outputSchema: {
            type: "object",
            properties: {
              found: { type: "boolean" },
            },
            required: ["found"],
            additionalProperties: false,
          },
        },
      ],
      resources: [],
      prompts: [],
    },
    mayCall: {
      mcpTools: [SESSION_GET_TARGET],
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
