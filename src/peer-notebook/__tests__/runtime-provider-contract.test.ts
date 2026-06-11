import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  InMemoryPeerNotebookRepository,
  LocalProcessRuntimeProvider,
  PeerNotebookHandler,
  PeerNotebookTool,
  type RuntimeProvider,
} from "../index.js";
import { MockPeerRuntimeProvider } from "../mock-runtime-provider.js";

const WORKSPACE_ID = "workspace_contract";
const E2E_TIMEOUT_MS = 20_000;
const SLEEP_PEER_SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "sleep-peer.ts",
);

// SPEC-V1-INITIATIVE c14 evidence: the same contract suite runs against the
// test-only mock fixture and the real development-only local-process provider.
const providerCases = [
  { name: "mock", makeProvider: (): RuntimeProvider => new MockPeerRuntimeProvider() },
  { name: "local-process", makeProvider: (): RuntimeProvider => new LocalProcessRuntimeProvider() },
] as const;

function setupTool(provider: RuntimeProvider) {
  const repository = new InMemoryPeerNotebookRepository();
  const handler = new PeerNotebookHandler({
    repository,
    runtimeProvider: provider,
    workspaceId: WORKSPACE_ID,
  });

  return { repository, handler, tool: new PeerNotebookTool(handler) };
}

async function seedAndInvoke(tool: PeerNotebookTool, text: string) {
  const seeded = await tool.handle({
    operation: "peer_artifact_seed",
    text,
  });
  const invoked = await tool.handle({
    operation: "peer_invoke",
    peerId: "claim-extractor",
    tool: "extract_claims",
    args: { textArtifactId: seeded.artifact.id },
  });
  return { seeded, invoked };
}

describe.each(providerCases)("runtime provider contract: $name", ({ name, makeProvider }) => {
  it("extracts identical deterministic claims end-to-end through the peer tool ops", async () => {
    const { tool } = setupTool(makeProvider());

    const { invoked } = await seedAndInvoke(tool, "First claim. Second claim.");

    expect(invoked.result).toEqual({
      claimsArtifactId: expect.any(String),
      claimCount: 2,
    });
    const claimsArtifactId = (invoked.result as { claimsArtifactId: string }).claimsArtifactId;
    const artifact = await tool.handle({
      operation: "peer_get_artifact",
      artifactId: claimsArtifactId,
    });
    expect(artifact.artifact.name).toBe("claims.json");
    expect(artifact.artifact.mimeType).toBe("application/json");
    expect(artifact.artifact.content).toEqual({
      claims: [
        { id: "claim_1", text: "First claim" },
        { id: "claim_2", text: "Second claim" },
      ],
    });
  }, E2E_TIMEOUT_MS);

  it("records the queued -> running -> terminal lifecycle with provider attribution", async () => {
    const { tool } = setupTool(makeProvider());

    const { invoked } = await seedAndInvoke(tool, "First claim.");
    const read = await tool.handle({
      operation: "peer_get_invocation",
      invocationId: invoked.invocationId,
    });

    expect(read.invocation.status).toBe("completed");
    expect(read.invocation.runtimeProvider).toBe(name);
    expect(read.invocation.startedAt).toEqual(expect.any(String));
    expect(read.invocation.completedAt).toEqual(expect.any(String));
  }, E2E_TIMEOUT_MS);

  it("traces allowed outbound calls and still traces denied outbound calls", async () => {
    const { tool } = setupTool(makeProvider());

    const { invoked } = await seedAndInvoke(tool, "First claim.");
    const traced = await tool.handle({
      operation: "peer_list_trace_events",
      invocationId: invoked.invocationId,
    });

    expect(traced.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        eventType: "outbound_call_allowed",
        attrs: { target: "artifact.get" },
      }),
      expect.objectContaining({
        eventType: "denied_outbound_call",
        attrs: { target: "thoughtbox.knowledge.queryGraph" },
      }),
      expect.objectContaining({ eventType: "peer_invocation_created" }),
      expect.objectContaining({ eventType: "peer_artifact_written" }),
      expect.objectContaining({ eventType: "peer_invocation_completed" }),
    ]));
  }, E2E_TIMEOUT_MS);
});

