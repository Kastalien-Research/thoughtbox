import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createMcpServer } from "../../server-factory.js";
import { InMemoryStorage } from "../../persistence/index.js";

const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe("createMcpServer Code Mode surface", () => {
  it("registers only the two public Code Mode tools", async () => {
    const server = await createMcpServer({
      storage: new InMemoryStorage(),
      logger: silentLogger,
    });
    const client = new Client(
      { name: "codemode-test-client", version: "1.0.0" },
      { capabilities: {} },
    );
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      const { tools } = await client.listTools();
      const toolNames = tools.map((tool) => tool.name).sort();

      expect(toolNames).toEqual(["thoughtbox_execute", "thoughtbox_search"]);
      expect(client.getInstructions()).toContain("thoughtbox_search");
      expect(client.getInstructions()).toContain("thoughtbox_execute");
    } finally {
      await Promise.allSettled([client.close(), server.close()]);
    }
  });
});
