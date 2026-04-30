import { describe, expect, it } from "vitest";
import {
  InMemoryPeerNotebookRepository,
  MockPeerRuntimeProvider,
  PeerNotebookError,
  compilePeerManifestDraft,
  createPeerBroker,
  type PeerManifestRecord,
  type PeerManifestStatus,
  type PeerNotebookRecord,
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
    ).rejects.toMatchObject({ code: "manifest_not_active" });
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
      claimsArtifactId: `${result.invocationId}-claims`,
      claimCount: 2,
    });

    const artifacts = await repository.listArtifacts(workspaceId, result.invocationId);
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toMatchObject({
      id: `${result.invocationId}-claims`,
      name: "claims.json",
      mimeType: "application/json",
    });
  });
});

async function setupHarness(options: {
  manifestStatus?: PeerManifestStatus;
  peerStatus?: PeerNotebookRecord["status"];
  proxyTargets?: Parameters<typeof createPeerBroker>[0]["proxyTargets"];
} = {}) {
  const repository = new InMemoryPeerNotebookRepository();
  const provider = new MockPeerRuntimeProvider();
  const compiled = compilePeerManifestDraft([
    {
      name: "peer.manifest.json",
      content: JSON.stringify(claimExtractorManifest()),
    },
  ]);

  const now = "2026-04-30T00:00:00.000Z";
  const peer: PeerNotebookRecord = {
    id: "peer_record_claim_extractor",
    workspaceId,
    peerId: "claim-extractor",
    displayName: "Claim extractor",
    status: options.peerStatus ?? "active",
    activeManifestId: "manifest_active",
    createdAt: now,
    updatedAt: now,
  };
  const manifest: PeerManifestRecord = {
    id: "manifest_active",
    workspaceId,
    peerRecordId: peer.id,
    peerId: peer.peerId,
    version: 1,
    schemaVersion: compiled.manifest.schemaVersion,
    manifest: compiled.manifest,
    manifestHash: compiled.manifestHash,
    status: options.manifestStatus ?? "active",
    compiledFrom: compiled.compiledFrom,
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
      runtimeProviders: { mock: provider },
      proxyTargets: options.proxyTargets,
    }),
    repository,
    provider,
    manifest,
  };
}

function claimExtractorManifest() {
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
    budgets: {
      maxDurationMs: 120_000,
      maxToolCalls: 10,
      maxArtifactBytes: 10_000_000,
    },
  };
}