describe("local-process runtime provider", () => {
  it("declares itself development-only with no isolation boundary", () => {
    expect(new LocalProcessRuntimeProvider().describe()).toEqual({
      provider: "local-process",
      isolation: "none",
      developmentOnly: true,
      supportsCancel: true,
      supportsSnapshots: false,
    });
  });

  it("kills a peer process that exceeds the manifest runtime budget without hanging", async () => {
    const provider = new LocalProcessRuntimeProvider({
      entries: { "sleep-peer": SLEEP_PEER_SCRIPT },
    });
    const { repository, tool } = setupTool(provider);

    const created = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: sleepPeerManifestJson(),
    });
    await tool.handle({
      operation: "peer_manifest_approve",
      manifestId: created.manifest.id,
    });

    await expect(tool.handle({
      operation: "peer_invoke",
      peerId: "sleep-peer",
      tool: "sleep_forever",
      args: {},
    })).rejects.toMatchObject({ code: "timeout" });

    const invocations = await repository.listInvocations(WORKSPACE_ID);
    expect(invocations.find(invocation => invocation.peerId === "sleep-peer")?.status).toBe("timeout");
  }, E2E_TIMEOUT_MS);

  it("kills the running peer process on cancel()", async () => {
    const provider = new LocalProcessRuntimeProvider({
      entries: { "sleep-peer": SLEEP_PEER_SCRIPT },
    });

    const pending = provider.invoke({
      invocationId: "cancel-target",
      workspaceId: WORKSPACE_ID,
      peerId: "sleep-peer",
      manifestHash: "sha256:test",
      tool: "sleep_forever",
      args: {},
      entry: "sleep-peer",
      brokerProxyUrl: "memory://broker-proxy",
      scopedToken: "peer-token:test",
      budgets: { maxDurationMs: 30_000, maxToolCalls: 1, maxArtifactBytes: 1_000 },
      brokerProxy: { callTool: async () => ({ ok: true, result: null }) },
    });

    await new Promise(resolve => setTimeout(resolve, 200));
    await provider.cancel({ invocationId: "cancel-target" });

    await expect(pending).rejects.toThrow(/cancelled/);
  }, E2E_TIMEOUT_MS);

  it("honors cancel() in the pre-spawn window without spawning a child", async () => {
    const provider = new LocalProcessRuntimeProvider({
      entries: { "sleep-peer": SLEEP_PEER_SCRIPT },
    });
    let releaseBroker!: () => void;
    const brokerGate = new Promise<void>(resolve => {
      releaseBroker = resolve;
    });
    let brokerCalls = 0;

    const pending = provider.invoke({
      invocationId: "pre-spawn-cancel",
      workspaceId: WORKSPACE_ID,
      peerId: "sleep-peer",
      manifestHash: "sha256:test",
      tool: "extract_claims",
      args: { textArtifactId: "artifact_pre_spawn" },
      entry: "sleep-peer",
      brokerProxyUrl: "memory://broker-proxy",
      scopedToken: "peer-token:test",
      budgets: { maxDurationMs: 30_000, maxToolCalls: 2, maxArtifactBytes: 1_000 },
      brokerProxy: {
        callTool: async () => {
          brokerCalls += 1;
          await brokerGate;
          return { ok: true, result: { artifact: { content: "First claim." } } };
        },
      },
    });

    // Cancel while invoke() is still inside the artifact.get round trip:
    // no child exists yet, so this exercises the pre-spawn preemption path.
    await provider.cancel({ invocationId: "pre-spawn-cancel" });
    releaseBroker();

    // The "before spawn" rejection only fires on the pre-spawn path; a
    // spawned sleep-peer child would instead hang until the 30s budget.
    await expect(pending).rejects.toThrow(/cancelled before spawn/);
    expect(brokerCalls).toBe(1);
  }, E2E_TIMEOUT_MS);

  it("fails fast when the manifest entry has no registered script", async () => {
    const { tool } = setupTool(new LocalProcessRuntimeProvider());

    const created = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: sleepPeerManifestJson("unregistered-entry"),
    });
    await tool.handle({
      operation: "peer_manifest_approve",
      manifestId: created.manifest.id,
    });

    await expect(tool.handle({
      operation: "peer_invoke",
      peerId: "sleep-peer",
      tool: "sleep_forever",
      args: {},
    })).rejects.toMatchObject({
      code: "tool_not_found",
      message: expect.stringContaining("unregistered-entry"),
    });
  }, E2E_TIMEOUT_MS);
});

function sleepPeerManifestJson(entry = "sleep-peer"): string {
  return JSON.stringify({
    schemaVersion: "peer-notebook.v0",
    peerId: "sleep-peer",
    notebookId: "nb_sleep_peer",
    runtime: {
      provider: "local-process",
      entry,
      timeoutMs: 3_000,
    },
    exposes: {
      tools: [
        {
          name: "sleep_forever",
          description: "Sleeps past every budget to exercise timeout enforcement",
          inputSchema: { type: "object", additionalProperties: false },
          outputSchema: { type: "object" },
        },
      ],
      resources: [],
      prompts: [],
    },
    mayCall: { mcpTools: [] },
    network: { enabled: false, allowHosts: [] },
    filesystem: { mounts: [] },
    secrets: { bindings: [] },
    persistence: { snapshot: "never" },
    budgets: {
      maxDurationMs: 3_000,
      maxToolCalls: 1,
      maxArtifactBytes: 1_000,
    },
  });
}
