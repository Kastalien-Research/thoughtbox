import { describe, expect, it } from "vitest";
import {
  InMemoryPeerNotebookRepository,
  MockPeerRuntimeProvider,
  PeerNotebookHandler,
  PeerNotebookTool,
} from "../index.js";

describe("thoughtbox_peer_notebook", () => {
  it("seeds an input text artifact in the current workspace", async () => {
    const { tool } = setupTool();

    const result = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim. Second claim.",
      name: "input.txt",
    });

    expect(result.artifact.workspaceId).toBe("workspace_test");
    expect(result.artifact.kind).toBe("text");
    expect(result.artifact.name).toBe("input.txt");
    expect(result.artifact.mimeType).toBe("text/plain");
    expect(result.artifact.content).toBe("First claim. Second claim.");
  });

  it("invokes claim-extractor.extract_claims and returns a claims.json artifact reference", async () => {
    const { tool } = setupTool();
    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim. Second claim.",
    });

    const result = await tool.handle({
      operation: "peer_invoke",
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });

    expect(result.result).toEqual({
      claimsArtifactId: `${result.invocationId}-claims`,
      claimCount: 2,
    });
    expect(result.artifactRefs).toEqual([
      expect.objectContaining({
        artifactId: `${result.invocationId}-claims`,
        name: "claims.json",
        kind: "json",
        mimeType: "application/json",
      }),
    ]);
  });

  it("rejects invalid args before runtime dispatch", async () => {
    const { tool, provider } = setupTool();

    await expect(tool.handle({
      operation: "peer_invoke",
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: {},
    })).rejects.toMatchObject({ code: "invalid_args" });

    expect(provider.invocations).toHaveLength(0);
  });

  it("lists denied outbound calls from invocation trace events", async () => {
    const { tool } = setupTool();
    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim.",
    });
    const invoked = await tool.handle({
      operation: "peer_invoke",
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });

    const traced = await tool.handle({
      operation: "peer_list_trace_events",
      invocationId: invoked.invocationId,
    });

    expect(traced.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "denied_outbound_call",
          attrs: { target: "thoughtbox.knowledge.queryGraph" },
        }),
      ]),
    );
  });

  it("uses only the mock runtime provider", async () => {
    const { tool, handler } = setupTool();
    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim.",
    });
    const invoked = await tool.handle({
      operation: "peer_invoke",
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });

    const invocation = await tool.handle({
      operation: "peer_get_invocation",
      invocationId: invoked.invocationId,
    });

    expect(handler.getRuntimeProviderNames()).toEqual(["mock"]);
    expect(invocation.invocation.runtimeProvider).toBe("mock");
  });

  it("reads seeded and produced artifacts from memory", async () => {
    const { tool } = setupTool();
    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim.",
    });
    const inputArtifact = await tool.handle({
      operation: "peer_get_artifact",
      artifactId: seeded.artifact.id,
    });

    expect(inputArtifact.artifact.storageBackend).toBe("memory");
    expect(inputArtifact.artifact.content).toBe("First claim.");
  });
});

function setupTool() {
  const repository = new InMemoryPeerNotebookRepository();
  const provider = new MockPeerRuntimeProvider();
  const handler = new PeerNotebookHandler({
    repository,
    mockRuntimeProvider: provider,
    workspaceId: "workspace_test",
  });

  return {
    handler,
    provider,
    tool: new PeerNotebookTool(handler),
  };
}
