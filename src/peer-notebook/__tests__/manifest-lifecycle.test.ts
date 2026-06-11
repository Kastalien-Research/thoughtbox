import { describe, expect, it } from "vitest";
import {
  InMemoryPeerNotebookRepository,
  MockPeerRuntimeProvider,
  PeerNotebookHandler,
  PeerNotebookTool,
} from "../index.js";
import { lifecyclePeerManifestJson } from "./fixtures.js";

const WORKSPACE_ID = "workspace_test";

describe("peer manifest lifecycle", () => {
  it("bootstraps the platform-owned claim-extractor with an active manifest out of the box", async () => {
    const { tool } = setupTool();

    const listed = await tool.handle({
      operation: "peer_manifest_list",
      peerId: "claim-extractor",
    });

    expect(listed.manifests).toHaveLength(1);
    expect(listed.manifests[0].status).toBe("active");

    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim. Second claim.",
    });
    const invoked = await tool.handle({
      operation: "peer_invoke",
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });

    expect(invoked.result).toMatchObject({ claimCount: 2 });
  });

  it("creates new manifests as draft and blocks invocation until approval", async () => {
    const { tool, provider } = setupTool();

    const created = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("lifecycle-peer"),
    });
    expect(created.manifest.status).toBe("draft");
    expect(created.manifest.approvedAt).toBeNull();
    expect(created.manifest.version).toBe(1);

    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim. Second claim.",
    });

    await expect(tool.handle({
      operation: "peer_invoke",
      peerId: "lifecycle-peer",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    })).rejects.toMatchObject({
      code: "manifest_not_active",
      message: expect.stringContaining("is draft"),
    });
    expect(provider.invocations).toHaveLength(0);

    const approved = await tool.handle({
      operation: "peer_manifest_approve",
      manifestId: created.manifest.id,
    });
    expect(approved.manifest.status).toBe("active");
    expect(approved.manifest.approvedAt).toEqual(expect.any(String));
    expect(approved.retiredManifestId).toBeNull();

    const invoked = await tool.handle({
      operation: "peer_invoke",
      peerId: "lifecycle-peer",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });
    expect(invoked.result).toMatchObject({ claimCount: 2 });
    expect(invoked.manifestHash).toBe(created.manifest.manifestHash);
  });

  it("keeps rejected manifests uninvocable and final", async () => {
    const { tool, provider } = setupTool();

    const created = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("rejected-peer"),
    });
    const rejected = await tool.handle({
      operation: "peer_manifest_reject",
      manifestId: created.manifest.id,
    });
    expect(rejected.manifest.status).toBe("rejected");

    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim.",
    });
    await expect(tool.handle({
      operation: "peer_invoke",
      peerId: "rejected-peer",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    })).rejects.toMatchObject({
      code: "manifest_not_active",
      message: expect.stringContaining("is rejected"),
    });
    expect(provider.invocations).toHaveLength(0);

    await expect(tool.handle({
      operation: "peer_manifest_approve",
      manifestId: created.manifest.id,
    })).rejects.toMatchObject({ code: "invalid_manifest_transition" });
  });

  it("retires the previously active manifest on re-approval", async () => {
    const { tool } = setupTool();

    const bootstrap = await tool.handle({
      operation: "peer_manifest_list",
      peerId: "claim-extractor",
    });
    const bootstrapManifest = bootstrap.manifests[0];

    const draft = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("claim-extractor", { timeoutMs: 60_000 }),
    });
    expect(draft.manifest.version).toBe(2);

    const approved = await tool.handle({
      operation: "peer_manifest_approve",
      manifestId: draft.manifest.id,
    });
    expect(approved.retiredManifestId).toBe(bootstrapManifest.id);

    const listed = await tool.handle({
      operation: "peer_manifest_list",
      peerId: "claim-extractor",
    });
    expect(listed.manifests.map(manifest => [manifest.version, manifest.status])).toEqual([
      [1, "retired"],
      [2, "active"],
    ]);

    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim. Second claim.",
    });
    const invoked = await tool.handle({
      operation: "peer_invoke",
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });
    expect(invoked.manifestHash).toBe(draft.manifest.manifestHash);
  });

  it("rejects lifecycle transitions on non-draft manifests and unknown ids", async () => {
    const { tool } = setupTool();

    const bootstrap = await tool.handle({
      operation: "peer_manifest_list",
      peerId: "claim-extractor",
    });
    const activeManifestId = bootstrap.manifests[0].id;

    await expect(tool.handle({
      operation: "peer_manifest_approve",
      manifestId: activeManifestId,
    })).rejects.toMatchObject({ code: "invalid_manifest_transition" });

    await expect(tool.handle({
      operation: "peer_manifest_reject",
      manifestId: activeManifestId,
    })).rejects.toMatchObject({ code: "invalid_manifest_transition" });

    await expect(tool.handle({
      operation: "peer_manifest_approve",
      manifestId: "missing-manifest",
    })).rejects.toMatchObject({ code: "manifest_not_found" });
  });

  it("rejects duplicate manifest hashes for the same peer", async () => {
    const { tool } = setupTool();

    await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("duplicate-peer"),
    });

    await expect(tool.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("duplicate-peer"),
    })).rejects.toMatchObject({ code: "manifest_duplicate" });
  });

  it("scopes lifecycle records to the handler workspace", async () => {
    const repository = new InMemoryPeerNotebookRepository();
    const toolA = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      workspaceId: WORKSPACE_ID,
    }));
    const toolB = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      workspaceId: "workspace_other",
    }));

    const created = await toolA.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("scoped-peer"),
    });

    await expect(toolB.handle({
      operation: "peer_manifest_approve",
      manifestId: created.manifest.id,
    })).rejects.toMatchObject({ code: "manifest_not_found" });
    await expect(toolB.handle({
      operation: "peer_manifest_list",
      peerId: "scoped-peer",
    })).rejects.toMatchObject({ code: "peer_not_found" });
  });
});

function setupTool() {
  const repository = new InMemoryPeerNotebookRepository();
  const provider = new MockPeerRuntimeProvider();
  const handler = new PeerNotebookHandler({
    repository,
    mockRuntimeProvider: provider,
    workspaceId: WORKSPACE_ID,
  });

  return {
    repository,
    provider,
    tool: new PeerNotebookTool(handler),
  };
}
