import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTenantHubStorageProvider } from "../hub-storage-fs.js";
import type { Workspace } from "../hub-types.js";

const TENANT_A = "11111111-1111-4111-a111-111111111111";
const TENANT_B = "22222222-2222-4222-a222-222222222222";

function workspace(id: string, name: string): Workspace {
  return {
    id,
    name,
    description: "",
    createdBy: "agent-1",
    createdAt: new Date().toISOString(),
    agents: [],
    status: "active",
  } as unknown as Workspace;
}

describe("createTenantHubStorageProvider", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "tb-tenant-hub-"));
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it("returns the same storage instance for the same tenant", () => {
    const provider = createTenantHubStorageProvider(baseDir);
    expect(provider(TENANT_A)).toBe(provider(TENANT_A));
    expect(provider(TENANT_A)).not.toBe(provider(TENANT_B));
  });

  it("isolates hub workspaces between tenants", async () => {
    const provider = createTenantHubStorageProvider(baseDir);
    const storageA = provider(TENANT_A);
    const storageB = provider(TENANT_B);

    await storageA.saveWorkspace(workspace("ws-a", "Tenant A workspace"));

    const seenByA = await storageA.listWorkspaces();
    const seenByB = await storageB.listWorkspaces();

    expect(seenByA.map((ws) => ws.id)).toEqual(["ws-a"]);
    expect(seenByB).toEqual([]);
    expect(await storageB.getWorkspace("ws-a")).toBeNull();
  });

  it("rejects tenant ids that are not path-safe", () => {
    const provider = createTenantHubStorageProvider(baseDir);
    expect(() => provider("../escape")).toThrow(/Invalid tenant workspace id/);
    expect(() => provider("a/b")).toThrow(/Invalid tenant workspace id/);
    expect(() => provider("")).toThrow(/Invalid tenant workspace id/);
  });
});
