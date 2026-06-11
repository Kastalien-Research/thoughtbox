import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createPeerBroker,
  MockPeerRuntimeProvider,
  PeerNotebookHandler,
  PeerNotebookTool,
  SupabasePeerNotebookRepository,
} from "../index.js";
import {
  createServiceClient,
  ensureTestWorkspace,
  getTestSupabaseConfig,
  isSupabaseAvailable,
  TEST_WORKSPACE_ID,
} from "../../__tests__/supabase-test-helpers.js";
import { lifecyclePeerManifestJson } from "./fixtures.js";

const SECOND_WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";

describe("SupabasePeerNotebookRepository", () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable() && await isPeerNotebookSchemaAvailable();
  });

  beforeEach(async () => {
    if (!available) return;
    await ensureTestWorkspace();
    await ensureWorkspace(SECOND_WORKSPACE_ID);
    await truncatePeerNotebookTables();
  });

  it("persists the durable seed -> invoke -> trace -> artifact MCP flow", async ({ skip }) => {
    if (!available) skip();
    const provider = new MockPeerRuntimeProvider();
    const repository = new SupabasePeerNotebookRepository(getTestSupabaseConfig());
    const tool = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      mockRuntimeProvider: provider,
      workspaceId: TEST_WORKSPACE_ID,
    }));

    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "First claim. Second claim.",
      name: "input.txt",
    });
    const invoked = await tool.handle({
      operation: "peer_invoke",
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });
    const invocationRead = await tool.handle({
      operation: "peer_get_invocation",
      invocationId: invoked.invocationId,
    });
    const traced = await tool.handle({
      operation: "peer_list_trace_events",
      invocationId: invoked.invocationId,
    });
    const outputArtifactId = (invoked.result as { claimsArtifactId: string }).claimsArtifactId;
    const artifactRead = await tool.handle({
      operation: "peer_get_artifact",
      artifactId: outputArtifactId,
    });

    expect(provider.invocations).toHaveLength(1);
    expect(invocationRead.invocation.status).toBe("completed");
    expect(invocationRead.invocation.workspaceId).toBe(TEST_WORKSPACE_ID);
    expect(invocationRead.invocation.peerId).toBe("claim-extractor");
    expect(traced.events.map(event => event.eventType)).toEqual(expect.arrayContaining([
      "peer_invocation_created",
      "outbound_call_allowed",
      "denied_outbound_call",
      "peer_artifact_written",
      "peer_invocation_completed",
    ]));
    expect(artifactRead.artifact).toMatchObject({
      id: outputArtifactId,
      workspaceId: TEST_WORKSPACE_ID,
      storageBackend: "supabase_storage",
      storageBucket: "peer-artifacts",
      name: "claims.json",
      mimeType: "application/json",
    });
    expect(artifactRead.artifact.storagePath).toContain(`${TEST_WORKSPACE_ID}/`);
    expect(artifactRead.artifact.content).toMatchObject({
      claims: [
        { id: "claim_1", text: "First claim" },
        { id: "claim_2", text: "Second claim" },
      ],
    });
    const listedArtifacts = await repository.listArtifacts(TEST_WORKSPACE_ID, invoked.invocationId);
    expect(listedArtifacts).toEqual([
      expect.objectContaining({
        id: outputArtifactId,
        peerId: "claim-extractor",
        name: "claims.json",
      }),
    ]);
  });

  it("persists the draft -> approve -> invoke manifest lifecycle durably", async ({ skip }) => {
    if (!available) skip();
    const provider = new MockPeerRuntimeProvider();
    const repository = new SupabasePeerNotebookRepository(getTestSupabaseConfig());
    const tool = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      mockRuntimeProvider: provider,
      workspaceId: TEST_WORKSPACE_ID,
    }));

    const created = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("lifecycle-peer"),
    });
    expect(created.manifest.status).toBe("draft");
    const durableDraft = await repository.getManifest(TEST_WORKSPACE_ID, created.manifest.id);
    expect(durableDraft?.status).toBe("draft");

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

    await tool.handle({
      operation: "peer_manifest_approve",
      manifestId: created.manifest.id,
    });
    const durableActive = await repository.getManifest(TEST_WORKSPACE_ID, created.manifest.id);
    expect(durableActive?.status).toBe("active");
    expect(durableActive?.approvedAt).toEqual(expect.any(String));
    const peer = await repository.getPeerByPeerId(TEST_WORKSPACE_ID, "lifecycle-peer");
    expect(peer?.activeManifestId).toBe(created.manifest.id);

    const invoked = await tool.handle({
      operation: "peer_invoke",
      peerId: "lifecycle-peer",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });
    expect(invoked.manifestHash).toBe(created.manifest.manifestHash);

    const superseding = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("lifecycle-peer", { timeoutMs: 60_000 }),
    });
    const approved = await tool.handle({
      operation: "peer_manifest_approve",
      manifestId: superseding.manifest.id,
    });
    expect(approved.retiredManifestId).toBe(created.manifest.id);
    const durableRetired = await repository.getManifest(TEST_WORKSPACE_ID, created.manifest.id);
    expect(durableRetired?.status).toBe("retired");

    const rejectedDraft = await tool.handle({
      operation: "peer_manifest_create",
      manifestJson: lifecyclePeerManifestJson("lifecycle-peer", { timeoutMs: 30_000 }),
    });
    await tool.handle({
      operation: "peer_manifest_reject",
      manifestId: rejectedDraft.manifest.id,
    });
    const durableRejected = await repository.getManifest(TEST_WORKSPACE_ID, rejectedDraft.manifest.id);
    expect(durableRejected?.status).toBe("rejected");
    expect(await repository.listManifests(TEST_WORKSPACE_ID, rejectedDraft.manifest.peerRecordId)).toHaveLength(3);
  });

  it("keeps artifacts workspace-scoped", async ({ skip }) => {
    if (!available) skip();
    const repository = new SupabasePeerNotebookRepository(getTestSupabaseConfig());
    const tool = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      workspaceId: TEST_WORKSPACE_ID,
    }));

    const seeded = await tool.handle({
      operation: "peer_artifact_seed",
      text: "Workspace A only.",
    });

    await expect(new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      workspaceId: SECOND_WORKSPACE_ID,
    })).handle({
      operation: "peer_get_artifact",
      artifactId: seeded.artifact.id,
    })).rejects.toMatchObject({ code: "artifact_not_found" });
  });

  it("rejects invalid args before runtime dispatch in Supabase mode", async ({ skip }) => {
    if (!available) skip();
    const provider = new MockPeerRuntimeProvider();
    const repository = new SupabasePeerNotebookRepository(getTestSupabaseConfig());
    const tool = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      mockRuntimeProvider: provider,
      workspaceId: TEST_WORKSPACE_ID,
    }));

    await expect(tool.handle({
      operation: "peer_invoke",
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: {},
    })).rejects.toMatchObject({ code: "invalid_args" });
    expect(provider.invocations).toHaveLength(0);
  });

  it("does not forward denied outbound calls and stores the denial durably", async ({ skip }) => {
    if (!available) skip();
    const provider = new MockPeerRuntimeProvider();
    const repository = new SupabasePeerNotebookRepository(getTestSupabaseConfig());
    const handler = new PeerNotebookHandler({
      repository,
      mockRuntimeProvider: provider,
      workspaceId: TEST_WORKSPACE_ID,
    });
    const seeded = await handler.seedArtifact({
      text: "First claim.",
    });
    let forwardedDeniedTarget = false;

    const result = await createPeerBroker({
      workspaceId: TEST_WORKSPACE_ID,
      repository,
      runtimeProviders: { mock: provider },
      proxyTargets: {
        "thoughtbox.knowledge.queryGraph": async () => {
          forwardedDeniedTarget = true;
          return {};
        },
      },
    }).peer.invoke({
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });

    const events = await repository.listTraceEvents(TEST_WORKSPACE_ID, result.invocationId);
    expect(forwardedDeniedTarget).toBe(false);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        eventType: "denied_outbound_call",
        attrs: { target: "thoughtbox.knowledge.queryGraph" },
      }),
    ]));
  });

  it("allocates trace seq values atomically under concurrent appends", async ({ skip }) => {
    if (!available) skip();
    const repository = new SupabasePeerNotebookRepository(getTestSupabaseConfig());
    const handler = new PeerNotebookHandler({
      repository,
      workspaceId: TEST_WORKSPACE_ID,
    });
    const seeded = await handler.seedArtifact({
      text: "First claim.",
    });
    const invoked = await handler.invoke({
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });

    const appended = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        repository.appendTraceEvent({
          workspaceId: TEST_WORKSPACE_ID,
          invocationId: invoked.invocationId,
          eventType: "concurrent_probe",
          severity: "info",
          attrs: { index },
        }),
      ),
    );

    expect(new Set(appended.map(event => event.seq)).size).toBe(appended.length);
    const events = await repository.listTraceEvents(TEST_WORKSPACE_ID, invoked.invocationId);
    expect(events.map(event => event.seq)).toEqual([...events.map(event => event.seq)].sort((a, b) => a - b));
    expect(events.filter(event => event.eventType === "concurrent_probe")).toHaveLength(10);
  });

  it("rejects cross-workspace artifact writes before uploading storage payloads", async ({ skip }) => {
    if (!available) skip();
    const repository = new SupabasePeerNotebookRepository(getTestSupabaseConfig());
    const handler = new PeerNotebookHandler({
      repository,
      workspaceId: TEST_WORKSPACE_ID,
    });
    const seeded = await handler.seedArtifact({
      text: "First claim.",
    });
    const invoked = await handler.invoke({
      peerId: "claim-extractor",
      tool: "extract_claims",
      args: { textArtifactId: seeded.artifact.id },
    });
    const invocation = await repository.getInvocation(TEST_WORKSPACE_ID, invoked.invocationId);
    if (!invocation) {
      throw new Error("Expected durable invocation to exist");
    }

    const artifactId = "44444444-4444-4444-8444-444444444444";
    await expect(repository.saveArtifactInput({
      id: artifactId,
      workspaceId: SECOND_WORKSPACE_ID,
      invocationId: invoked.invocationId,
      peerRecordId: invocation.peerRecordId,
      peerId: "claim-extractor",
      kind: "json",
      name: "cross-workspace.json",
      mimeType: "application/json",
      content: { ok: false },
    })).rejects.toMatchObject({ code: "invocation_not_found" });

    const attemptedStoragePrefix = [
      SECOND_WORKSPACE_ID,
      invocation.peerRecordId,
      invoked.invocationId,
      artifactId,
    ].join("/");
    expect(await listStorageObjectPaths(attemptedStoragePrefix)).toEqual([]);
  });

  it("returns invocation_not_found for unknown trace invocation reads", async ({ skip }) => {
    if (!available) skip();
    const repository = new SupabasePeerNotebookRepository(getTestSupabaseConfig());
    const tool = new PeerNotebookTool(new PeerNotebookHandler({
      repository,
      workspaceId: TEST_WORKSPACE_ID,
    }));

    await expect(tool.handle({
      operation: "peer_list_trace_events",
      invocationId: "33333333-3333-4333-8333-333333333333",
    })).rejects.toMatchObject({ code: "invocation_not_found" });
  });
});

