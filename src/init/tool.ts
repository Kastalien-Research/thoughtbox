import { z } from "zod";
import { InitToolHandler } from "./tool-handler.js";

export const initToolInputSchema = z.object({
  operation: z.enum([
    "get_state", "list_sessions", "navigate", "load_context",
    "start_new", "list_roots", "bind_root", "cipher",
  ]),
  filters: z.object({
    project: z.string().optional(),
    task: z.string().optional(),
    aspect: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().default(20),
  }).optional().describe("Filtering for list_sessions"),
  target: z.object({
    project: z.string().optional(),
    task: z.string().optional(),
    aspect: z.string().optional(),
  }).optional().describe("Target coordinates for navigate"),
  sessionId: z.string().optional().describe("Session ID for load_context"),
  project: z.string().optional().describe("Project name for start_new"),
  task: z.string().optional().describe("Task for start_new"),
  aspect: z.string().optional().describe("Aspect for start_new"),
  domain: z.string().optional().describe("Reasoning domain for start_new"),
  rootUri: z.string().optional().describe("Root URI for bind_root"),
  mode: z.string().optional().describe("Cipher mode override"),
});

export type InitToolInput = z.infer<typeof initToolInputSchema>;

export const INIT_TOOL = {
  name: "thoughtbox_init",
  description: "Initialize and navigate Thoughtbox sessions, load context, or manage project bounds.",
  inputSchema: initToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class InitTool {
  constructor(private handler: InitToolHandler, private cipherHandler: (args: any) => Promise<any>) {}

  async handle(input: InitToolInput) {
    if (input.operation === "cipher") {
      return this.cipherHandler(input);
    }
    return this.handler.handle(input as any);
  }
}
