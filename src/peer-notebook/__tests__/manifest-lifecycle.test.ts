import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import type { Notebook } from "../../notebook/types.js";
import {
  compilePeerManifestDraft,
  createPeerBroker,
  extractManifestDraftSourcesFromNotebook,
  InMemoryPeerNotebookRepository,
  MockPeerRuntimeProvider,
  PeerManifestLifecycleService,
  type PeerManifest,
} from "../index.js";

const workspaceId = "workspace_manifest_lifecycle";
const approvedAt = "2026-04-30T12:00:00.000Z";

describe("peer manifest lifecycle", () => {
  it("compiles a filename-cell manifest from notebook data without executing code", async () => {
    const repository = new InMemoryPeerNotebookRepository();
    const service = lifecycleService(repository);
    const notebook = notebookWithManifest(baseManifest(), {
      extraCells: [{
        id: "danger",
        type: "code",
        language: "typescript",
        filename: "danger.ts",
        source: "throw new Error('manifest compilation executed notebook code')",
        status: "idle",
      }],
    });

    const result = await service.compileDraftFromNotebook({
      workspaceId,
      notebook,
      createdBy: "test:compiler",
    });

    expect(notebook.cells.find(cell => cell.id === "danger")).toMatchObject({ status: "idle" });
    expect(extractManifestDraftSourcesFromNotebook(notebook)).toEqual([
      expect.objectContaining({
        name: "peer.manifest.json",
        sourceType: "cell",
      }),
    ]);
    expect(result.peer).toMatchObject({
      peerId: "notebook-claim-extractor",
      status: "draft",
      activeManifestId: null,
      sourceNotebookRef: {
        kind: "notebook",
        adapter: "filename-cell-v0",
        notebookId: notebook.id,
        sourceName: "peer.manifest.json",
      },
    });
    expect(result.manifest).toMatchObject({
      status: "draft",
      createdBy: "test:compiler",
      approvedBy: null,
      approvedAt: null,
    });
  });

  it("produces stable hashes for equivalent manifest JSON", () => {
    const manifest = baseManifest();
    const equivalentManifest: PeerManifest = {
      budgets: manifest.budgets,
      persistence: manifest.persistence,
      secrets: manifest.secrets,
      filesystem: manifest.filesystem,
      network: manifest.network,
      mayCall: manifest.mayCall,
      exposes: manifest.exposes,
      runtime: manifest.runtime,
      notebookId: manifest.notebookId,
      peerId: manifest.peerId,
      schemaVersion: manifest.schemaVersion,
    };

    const first = compilePeerManifestDraft([
      { name: "peer.manifest.json", content: JSON.stringify(manifest) },
    ]);
    const second = compilePeerManifestDraft([
      { name: "peer.manifest.json", content: JSON.stringify(equivalentManifest) },
    ]);

    expect(first.manifestHash).toBe(second.manifestHash);
  });

  it("rejects malformed JSON and duplicate manifest sources", async () => {
    const service = lifecycleService(new InMemoryPeerNotebookRepository());

    await expect(service.compileDraftFromNotebook({
      workspaceId,
      notebook: notebookWithManifestText("{not-json"),
    })).rejects.toMatchObject({ code: "manifest_compile_error" });

    await expect(service.compileDraftFromNotebook({
      workspaceId,
      notebook: {
        ...notebookWithManifest(baseManifest()),
        cells: [
          manifestCell("manifest-a", baseManifest()),
          manifestCell("manifest-b", baseManifest()),
        ],
      },
    })).rejects.toMatchObject({ code: "manifest_compile_error" });
  });

  it("does not invoke a draft manifest before explicit activation", async () => {
    const repository = new InMemoryPeerNotebookRepository();
    const provider = new MockPeerRuntimeProvider();
    const service = lifecycleService(repository);

    await service.compileDraftFromNotebook({
      workspaceId,
      notebook: notebookWithManifest(baseManifest()),
    });
    await seedTextArtifact(repository);

    await expect(createPeerBroker({
      workspaceId,
      repository,
      runtimeProviders: { mock: provider },
    }).peer.invoke({
      peerId: "notebook-claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: "11111111-1111-4111-8111-111111111111" },
    })).rejects.toMatchObject({ code: "peer_not_active" });
    expect(provider.invocations).toHaveLength(0);
  });

  it("activates a notebook-derived draft and persists the active hash on invocation", async () => {
    const repository = new InMemoryPeerNotebookRepository();
    const provider = new MockPeerRuntimeProvider();
    const service = lifecycleService(repository);

    const { manifest } = await service.compileDraftFromNotebook({
      workspaceId,
      notebook: notebookWithManifest(baseManifest()),
    });
    await service.approveAndActivateManifest({
      workspaceId,
      peerId: "notebook-claim-extractor",
      manifestId: manifest.id,
      approvedBy: "user:workspace-admin",
      approvedAt,
    });
    await seedTextArtifact(repository);

    const result = await createPeerBroker({
      workspaceId,
      repository,
      runtimeProviders: { mock: provider },
    }).peer.invoke({
      peerId: "notebook-claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: "11111111-1111-4111-8111-111111111111" },
    });
    const invocation = await repository.getInvocation(workspaceId, result.invocationId);
    const peer = await repository.getPeerByPeerId(workspaceId, "notebook-claim-extractor");
    const activeManifest = await repository.getManifest(workspaceId, manifest.id);

    expect(peer?.activeManifestId).toBe(manifest.id);
    expect(activeManifest).toMatchObject({
      status: "active",
      approvedBy: "user:workspace-admin",
      approvedAt,
    });
    expect(result.manifestHash).toBe(manifest.manifestHash);
    expect(invocation?.manifestHash).toBe(manifest.manifestHash);
    expect(provider.invocations[0].manifestHash).toBe(manifest.manifestHash);
  });

  it("keeps notebook edits as drafts until explicit activation", async () => {
    const repository = new InMemoryPeerNotebookRepository();
    const provider = new MockPeerRuntimeProvider();
    const service = lifecycleService(repository);

    const v1 = await service.compileDraftFromNotebook({
      workspaceId,
      notebook: notebookWithManifest(baseManifest()),
    });
    await service.approveAndActivateManifest({
      workspaceId,
      peerId: "notebook-claim-extractor",
      manifestId: v1.manifest.id,
      approvedBy: "user:workspace-admin",
      approvedAt,
    });

    const v2 = await service.compileDraftFromNotebook({
      workspaceId,
      notebook: notebookWithManifest(baseManifest({
        extraTools: [{
          name: "expanded_tool",
          description: "Unapproved expansion",
          inputSchema: { type: "object", additionalProperties: false },
          outputSchema: { type: "object", additionalProperties: false },
        }],
      })),
    });

    await expect(createPeerBroker({
      workspaceId,
      repository,
      runtimeProviders: { mock: provider },
    }).peer.invoke({
      peerId: "notebook-claim-extractor",
      tool: "expanded_tool",
      args: {},
    })).rejects.toMatchObject({ code: "tool_not_found" });
    expect(provider.invocations).toHaveLength(0);

    const peerBeforeActivation = await repository.getPeerByPeerId(workspaceId, "notebook-claim-extractor");
    expect(peerBeforeActivation?.activeManifestId).toBe(v1.manifest.id);
    expect((await repository.getManifest(workspaceId, v2.manifest.id))?.status).toBe("draft");

    await service.approveAndActivateManifest({
      workspaceId,
      peerId: "notebook-claim-extractor",
      manifestId: v2.manifest.id,
      approvedBy: "user:workspace-admin",
      approvedAt: "2026-04-30T12:05:00.000Z",
    });

    expect((await repository.getManifest(workspaceId, v1.manifest.id))?.status).toBe("retired");
    expect((await repository.getManifest(workspaceId, v2.manifest.id))?.status).toBe("active");
    expect((await repository.getPeerByPeerId(workspaceId, "notebook-claim-extractor"))?.activeManifestId)
      .toBe(v2.manifest.id);
  });
});

