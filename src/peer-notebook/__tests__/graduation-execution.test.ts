import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { NotebookHandler } from "../../notebook/index.js";
import {
  CONTRADICTION_SCAN_CELL_SOURCE,
  CONTRADICTION_SCAN_ENTRY_FILENAME,
  CONTRADICTION_SCAN_PEER_ID,
  CONTRADICTION_SCAN_TOOL_NAME,
  contradictionScanManifest,
  InMemoryPeerNotebookRepository,
  PeerNotebookHandler,
  PeerNotebookTool,
} from "../index.js";
import { graduationPeerManifest } from "./fixtures.js";

const WORKSPACE_ID = "workspace_graduation_execution";
const E2E_TIMEOUT_MS = 30_000;

const tempDirs: string[] = [];

afterAll(async () => {
  for (const dir of tempDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

// Closes the graduation loop (SPEC-CONTROL-PLANE c7): a graduated notebook's
// OWN code cells execute at invoke time. Graduation captures the executable
// cells into an immutable code snapshot on the manifest record
// (compiledFrom.notebook); the local-process provider materializes that
// snapshot and runs the entry cell through the notebook execution engine.
// The invoking handler is a FRESH instance sharing only the repository — the
// authoring notebook session is gone, proving cross-session invocability.
describe("graduated notebook execution", () => {
  it(
    "authors, graduates, approves, then a different session invokes the notebook's own cell end-to-end",
    { timeout: E2E_TIMEOUT_MS },
    async () => {
      // --- Authoring session: real notebook, real cells, real lifecycle ---
      const { repository, notebookHandler, tool: authoringTool } = await setupAuthoringSession();
      const notebookId = await authorContradictionScanNotebook(notebookHandler);

      const graduated = await authoringTool.handle({
        operation: "peer_graduate_notebook",
        notebookId,
        displayName: "Contradiction scan",
        description: "Flags contradiction candidates in a claims artifact",
      });

      expect(graduated.manifest.status).toBe("draft");
      const snapshot = graduated.manifest.compiledFrom.notebook;
      expect(snapshot).toBeDefined();
      expect(snapshot?.entryFilename).toBe(CONTRADICTION_SCAN_ENTRY_FILENAME);
      expect(snapshot?.language).toBe("javascript");
      expect(snapshot?.cells.map(cell => cell.filename)).toEqual([CONTRADICTION_SCAN_ENTRY_FILENAME]);
      expect(snapshot?.cells[0]?.source).toBe(CONTRADICTION_SCAN_CELL_SOURCE);

      await authoringTool.handle({
        operation: "peer_manifest_approve",
        manifestId: graduated.manifest.id,
      });

      // --- Invoking session: fresh handler, NO notebook source, shared repo ---
      const invokingHandler = new PeerNotebookHandler({
        repository,
        workspaceId: WORKSPACE_ID,
      });
      const invokingTool = new PeerNotebookTool(invokingHandler);

      const seeded = await invokingTool.handle({
        operation: "peer_artifact_seed",
        name: "claims.json",
        text: JSON.stringify({
          claims: [
            { id: "c1", text: "The cache is enabled" },
            { id: "c2", text: "The cache is not enabled" },
            { id: "c3", text: "Latency increased after the change" },
            { id: "c4", text: "Latency decreased after the change" },
            { id: "c5", text: "The deploy shipped on Tuesday" },
          ],
        }),
      });

      const invoked = await invokingTool.handle({
        operation: "peer_invoke",
        peerId: CONTRADICTION_SCAN_PEER_ID,
        tool: CONTRADICTION_SCAN_TOOL_NAME,
        args: { claimsArtifactId: seeded.artifact.id },
      });

      expect(invoked.result).toMatchObject({
        candidateCount: 2,
        claimCount: 5,
        contradictionsArtifactId: expect.any(String),
      });

      const contradictionsArtifactId =
        (invoked.result as { contradictionsArtifactId: string }).contradictionsArtifactId;
      const artifact = await invokingTool.handle({
        operation: "peer_get_artifact",
        artifactId: contradictionsArtifactId,
      });
      expect(artifact.artifact.name).toBe("contradictions.json");
      expect(artifact.artifact.content).toEqual({
        candidates: [
          {
            leftId: "c1",
            leftText: "The cache is enabled",
            rightId: "c2",
            rightText: "The cache is not enabled",
            kind: "negation",
          },
          {
            leftId: "c3",
            leftText: "Latency increased after the change",
            rightId: "c4",
            rightText: "Latency decreased after the change",
            kind: "antonym",
          },
        ],
      });

      // Invocation record + trace events carry the real execution story.
      const read = await invokingTool.handle({
        operation: "peer_get_invocation",
        invocationId: invoked.invocationId,
      });
      expect(read.invocation.status).toBe("completed");
      expect(read.invocation.runtimeProvider).toBe("local-process");

      const traced = await invokingTool.handle({
        operation: "peer_list_trace_events",
        invocationId: invoked.invocationId,
      });
      expect(traced.events).toEqual(expect.arrayContaining([
        expect.objectContaining({ eventType: "peer_invocation_created" }),
        expect.objectContaining({
          eventType: "outbound_call_allowed",
          attrs: { target: "artifact.get" },
        }),
        expect.objectContaining({ eventType: "peer_artifact_written" }),
        expect.objectContaining({ eventType: "peer_invocation_completed" }),
      ]));
    },
  );

  it("blocks invoke while the graduated notebook manifest is still a draft", async () => {
    const { repository, notebookHandler, tool } = await setupAuthoringSession();
    const notebookId = await authorContradictionScanNotebook(notebookHandler);

    await tool.handle({ operation: "peer_graduate_notebook", notebookId });

    const invokingTool = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      workspaceId: WORKSPACE_ID,
    }));
    const seeded = await invokingTool.handle({
      operation: "peer_artifact_seed",
      text: JSON.stringify({ claims: [{ id: "c1", text: "A" }] }),
    });

    await expect(invokingTool.handle({
      operation: "peer_invoke",
      peerId: CONTRADICTION_SCAN_PEER_ID,
      tool: CONTRADICTION_SCAN_TOOL_NAME,
      args: { claimsArtifactId: seeded.artifact.id },
    })).rejects.toMatchObject({
      code: "manifest_not_active",
      message: expect.stringContaining("is draft"),
    });
  });

  it("rejects graduation when the notebook entry cell does not exist", async () => {
    const { notebookHandler, tool } = await setupAuthoringSession();
    const created = await notebookHandler.handleCreateNotebook({
      title: "Missing entry cell",
      language: "javascript",
    });
    const notebookId = created.notebook.id as string;
    const manifest = graduationPeerManifest("missing-entry-peer", notebookId, {
      entry: "notebook:missing-cell.js",
    });
    await notebookHandler.handleAddCell({
      notebookId,
      cellType: "code",
      content: JSON.stringify(manifest),
      filename: "peer.manifest.json",
    });

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "manifest_compile_error",
      message: expect.stringContaining('no code cell named "missing-cell.js"'),
    });
  });

  it("rejects graduation when the notebook package.json declares dependencies", async () => {
    const { notebookHandler, tool } = await setupAuthoringSession();
    const notebookId = await authorContradictionScanNotebook(notebookHandler);
    const notebook = notebookHandler.getNotebook(notebookId);
    const pkgCell = notebook?.cells.find(cell => cell.type === "package.json");
    expect(pkgCell).toBeDefined();
    await notebookHandler.handleUpdateCell({
      notebookId,
      cellId: pkgCell?.id,
      content: JSON.stringify({ type: "module", dependencies: { lodash: "4.17.21" } }),
    });

    await expect(tool.handle({
      operation: "peer_graduate_notebook",
      notebookId,
    })).rejects.toMatchObject({
      code: "manifest_compile_error",
      message: expect.stringContaining("dependency-free"),
    });
  });

  it("fails invoke with invalid_args when a notebook-entry manifest lacks the graduation snapshot", async () => {
    // Manifest created through the file-draft path (peer_manifest_create)
    // never captures a code snapshot; a notebook entry there is a dead letter
    // and the provider says so instead of guessing at live notebook state.
    const { repository, tool } = await setupAuthoringSession();
    const created = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: JSON.stringify(contradictionScanManifest("nb_orphan_manifest")),
    });
    await tool.handle({
      operation: "peer_manifest_approve",
      manifestId: created.manifest.id,
    });

    const invokingTool = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      workspaceId: WORKSPACE_ID,
    }));
    const seeded = await invokingTool.handle({
      operation: "peer_artifact_seed",
      text: JSON.stringify({ claims: [{ id: "c1", text: "A" }] }),
    });

    await expect(invokingTool.handle({
      operation: "peer_invoke",
      peerId: CONTRADICTION_SCAN_PEER_ID,
      tool: CONTRADICTION_SCAN_TOOL_NAME,
      args: { claimsArtifactId: seeded.artifact.id },
    })).rejects.toMatchObject({
      code: "invalid_args",
      message: expect.stringContaining("compiledFrom.notebook is absent"),
    });
  });
});

async function setupAuthoringSession() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tb-graduation-exec-"));
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

/** Author the contradiction-scan notebook exactly as an agent session would. */
async function authorContradictionScanNotebook(notebookHandler: NotebookHandler): Promise<string> {
  const created = await notebookHandler.handleCreateNotebook({
    title: "Contradiction scan peer",
    language: "javascript",
  });
  const notebookId = created.notebook.id as string;

  await notebookHandler.handleAddCell({
    notebookId,
    cellType: "code",
    content: CONTRADICTION_SCAN_CELL_SOURCE,
    filename: CONTRADICTION_SCAN_ENTRY_FILENAME,
  });
  await notebookHandler.handleAddCell({
    notebookId,
    cellType: "code",
    content: JSON.stringify(contradictionScanManifest(notebookId)),
    filename: "peer.manifest.json",
  });

  return notebookId;
}
