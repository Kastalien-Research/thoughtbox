import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { NotebookHandler } from "../../notebook/index.js";
import {
  InMemoryPeerNotebookRepository,
  PeerNotebookHandler,
  PeerNotebookTool,
} from "../index.js";
import { graduationPeerManifest } from "./fixtures.js";

const WORKSPACE_ID = "workspace_graduation";
const E2E_TIMEOUT_MS = 20_000;

const tempDirs: string[] = [];

afterAll(async () => {
  for (const dir of tempDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

// Phase 5.4 (SPEC-CONTROL-PLANE c2): notebook graduation compiles the
// peer.manifest.json code cell as pure data — no notebook code executes —
// and always lands a draft governed by the 5.1 approval flow.
describe("peer notebook graduation", () => {
  it(
    "graduates a manifest cell to a draft, blocks invoke, then runs end-to-end after approval",
    { timeout: E2E_TIMEOUT_MS },
    async () => {
      const { tool, repository, notebookHandler } = await setup();
      const notebookId = await createNotebook(notebookHandler);
      const manifestJson = JSON.stringify(graduationPeerManifest("graduated-claims", notebookId));
      await addManifestCell(notebookHandler, notebookId, manifestJson);

      const graduated = await tool.handle({
        operation: "peer_graduate_notebook",
        notebookId,
        displayName: "Graduated claims peer",
      });

      expect(graduated.manifest.status).toBe("draft");
      expect(graduated.manifest.approvedAt).toBeNull();
      expect(graduated.manifest.version).toBe(1);
      expect(graduated.manifest.compiledFrom).toEqual({
        sourceName: "peer.manifest.json",
        sourceType: "cell",
      });
      expect(graduated.supersededManifestIds).toEqual([]);

      const peer = await repository.getPeerByPeerId(WORKSPACE_ID, "graduated-claims");
      expect(peer).toMatchObject({ displayName: "Graduated claims peer", activeManifestId: null });

      const seeded = await tool.handle({
        operation: "peer_artifact_seed",
        text: "First claim. Second claim.",
      });
      await expect(tool.handle({
        operation: "peer_invoke",
        peerId: "graduated-claims",
        tool: "extract_claims",
        args: { textArtifactId: seeded.artifact.id },
      })).rejects.toMatchObject({
        code: "manifest_not_active",
        message: expect.stringContaining("is draft"),
      });

      await tool.handle({
        operation: "peer_manifest_approve",
        manifestId: graduated.manifest.id,
      });
      const invoked = await tool.handle({
        operation: "peer_invoke",
        peerId: "graduated-claims",
        tool: "extract_claims",
        args: { textArtifactId: seeded.artifact.id },
      });

      expect(invoked.result).toMatchObject({ claimCount: 2 });
      expect(invoked.manifestHash).toBe(graduated.manifest.manifestHash);
    },
  );

  it("supersedes the prior graduated draft on re-graduation", async () => {
    const { tool, notebookHandler } = await setup();
    const notebookId = await createNotebook(notebookHandler);
    const cellId = await addManifestCell(
      notebookHandler,
      notebookId,
      JSON.stringify(graduationPeerManifest("regraduated-peer", notebookId)),
    );

    const first = await tool.handle({ operation: "peer_graduate_notebook", notebookId });

    await notebookHandler.handleUpdateCell({
      notebookId,
      cellId,
      content: JSON.stringify(graduationPeerManifest("regraduated-peer", notebookId, { timeoutMs: 60_000 })),
    });
    const second = await tool.handle({ operation: "peer_graduate_notebook", notebookId });

    expect(second.manifest.version).toBe(2);
    expect(second.manifest.status).toBe("draft");
    expect(second.supersededManifestIds).toEqual([first.manifest.id]);

    const listed = await tool.handle({
      operation: "peer_manifest_list",
      peerId: "regraduated-peer",
    });
    expect(listed.manifests.map(manifest => [manifest.version, manifest.status])).toEqual([
      [1, "retired"],
      [2, "draft"],
    ]);

    await expect(tool.handle({
      operation: "peer_manifest_approve",
      manifestId: first.manifest.id,
    })).rejects.toMatchObject({ code: "invalid_manifest_transition" });
  });

  it("rejects notebooks without a peer.manifest.json cell", async () => {
    const { tool, notebookHandler } = await setup();
    const notebookId = await createNotebook(notebookHandler);

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "manifest_compile_error",
      message: expect.stringContaining("no code cell named peer.manifest.json"),
    });
  });

  it("rejects malformed manifest cell JSON", async () => {
    const { tool, notebookHandler } = await setup();
    const notebookId = await createNotebook(notebookHandler);
    await addManifestCell(notebookHandler, notebookId, "{ not json");

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "manifest_compile_error",
      message: expect.stringContaining("not valid JSON"),
    });
  });

  it("rejects manifest cells violating the manifest schema", async () => {
    const { tool, notebookHandler } = await setup();
    const notebookId = await createNotebook(notebookHandler);
    const manifest = graduationPeerManifest("schema-violator", notebookId);
    manifest.network = { enabled: "yes", allowHosts: [] };
    await addManifestCell(notebookHandler, notebookId, JSON.stringify(manifest));

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "manifest_compile_error",
      message: expect.stringContaining("failed manifest validation"),
    });
  });

  it("rejects unregistered runtime entries at graduation, not first invoke", async () => {
    const { tool, notebookHandler } = await setup();
    const notebookId = await createNotebook(notebookHandler);
    await addManifestCell(
      notebookHandler,
      notebookId,
      JSON.stringify(graduationPeerManifest("rogue-entry-peer", notebookId, { entry: "unregistered-entry" })),
    );

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "manifest_compile_error",
      message: expect.stringContaining('runtime.entry "unregistered-entry"'),
    });
  });

  it("rejects manifests omitting runtime.entry when the provider requires a registry entry", async () => {
    const { tool, notebookHandler } = await setup();
    const notebookId = await createNotebook(notebookHandler);
    const manifest = graduationPeerManifest("entryless-peer", notebookId);
    manifest.runtime = { provider: "local-process", timeoutMs: 120_000 };
    await addManifestCell(notebookHandler, notebookId, JSON.stringify(manifest));

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "manifest_compile_error",
      message: expect.stringContaining("omits runtime.entry"),
    });
  });

  it("rejects manifests declaring an unregistered runtime provider", async () => {
    const { tool, notebookHandler } = await setup();
    const notebookId = await createNotebook(notebookHandler);
    const manifest = graduationPeerManifest("wrong-provider-peer", notebookId);
    manifest.runtime = { provider: "mock", timeoutMs: 120_000 };
    await addManifestCell(notebookHandler, notebookId, JSON.stringify(manifest));

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "runtime_provider_not_found",
      message: expect.stringContaining('"mock"'),
    });
  });

  it("rejects manifest cells whose notebookId does not match the graduating notebook", async () => {
    const { tool, notebookHandler } = await setup();
    const notebookId = await createNotebook(notebookHandler);
    await addManifestCell(
      notebookHandler,
      notebookId,
      JSON.stringify(graduationPeerManifest("mismatched-peer", "some-other-notebook")),
    );

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "manifest_compile_error",
      message: expect.stringContaining('declares notebookId "some-other-notebook"'),
    });
  });

  it("rejects unknown notebook ids", async () => {
    const { tool } = await setup();

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId: "missing-notebook",
    })).rejects.toMatchObject({ code: "notebook_not_found" });
  });
});

async function setup() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tb-graduation-"));
  tempDirs.push(tempDir);
  const notebookHandler = new NotebookHandler(tempDir);
  const repository = new InMemoryPeerNotebookRepository();
  const handler = new PeerNotebookHandler({
    repository,
    workspaceId: WORKSPACE_ID,
    notebookSource: notebookHandler,
  });

  return { repository, notebookHandler, tool: new PeerNotebookTool(handler) };
}

async function createNotebook(notebookHandler: NotebookHandler): Promise<string> {
  const created = await notebookHandler.handleCreateNotebook({
    title: "Graduation candidate",
    language: "javascript",
  });
  return created.notebook.id as string;
}

async function addManifestCell(
  notebookHandler: NotebookHandler,
  notebookId: string,
  content: string,
): Promise<string> {
  const added = await notebookHandler.handleAddCell({
    notebookId,
    cellType: "code",
    content,
    filename: "peer.manifest.json",
  });
  return added.cell.id as string;
}
