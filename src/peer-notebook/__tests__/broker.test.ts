import { describe, expect, it } from "vitest";
import {
  BrokerProxy,
  InMemoryPeerNotebookRepository,
  MockPeerRuntimeProvider,
  canonicalizeJson,
  compilePeerManifestDraft,
  createPeerBroker,
  type PeerManifestRecord,
  type PeerManifestStatus,
  type PeerNotebookRecord,
  type RuntimeProvider,
} from "../index.js";

const workspaceId = "workspace_test";

describe("claim-extractor peer pilot", () => {
  it("rejects invalid args before runtime dispatch", async () => {
    const { broker, provider } = await setupHarness();

    await expect(
      broker.peer.invoke({
        peerId: "claim-extractor",
        tool: "extract_claims",
        args: {},
      }),
    ).rejects.toMatchObject({ code: "invalid_args" });
    expect(provider.invocations).toHaveLength(0);
  });

  it("does not invoke draft or inactive manifests", async () => {
    const draftHarness = await setupHarness({ manifestStatus: "draft" });
    await expect(
      draftHarness.broker.peer.invoke({
        peerId: "claim-extractor",
        tool: "extract_claims",
        args: { textArtifactId: "input_text" },
      }),
    ).rejects.toMatchObject({
      code: "manifest_not_active",
      message: expect.stringContaining("is draft"),
    });
    expect(draftHarness.provider.invocations).toHaveLength(0);

    const inactiveHarness = await setupHarness({ peerStatus: "disabled" });
    await expect(
      inactiveHarness.broker.peer.invoke({
        peerId: "claim-extractor",
        tool: "extract_claims",
        args: { textArtifactId: "input_text" },
      }),
    ).rejects.toMatchObject({ code: "peer_not_active" });
    expect(inactiveHarness.provider.invocations).toHaveLength(0);
  });

  it("passes the active manifest hash to the runtime provider", async () => {
    const { broker, manifest, provider } = await setupHarness();

    const result = await broker.peer.invoke({
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: "input_text" },
    });

    expect(result.manifestHash).toBe(manifest.manifestHash);
    expect(provider.invocations[0].manifestHash).toBe(manifest.manifestHash);
  });

  it("allows artifact reads through the broker proxy", async () => {
    const { broker, repository } = await setupHarness();

    const result = await broker.peer.invoke({
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: "input_text" },
    });
    const events = await repository.listTraceEvents(workspaceId, result.invocationId);

    expect(events.some(event => event.eventType === "outbound_call_allowed")).toBe(true);
  });

  it("does not forward denied outbound calls and records a trace event", async () => {
    let forwardedDeniedTarget = false;
    const { broker, repository } = await setupHarness({
      proxyTargets: {
        "thoughtbox.knowledge.queryGraph": async () => {
          forwardedDeniedTarget = true;
          return {};
        },
      },
    });

    const result = await broker.peer.invoke({
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: "input_text" },
    });
    const events = await repository.listTraceEvents(workspaceId, result.invocationId);

    expect(forwardedDeniedTarget).toBe(false);
    expect(events.some(event => event.eventType === "denied_outbound_call")).toBe(true);
  });

  it("returns claims.json as an artifact reference", async () => {
    const { broker, repository } = await setupHarness();

    const result = await broker.peer.invoke({
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: "input_text" },
    });

    expect(result.result).toMatchObject({
      claimsArtifactId: expect.any(String),
      claimCount: 2,
    });

    const claimsArtifactId = (result.result as { claimsArtifactId: string }).claimsArtifactId;
    const artifacts = await repository.listArtifacts(workspaceId, result.invocationId);
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toMatchObject({
      id: claimsArtifactId,
      name: "claims.json",
      mimeType: "application/json",
    });
  });

  it("uses invocation_not_found for missing invocation updates", async () => {
    const repository = new InMemoryPeerNotebookRepository();

    await expect(
      repository.updateInvocation({
        id: "missing",
        workspaceId,
        peerRecordId: "peer",
        peerId: "claim-extractor",
        manifestId: "manifest",
        manifestHash: "sha256:missing",
        toolName: "extract_claims",
        argsHash: "sha256:args",
        resultHash: null,
        status: "running",
        runtimeProvider: "mock",
        result: null,
        error: null,
        createdAt: "2026-04-30T00:00:00.000Z",
        startedAt: null,
        completedAt: null,
      }),
    ).rejects.toMatchObject({ code: "invocation_not_found" });
  });

  it("records auth-mismatch denies on trusted trace scope", async () => {
    const { repository, manifest } = await setupHarness();
    const proxy = new BrokerProxy({
      repository,
      manifest,
      scopedToken: "trusted-token",
      traceWorkspaceId: workspaceId,
      traceInvocationId: "trusted_invocation",
    });

    await proxy.call({
      invocationId: "attacker_invocation",
      workspaceId: "attacker_workspace",
      scopedToken: "wrong-token",
      manifestHash: "sha256:wrong",
      target: "artifact.get",
      args: { artifactId: "input_text" },
    });

    const trustedEvents = await repository.listTraceEvents(workspaceId, "trusted_invocation");
    const attackerEvents = await repository.listTraceEvents("attacker_workspace", "attacker_invocation");
    expect(trustedEvents.some(event => event.eventType === "denied_outbound_call")).toBe(true);
    expect(attackerEvents).toHaveLength(0);
  });

  it("marks invocations timeout when runtime exceeds maxDurationMs", async () => {
    const provider: RuntimeProvider = {
      describe: () => ({
        provider: "mock",
        isolation: "mock",
        supportsCancel: false,
        supportsSnapshots: false,
      }),
      invoke: () => new Promise(() => {}),
      cancel: async () => {},
      "snapshot/export": async () => null,
      heartbeat: async () => {},
    };
    const { broker, repository } = await setupHarness({
      provider,
      budgets: { maxDurationMs: 1, maxToolCalls: 10, maxArtifactBytes: 10_000_000 },
    });

    await expect(
      broker.peer.invoke({
        peerId: "claim-extractor",
        tool: "extract_claims",
        args: { textArtifactId: "input_text" },
      }),
    ).rejects.toMatchObject({ code: "timeout" });

    const invocations = await repository.listInvocations(workspaceId);
    expect(invocations).toHaveLength(1);
    expect(invocations[0].status).toBe("timeout");
  });

  it("omits undefined object properties during canonicalization", () => {
    expect(canonicalizeJson({ b: 2, a: undefined })).toBe("{\"b\":2}");
    expect(canonicalizeJson([undefined, "x"])).toBe("[null,\"x\"]");
  });
});

