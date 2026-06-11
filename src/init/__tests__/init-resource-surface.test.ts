import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createMcpServer } from "../../server-factory.js";
import { InMemoryStorage } from "../../persistence/index.js";
import { buildSearchCatalog } from "../../code-mode/index.js";
import { SEARCH_TOOL } from "../../code-mode/search-tool.js";
import {
  INIT_NAVIGATION_STEPS,
  getNavigationCatalog,
  getNavigationStepNames,
} from "../operations.js";

const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const PHANTOM_OPS = ["get_state", "navigate", "list_roots", "bind_root"];

interface InitNavigationCatalogJson {
  version: string;
  kind: string;
  note: string;
  steps: Array<Record<string, unknown> & { name: string; uriTemplate: string; exampleUri: string }>;
  categories: Array<{ name: string; description: string }>;
}

async function withInitTestClient(
  run: (client: Client) => Promise<void>,
): Promise<void> {
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

  const server = await createMcpServer({
    storage: new InMemoryStorage(),
    logger: silentLogger,
  });
  const client = new Client(
    { name: "init-resource-test-client", version: "1.0.0" },
    { capabilities: {} },
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    await run(client);
  } finally {
    await Promise.allSettled([client.close(), server.close()]);
    restoreEnv("SUPABASE_URL", previousSupabaseUrl);
    restoreEnv("SUPABASE_SERVICE_ROLE_KEY", previousSupabaseServiceKey);
  }
}

describe("init resource surface honesty", () => {
  it("lists the init catalog with a description naming exactly the served steps", async () => {
    await withInitTestClient(async (client) => {
      const { resources } = await client.listResources();
      const listed = resources.find(
        resource => resource.uri === "thoughtbox://init/operations",
      );
      expect(listed).toBeDefined();

      for (const name of getNavigationStepNames()) {
        expect(listed?.description).toContain(name);
      }
      for (const phantom of PHANTOM_OPS) {
        expect(listed?.description).not.toContain(phantom);
      }
      expect(listed?.description).toContain("reading thoughtbox://init URIs");
      expect(listed?.description).toContain("not by calling a tool");
    });
  });

  it("serves a catalog whose content matches the navigation steps module", async () => {
    await withInitTestClient(async (client) => {
      const { contents } = await client.readResource({
        uri: "thoughtbox://init/operations",
      });
      expect(contents).toHaveLength(1);
      expect(contents[0]?.mimeType).toBe("application/json");
      expect(contents[0]?.text).toBe(getNavigationCatalog());

      const catalog = JSON.parse(contents[0]?.text as string) as InitNavigationCatalogJson;
      expect(catalog.kind).toBe("resource-navigation");
      expect(catalog.note).toContain("no callable init tool");
      expect(catalog.steps.map(step => step.name)).toEqual([
        "list_sessions",
        "load_context",
        "start_new",
      ]);

      for (const step of catalog.steps) {
        expect(step["kind"]).toBe("resource-navigation");
        expect(step.uriTemplate).toMatch(/^thoughtbox:\/\/init/);
        expect(step.exampleUri).toMatch(/^thoughtbox:\/\/init/);
        // No tool-call shape: nothing accepts these as call arguments.
        expect(step).not.toHaveProperty("inputSchema");
        expect(step).not.toHaveProperty("inputs");
        expect(step).not.toHaveProperty("example");
      }
    });
  });

  it("resolves every cataloged step through the per-step template and rejects phantom ops", async () => {
    await withInitTestClient(async (client) => {
      for (const name of getNavigationStepNames()) {
        const { contents } = await client.readResource({
          uri: `thoughtbox://init/operations/${name}`,
        });
        const step = JSON.parse(contents[0]?.text as string) as { name: string; kind: string };
        expect(step.name).toBe(name);
        expect(step.kind).toBe("resource-navigation");
      }

      for (const phantom of PHANTOM_OPS) {
        await expect(
          client.readResource({ uri: `thoughtbox://init/operations/${phantom}` }),
        ).rejects.toThrow(/Unknown init navigation step/);
      }
    });
  });

  it("serves every step's exampleUri through the init read handler", async () => {
    await withInitTestClient(async (client) => {
      for (const step of INIT_NAVIGATION_STEPS) {
        const { contents } = await client.readResource({ uri: step.exampleUri });
        expect(contents).toHaveLength(1);
        expect(contents[0]?.mimeType).toBe("text/markdown");
        expect((contents[0]?.text as string).length).toBeGreaterThan(0);
      }
    });
  });

  it("keeps init out of the Code Mode catalog, matching the search tool's statement", () => {
    const catalog = buildSearchCatalog();
    expect(Object.keys(catalog.operations)).not.toContain("init");
    expect(SEARCH_TOOL.description).toContain(
      "The legacy init entrypoint is intentionally absent from the Code Mode catalog.",
    );
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
