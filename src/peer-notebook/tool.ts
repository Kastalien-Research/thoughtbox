import { z } from "zod";
import { PeerNotebookHandler } from "./handler.js";
import type { JsonObject } from "./types.js";

const operationSchema = z.enum([
  "peer_artifact_seed",
  "peer_invoke",
  "peer_get_invocation",
  "peer_list_trace_events",
  "peer_get_artifact",
]);

export const peerNotebookToolInputSchema = z.object({
  operation: operationSchema,
  text: z.string().optional().describe("Text content for peer_artifact_seed"),
  name: z.string().optional().describe("Optional artifact name for peer_artifact_seed"),
  peerId: z.string().optional().describe("Peer id for peer_invoke"),
  tool: z.string().optional().describe("Exposed peer tool name for peer_invoke"),
  args: z.record(z.unknown()).optional().describe("JSON arguments for peer_invoke"),
  invocationId: z.string().optional().describe("Invocation id for invocation and trace reads"),
  artifactId: z.string().optional().describe("Artifact id for peer_get_artifact"),
});

export type PeerNotebookToolInput = z.infer<typeof peerNotebookToolInputSchema>;

export const PEER_NOTEBOOK_TOOL = {
  name: "thoughtbox_peer_notebook",
  description: "Brokered MCP peer notebook pilot surface. Seeds in-memory text artifacts, invokes the mock claim-extractor peer, and reads invocations, traces, and artifacts.",
  inputSchema: peerNotebookToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class PeerNotebookTool {
  constructor(private readonly handler: PeerNotebookHandler) {}

  async handle(input: PeerNotebookToolInput) {
    switch (input.operation) {
      case "peer_artifact_seed":
        return this.handler.seedArtifact({
          text: requiredString(input.text, "text", input.operation),
          name: input.name,
        });

      case "peer_invoke":
        return this.handler.invoke({
          peerId: requiredString(input.peerId, "peerId", input.operation),
          tool: requiredString(input.tool, "tool", input.operation),
          args: requiredJsonObject(input.args, "args", input.operation),
        });

      case "peer_get_invocation":
        return this.handler.getInvocation(
          requiredString(input.invocationId, "invocationId", input.operation),
        );

      case "peer_list_trace_events":
        return this.handler.listTraceEvents(
          requiredString(input.invocationId, "invocationId", input.operation),
        );

      case "peer_get_artifact":
        return this.handler.getArtifact(
          requiredString(input.artifactId, "artifactId", input.operation),
        );
    }
  }
}

function requiredString(value: string | undefined, field: string, operation: string): string {
  if (!value) {
    throw new Error(`${operation} requires '${field}'`);
  }
  return value;
}

function requiredJsonObject(value: Record<string, unknown> | undefined, field: string, operation: string): JsonObject {
  if (!value || Array.isArray(value)) {
    throw new Error(`${operation} requires object '${field}'`);
  }
  return value as JsonObject;
}