function lifecycleService(repository: InMemoryPeerNotebookRepository): PeerManifestLifecycleService {
  const ids = [
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
    "44444444-4444-4444-8444-444444444444",
    "55555555-5555-4555-8555-555555555555",
  ];
  return new PeerManifestLifecycleService({
    repository,
    idGenerator: () => ids.shift() ?? randomUUID(),
    now: () => new Date("2026-04-30T12:00:00.000Z"),
  });
}

function notebookWithManifest(
  manifest: PeerManifest,
  options: { extraCells?: Notebook["cells"] } = {},
): Notebook {
  return {
    id: manifest.notebookId,
    language: "typescript",
    cells: [
      ...(options.extraCells ?? []),
      manifestCell("manifest", manifest),
    ],
    createdAt: 1,
    updatedAt: 1,
  };
}

function notebookWithManifestText(source: string): Notebook {
  return {
    id: "nb_notebook_claim_extractor",
    language: "typescript",
    cells: [{
      id: "manifest",
      type: "code",
      language: "typescript",
      filename: "peer.manifest.json",
      source,
      status: "idle",
    }],
    createdAt: 1,
    updatedAt: 1,
  };
}

function manifestCell(id: string, manifest: PeerManifest): Notebook["cells"][number] {
  return {
    id,
    type: "code",
    language: "typescript",
    filename: "peer.manifest.json",
    source: JSON.stringify(manifest),
    status: "idle",
  };
}

function baseManifest(options: {
  extraTools?: PeerManifest["exposes"]["tools"];
} = {}): PeerManifest {
  return {
    schemaVersion: "peer-notebook.v0",
    peerId: "notebook-claim-extractor",
    notebookId: "nb_notebook_claim_extractor",
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
        ...(options.extraTools ?? []),
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

async function seedTextArtifact(repository: InMemoryPeerNotebookRepository): Promise<void> {
  await repository.saveArtifactInput({
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId,
    invocationId: null,
    peerRecordId: null,
    peerId: null,
    kind: "json",
    name: "input.txt",
    mimeType: "text/plain",
    content: { text: "First claim. Second claim." },
  });
}
