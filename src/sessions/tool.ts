import { z } from "zod";
import { SessionHandler } from "./index.js";

// Schemas for the key moments parameters in exact matching with previous behavior
const KeyMomentSchema = z.object({
  thoughtNumber: z.number().describe("The thought number of this key moment"),
  type: z.enum(["decision", "pivot", "insight", "revision", "branch"]).describe("Type of key moment"),
  significance: z.number().optional().describe("Significance rating 1-10"),
  summary: z.string().optional().describe("Brief summary of why this moment is significant"),
});

export const sessionToolInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("session_list"),
    limit: z.number().optional().describe("Maximum number of sessions to return (default: 10)"),
    offset: z.number().optional().describe("Number of sessions to skip for pagination (default: 0)"),
    tags: z.array(z.string()).optional().describe("Filter by tags (returns sessions matching ANY tag)"),
  }),
  z.object({
    operation: z.literal("session_get"),
    sessionId: z.string().describe("The ID of the session to retrieve"),
  }),
  z.object({
    operation: z.literal("session_search"),
    query: z.string().describe("The search query (matches title or tags)"),
    limit: z.number().optional().describe("Maximum number of results to return (default: 10)"),
  }),
  z.object({
    operation: z.literal("session_resume"),
    sessionId: z.string().describe("The ID of the session to resume"),
  }),
  z.object({
    operation: z.literal("session_export"),
    sessionId: z.string().describe("The ID of the session to export"),
    format: z.enum(["markdown", "cipher", "json"]).optional().describe("Export format: 'markdown' (readable), 'cipher' (compressed), 'json' (structured). Default: markdown"),
    includeMetadata: z.boolean().optional().describe("Include session metadata (title, tags, timestamps) in export. Default: true"),
    resolveAnchors: z.boolean().optional().describe("Resolve cross-session anchors if true. Default: true"),
  }),
  z.object({
    operation: z.literal("session_analyze"),
    sessionId: z.string().describe("The ID of the session to analyze"),
  }),
  z.object({
    operation: z.literal("session_extract_learnings"),
    sessionId: z.string().describe("The ID of the session to extract learnings from"),
    keyMoments: z.array(KeyMomentSchema).optional().describe("Key moments identified by the client (required for pattern extraction)"),
    targetTypes: z.array(z.enum(["pattern", "anti-pattern", "signal"])).optional().describe("Types of learnings to extract. 'signal' is generated automatically; 'pattern' and 'anti-pattern' require keyMoments."),
  }),
  z.object({
    operation: z.literal("session_discovery"),
    action: z.enum(["list", "hide", "show"]).describe("Action to perform: 'list' shows all discovered tools, 'hide' hides a tool, 'show' re-enables a hidden tool"),
    toolName: z.string().optional().describe("Name of the tool to hide or show (required for hide/show actions)"),
  })
]);

export type SessionToolInput = z.infer<typeof sessionToolInputSchema>;

export const SESSION_TOOL = {
  name: "thoughtbox_session",
  description: "Toolhost for managing Thoughtbox reasoning sessions. List, search, retrieve, resume, export, analyze, and extract learnings from sessions.",
  inputSchema: sessionToolInputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class SessionTool {
  constructor(private handler: SessionHandler) {}

  async handle(input: SessionToolInput) {
    const { operation, ...args } = input;
    const strippedOp = operation.replace("session_", "");
    
    return this.handler.processTool(strippedOp, args);
  }
}