async function isPeerNotebookSchemaAvailable(): Promise<boolean> {
  try {
    const { error } = await createServiceClient()
      .from("peer_notebooks")
      .select("id")
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function truncatePeerNotebookTables(): Promise<void> {
  const client = createServiceClient();
  await removeStorageObjectsForWorkspace(TEST_WORKSPACE_ID);
  await removeStorageObjectsForWorkspace(SECOND_WORKSPACE_ID);
  await client.from("peer_artifacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("peer_trace_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("peer_invocations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("peer_manifests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("peer_notebooks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

async function ensureWorkspace(workspaceId: string): Promise<void> {
  const client = createServiceClient();
  const { data: baseWorkspace, error: baseError } = await client
    .from("workspaces")
    .select("owner_user_id")
    .eq("id", TEST_WORKSPACE_ID)
    .single();

  if (baseError) {
    throw new Error(`Failed to load base workspace owner: ${baseError.message}`);
  }

  const { error } = await client.from("workspaces").upsert({
    id: workspaceId,
    name: "Second Test Workspace",
    slug: "second-test-workspace",
    owner_user_id: (baseWorkspace as { owner_user_id: string }).owner_user_id,
    status: "active",
    plan_id: "free",
  }, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to create second workspace: ${error.message}`);
  }
}

async function removeStorageObjectsForWorkspace(workspaceId: string): Promise<void> {
  const client = createServiceClient();
  const bucket = client.storage.from("peer-artifacts");
  const paths = await listStorageObjectPaths(workspaceId);

  if (paths.length > 0) {
    const { error } = await bucket.remove(paths);
    if (error) {
      throw new Error(`Failed to remove peer artifact test objects: ${error.message}`);
    }
  }
}

async function listStorageObjectPaths(prefix: string): Promise<string[]> {
  const client = createServiceClient();
  const { data, error } = await client.storage
    .from("peer-artifacts")
    .list(prefix, { limit: 1000 });

  if (error) {
    throw new Error(`Failed to list peer artifact test objects: ${error.message}`);
  }

  const paths: string[] = [];
  for (const object of data ?? []) {
    const path = `${prefix}/${object.name}`;
    if (object.id) {
      paths.push(path);
    } else {
      paths.push(...await listStorageObjectPaths(path));
    }
  }
  return paths;
}
