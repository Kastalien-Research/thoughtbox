import { z } from "zod";
import { SessionHandler } from "./index.js";

const KeyMomentSchema = z.object({
  thoughtNumber: z.number().describe("The thought number of this key moment"),
  type: z.enum(["decision", "pivot", "insight", "revision", "branch"]).describe("Type of key moment"),
  significance: z.number().optional().describe("Significance rating 1-10"),
  summary: z.string().optional().describe("Brief summary of why this moment is significant"),
});

export const sessionToolInputSchema = z.object({
  operation: z.enum([
    "session_list", "session_get", "session_search", "session_resume",
    "session_resume_latest", "session_query_thoughts", "session_export",
    "session_analyze", "session_extract_learnings",
  ]),
  sessionId: z.string().optional().describe("Session ID for get/resume/export/analyze/extract_learnings"),
  limit: z.number().optional().describe("Maximum results to return"),
  offset: z.number().optional().describe("Pagination offset for list"),
  tags: z.array(z.string()).optional().describe("Filter by tags for list"),
  query: z.string().optional().describe("Search query for search"),
  type: z.string().optional().describe("query_thoughts: cipher char (H/E/C/Q/R/P/O/A/X) or thoughtType name"),
  start: z.number().optional().describe("query_thoughts: inclusive range start"),
  end: z.number().optional().describe("query_thoughts: inclusive range end"),
  referencesThought: z.number().optional().describe("query_thoughts: find thoughts referencing S{n}"),
  revisionsOf: z.number().optional().describe("query_thoughts: revision history for thought n"),
  format: z.enum(["markdown", "cipher", "json"]).optional().describe("Export format"),
  includeMetadata: z.boolean().optional().describe("Include metadata in export"),
  resolveAnchors: z.boolean().optional().describe("Resolve cross-session anchors in export"),
  keyMoments: z.array(KeyMomentSchema).optional().describe("Key moments for extract_learnings"),
  targetTypes: z.array(z.enum(["pattern", "anti-pattern", "signal"])).optional().describe("Learning types to extract"),
});

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