async function setupHarness(options: {
  manifestStatus?: PeerManifestStatus;
  peerStatus?: PeerNotebookRecord["status"];
  provider?: RuntimeProvider;
  budgets?: ReturnType<typeof claimExtractorManifest>["budgets"];
  proxyTargets?: Parameters<typeof createPeerBroker>[0]["proxyTargets"];
} = {}) {
  const repository = new InMemoryPeerNotebookRepository();
  const provider = new MockPeerRuntimeProvider();
  const compiled = compilePeerManifestDraft([
    {
      name: "peer.manifest.json",
      content: JSON.stringify(claimExtractorManifest(options.budgets)),
    },
  ]);

  const now = "2026-04-30T00:00:00.000Z";
  const peer: PeerNotebookRecord = {
    id: "7b54fe91-31df-43dd-ae25-b95bc2cf6406",
    workspaceId,
    peerId: "claim-extractor",
    displayName: "Claim extractor",
    status: options.peerStatus ?? "active",
    activeManifestId: "b6d03683-6566-46c8-9424-b9b1344f5f32",
    createdAt: now,
    updatedAt: now,
  };
  const manifest: PeerManifestRecord = {
    id: "b6d03683-6566-46c8-9424-b9b1344f5f32",
    workspaceId,
    peerRecordId: peer.id,
    peerId: peer.peerId,
    version: 1,
    schemaVersion: compiled.manifest.schemaVersion,
    manifest: compiled.manifest,
    manifestHash: compiled.manifestHash,
    status: options.manifestStatus ?? "active",
    compiledFrom: compiled.compiledFrom,
    approvedAt: (options.manifestStatus ?? "active") === "active" ? now : null,
    createdAt: now,
  };

  await repository.savePeer(peer);
  await repository.saveManifest(manifest);
  await repository.saveArtifactInput({
    id: "input_text",
    workspaceId,
    invocationId: null,
    peerRecordId: null,
    peerId: null,
    kind: "json",
    name: "input.txt",
    mimeType: "text/plain",
    content: { text: "First claim. Second claim." },
  });

  return {
    broker: createPeerBroker({
      workspaceId,
      repository,
      runtimeProviders: { mock: options.provider ?? provider },
      proxyTargets: options.proxyTargets,
    }),
    repository,
    provider,
    manifest,
  };
}

function claimExtractorManifest(budgets = {
  maxDurationMs: 120_000,
  maxToolCalls: 10,
  maxArtifactBytes: 10_000_000,
}) {
  return {
    schemaVersion: "peer-notebook.v0",
    peerId: "claim-extractor",
    notebookId: "nb_claim_extractor",
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
    budgets,
  };
}
