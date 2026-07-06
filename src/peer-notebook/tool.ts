import { z } from "zod";
import { PeerNotebookHandler } from "./handler.js";
import type { JsonObject } from "./types.js";

const operationSchema = z.enum([
  "peer_artifact_seed",
  "peer_invoke",
  "peer_get_invocation",
  "peer_list_trace_events",
  "peer_get_artifact",
  "peer_manifest_create",
  "peer_manifest_approve",
  "peer_manifest_reject",
  "peer_manifest_list",
  "peer_graduate_notebook",
]);

export const peerNotebookToolInputSchema = z.object({
  operation: operationSchema,
  text: z.string().optional().describe("Text content for peer_artifact_seed"),
  name: z.string().optional().describe("Optional artifact name for peer_artifact_seed"),
  peerId: z.string().optional().describe("Peer id for peer_invoke and peer_manifest_list"),
  tool: z.string().optional().describe("Exposed peer tool name for peer_invoke"),
  args: z.record(z.unknown()).optional().describe("JSON arguments for peer_invoke"),
  invocationId: z.string().optional().describe("Invocation id for invocation and trace reads"),
  artifactId: z.string().optional().describe("Artifact id for peer_get_artifact"),
  manifestJson: z.string().optional().describe("peer.manifest.json content for peer_manifest_create; stored as a draft"),
  displayName: z.string().optional().describe("Optional display name when peer_manifest_create or peer_graduate_notebook registers a new peer"),
  description: z.string().optional().describe("Optional description when peer_manifest_create or peer_graduate_notebook registers a new peer"),
  manifestId: z.string().optional().describe("Manifest id for peer_manifest_approve and peer_manifest_reject"),
  notebookId: z.string().optional().describe("Notebook id for peer_graduate_notebook; the notebook must contain one code cell named peer.manifest.json whose text is the manifest JSON"),
});

export type PeerNotebookToolInput = z.infer<typeof peerNotebookToolInputSchema>;

export const PEER_NOTEBOOK_TOOL = {
  name: "thoughtbox_peer_notebook",
  description: "Brokered MCP peer notebook surface. Seeds text artifacts, invokes peers on the development-only local-process runtime (the builtin claim-extractor plus graduated notebook peers such as contradiction-scan, whose own code cells execute from the graduation snapshot), manages the draft-to-active manifest lifecycle, graduates notebooks into draft peer manifests, and reads invocations, traces, and artifacts.",
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

      case "peer_manifest_create":
        return this.handler.createManifestDraft({
          manifestJson: requiredString(input.manifestJson, "manifestJson", input.operation),
          displayName: input.displayName,
          description: input.description,
        });

      case "peer_manifest_approve":
        return this.handler.approveManifest(
          requiredString(input.manifestId, "manifestId", input.operation),
        );

      case "peer_manifest_reject":
        return this.handler.rejectManifest(
          requiredString(input.manifestId, "manifestId", input.operation),
        );

      case "peer_manifest_list":
        return this.handler.listManifests(
          requiredString(input.peerId, "peerId", input.operation),
        );

      case "peer_graduate_notebook":
        return this.handler.graduateNotebook({
          notebookId: requiredString(input.notebookId, "notebookId", input.operation),
          displayName: input.displayName,
          description: input.description,
        });
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
