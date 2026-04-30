import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { createMcpServer } from "../../server-factory.js";
import { InMemoryStorage } from "../../persistence/index.js";
import { InMemoryPeerNotebookRepository } from "../../peer-notebook/index.js";

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

      const { resources } = await client.listResources();
      expect(resources.map(resource => resource.uri)).toContain("thoughtbox://peer-notebook/pilot");
    } finally {
      await Promise.allSettled([client.close(), server.close()]);
      restoreEnv("SUPABASE_URL", previousSupabaseUrl);
      restoreEnv("SUPABASE_SERVICE_ROLE_KEY", previousSupabaseServiceKey);
    }
  });

  it("invokes the mock peer notebook pilot through the MCP client", async () => {
    const previousSupabaseUrl = process.env.SUPABASE_URL;
    const previousSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    const server = await createMcpServer({
      storage: new InMemoryStorage(),
      logger: silentLogger,
      workspaceId: "workspace_peer_e2e",
      peerNotebookRepository: new InMemoryPeerNotebookRepository(),
    });
    const client = new Client(
      { name: "peer-notebook-e2e-client", version: "1.0.0" },
      { capabilities: {} },
    );
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      const seeded = parseToolJson<{
        artifact: { id: string; workspaceId: string; content: string };
      }>(await client.callTool({
        name: "thoughtbox_peer_notebook",
        arguments: {
          operation: "peer_artifact_seed",
          text: "First claim. Second claim.",
          name: "input.txt",
        },
      }));

      expect(seeded.artifact.workspaceId).toBe("workspace_peer_e2e");
      expect(seeded.artifact.content).toBe("First claim. Second claim.");

      const invoked = parseToolJson<{
        invocationId: string;
        result: { claimsArtifactId: string; claimCount: number };
        artifactRefs: Array<{ artifactId: string; name: string }>;
      }>(await client.callTool({
        name: "thoughtbox_peer_notebook",
        arguments: {
          operation: "peer_invoke",
          peerId: "claim-extractor",
          tool: "extract_claims",
          args: { textArtifactId: seeded.artifact.id },
        },
      }));

      expect(invoked.result).toEqual({
        claimsArtifactId: expect.any(String),
        claimCount: 2,
      });
      const claimsArtifactId = invoked.result.claimsArtifactId;
      expect(invoked.artifactRefs).toEqual([
        expect.objectContaining({
          artifactId: claimsArtifactId,
          name: "claims.json",
        }),
      ]);

      const traced = parseToolJson<{
        events: Array<{ eventType: string; attrs: { target?: string } }>;
      }>(await client.callTool({
        name: "thoughtbox_peer_notebook",
        arguments: {
          operation: "peer_list_trace_events",
          invocationId: invoked.invocationId,
        },
      }));

      expect(traced.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: "denied_outbound_call",
            attrs: { target: "thoughtbox.knowledge.queryGraph" },
          }),
        ]),
      );

      const invalid = await client.callTool({
        name: "thoughtbox_peer_notebook",
        arguments: {
          operation: "peer_invoke",
          peerId: "claim-extractor",
          tool: "extract_claims",
          args: {},
        },
      });
      const invalidPayload = parseToolJson<{
        error: string;
        code: string;
        details: { errors: string[] };
      }>(invalid);

      expect(invalid.isError).toBe(true);
      expect(invalidPayload.code).toBe("invalid_args");
      expect(invalidPayload.details.errors).toEqual(expect.any(Array));
    } finally {
      await Promise.allSettled([client.close(), server.close()]);
      restoreEnv("SUPABASE_URL", previousSupabaseUrl);
      restoreEnv("SUPABASE_SERVICE_ROLE_KEY", previousSupabaseServiceKey);
    }
  });

  it("uses Supabase peer storage when the workspace is resolved from THOUGHTBOX_PROJECT", async () => {
    const previousProject = process.env.THOUGHTBOX_PROJECT;
    const previousSupabaseUrl = process.env.SUPABASE_URL;
    const previousSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const messages: string[] = [];
    const logger = {
      ...silentLogger,
      info: (...args: unknown[]) => {
        messages.push(args.join(" "));
      },
    };

    process.env.THOUGHTBOX_PROJECT = "11111111-1111-4111-8111-111111111111";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    const server = await createMcpServer({
      storage: new InMemoryStorage(),
      logger,
    });

    try {
      expect(messages).toContain("Peer notebook tool using Supabase-backed repository");
    } finally {
      await server.close();
      restoreEnv("THOUGHTBOX_PROJECT", previousProject);
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

function parseToolJson<T>(result: CallToolResult): T {
  const text = result.content.find(item => item.type === "text")?.text;
  expect(text).toBeDefined();
  return JSON.parse(text as string) as T;
}
