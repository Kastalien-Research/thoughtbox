/**
 * Thoughtbox MCP Server - Core Module
 * 
 * This module exports the MCP server factory function used by http.ts.
 * Transport: Streamable HTTP only (WebSocket support planned for future).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  CallToolRequest,
  ReadResourceRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { NotebookServer } from "./notebook/index.js";
import { MentalModelsServer } from "./mental-models/index.js";
import { KnowledgeServer } from "./knowledge/index.js";
import { KnowledgeStorage } from "./persistence/index.js";
import { ThoughtboxServer } from "./thinking/index.js";
import { handleListTools, handleCallTool } from "./handlers/tools.js";
import { handleListPrompts, handleGetPrompt } from "./handlers/prompts.js";
import {
  handleListResources,
  handleListResourceTemplates,
  handleReadResource,
} from "./handlers/resources.js";

// Configuration schema for Smithery
export const configSchema = z.object({
  disableThoughtLogging: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Disable thought output to stderr (useful for production deployments)"
    ),
});


// Exported server creation function for Smithery HTTP transport
export default async function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new Server(
    {
      name: "thoughtbox-server",
      version: "1.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
        resourceTemplates: {},
      },
    }
  );

  const thinkingServer = new ThoughtboxServer(config.disableThoughtLogging);
  const notebookServer = new NotebookServer();
  const mentalModelsServer = new MentalModelsServer();
  const knowledgeServer = new KnowledgeServer();
  const knowledgeStorage = new KnowledgeStorage();

  // Initialize persistence layer
  try {
    await thinkingServer.initialize();
    console.error("Persistence layer initialized");
  } catch (err) {
    console.error("Failed to initialize persistence layer:", err);
    // Continue without persistence - in-memory mode
  }

  // Initialize knowledge server
  try {
    await knowledgeServer.initialize();
    await knowledgeStorage.initialize();
    console.error("Knowledge Zone initialized");
  } catch (err) {
    console.error("Failed to initialize Knowledge Zone:", err);
  }

  // Sync mental models to filesystem for inspection
  mentalModelsServer.syncToFilesystem().catch((err) => {
    console.error("Failed to sync mental models to filesystem:", err);
  });

  // Register handlers using extracted functions
  server.setRequestHandler(ListToolsRequestSchema, handleListTools);

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) =>
    handleCallTool(request, {
      thinking: thinkingServer,
      notebook: notebookServer,
      mentalModels: mentalModelsServer,
      knowledge: knowledgeServer,
    })
  );

  server.setRequestHandler(ListPromptsRequestSchema, handleListPrompts);

  server.setRequestHandler(GetPromptRequestSchema, handleGetPrompt);

  server.setRequestHandler(ListResourcesRequestSchema, handleListResources);

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    handleListResourceTemplates
  );

  server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) =>
    handleReadResource(request, {
      notebook: notebookServer,
      mentalModels: mentalModelsServer,
      knowledge: knowledgeServer,
      knowledgeStorage,
    })
  );

  return server;
}
