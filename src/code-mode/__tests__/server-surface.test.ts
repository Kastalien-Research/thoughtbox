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

describe("createMcpServer tool surface", () => {
  it("registers Code Mode and peer notebook public tools", async () => {
    const previousSupabaseUrl = process.env.SUPABASE_URL;
    const previousSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

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

      expect(toolNames).toEqual([
        "thoughtbox_execute",
        "thoughtbox_peer_notebook",
        "thoughtbox_search",
      ]);
      expect(client.getInstructions()).toContain("thoughtbox_search");
      expect(client.getInstructions()).toContain("thoughtbox_execute");
      expect(client.getInstructions()).toContain("thoughtbox_peer_notebook");
    } finally {
      await Promise.allSettled([client.close(), server.close()]);
      restoreEnv("SUPABASE_URL", previousSupabaseUrl);
      restoreEnv("SUPABASE_SERVICE_ROLE_KEY", previousSupabaseServiceKey);
    }
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
