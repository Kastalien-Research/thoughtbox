/**
 * Catalog drift test.
 *
 * STATIC_RESOURCES / RESOURCE_TEMPLATES (src/resources/static-registry.ts)
 * are the single source of truth for static resource metadata. Three surfaces
 * derive from it: registerResource() registrations, the ListResources /
 * ListResourceTemplates escape hatches, and the Code Mode search catalog.
 *
 * This test verifies the derivations actually hold on a live server —
 * every registry entry is listed, readable, and mirrored in the search
 * catalog — so a hand-edit to any one surface fails here instead of
 * drifting silently.
 */
import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createMcpServer } from "../../server-factory.js";
import { InMemoryStorage } from "../../persistence/index.js";
import { buildSearchCatalog } from "../search-index.js";
import { SEARCH_TOOL } from "../search-tool.js";
import {
  STATIC_RESOURCES,
  RESOURCE_TEMPLATES,
} from "../../resources/static-registry.js";

const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

async function withClient<T>(
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const server = await createMcpServer({
    storage: new InMemoryStorage(),
    logger: silentLogger,
  });
  const client = new Client(
    { name: "catalog-drift-test", version: "1.0.0" },
    { capabilities: {} },
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return await fn(client);
  } finally {
    await Promise.allSettled([client.close(), server.close()]);
  }
}

describe("static catalog single-registry (drift guard)", () => {
  it("registry has unique keys and URIs", () => {
    const uris = STATIC_RESOURCES.map((r) => r.uri);
    const keys = STATIC_RESOURCES.map((r) => r.key);
    expect(new Set(uris).size).toBe(uris.length);
    expect(new Set(keys).size).toBe(keys.length);

    const templateUris = RESOURCE_TEMPLATES.map((t) => t.uriTemplate);
    const templateKeys = RESOURCE_TEMPLATES.map((t) => t.key);
    expect(new Set(templateUris).size).toBe(templateUris.length);
    expect(new Set(templateKeys).size).toBe(templateKeys.length);
  });

  it("resources/list matches the registry exactly", async () => {
    await withClient(async (client) => {
      const { resources } = await client.listResources();
      const listed = resources
        .map((r) => ({
          uri: r.uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        }))
        .sort((a, b) => a.uri.localeCompare(b.uri));
      const expected = STATIC_RESOURCES.map((d) => ({
        uri: d.uri,
        name: d.name,
        description: d.description,
        mimeType: d.mimeType,
      })).sort((a, b) => a.uri.localeCompare(b.uri));
      expect(listed).toEqual(expected);
    });
  });

  it("resources/templates/list matches the registry exactly", async () => {
    await withClient(async (client) => {
      const { resourceTemplates } = await client.listResourceTemplates();
      const listed = resourceTemplates
        .map((t) => ({
          uriTemplate: t.uriTemplate,
          name: t.name,
          description: t.description,
          mimeType: t.mimeType,
        }))
        .sort((a, b) => a.uriTemplate.localeCompare(b.uriTemplate));
      const expected = RESOURCE_TEMPLATES.map((d) => ({
        uriTemplate: d.uriTemplate,
        name: d.name,
        description: d.description,
        mimeType: d.mimeType,
      })).sort((a, b) => a.uriTemplate.localeCompare(b.uriTemplate));
      expect(listed).toEqual(expected);
    });
  });

  it("every registry resource is readable with the declared mimeType", async () => {
    await withClient(async (client) => {
      for (const def of STATIC_RESOURCES) {
        const result = await client.readResource({ uri: def.uri });
        expect(result.contents.length).toBeGreaterThan(0);
        const content = result.contents[0] as {
          uri: string;
          mimeType?: string;
          text?: string;
        };
        expect(content.uri).toBe(def.uri);
        expect(content.mimeType).toBe(def.mimeType);
        expect(typeof content.text).toBe("string");
        expect((content.text as string).length).toBeGreaterThan(0);
      }
    });
  });

  it("search catalog resources/templates mirror the registry", () => {
    const catalog = buildSearchCatalog();
    expect(catalog.resources).toEqual(
      STATIC_RESOURCES.map((d) => ({
        name: d.name,
        uri: d.uri,
        description: d.description,
        mimeType: d.mimeType,
      })),
    );
    expect(catalog.resourceTemplates).toEqual(
      RESOURCE_TEMPLATES.map((d) => ({
        name: d.name,
        uriTemplate: d.uriTemplate,
        description: d.description,
        mimeType: d.mimeType,
      })),
    );
  });

  it("search-tool description lists every operations module incl. claims", () => {
    const catalog = buildSearchCatalog();
    // The SEARCH_TOOL description enumerates modules; keep it in sync with
    // the real catalog keys.
    for (const moduleName of Object.keys(catalog.operations)) {
      expect(SEARCH_TOOL.description).toContain(moduleName);
    }
    expect(Object.keys(catalog.operations)).toContain("claims");
  });
});
