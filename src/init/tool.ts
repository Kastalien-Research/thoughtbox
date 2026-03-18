import { z } from "zod";
import { InitToolHandler } from "./tool-handler.js";

export const initToolInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("get_state"),
  }),
  z.object({
    operation: z.literal("list_sessions"),
    filters: z
      .object({
        project: z.string().optional(),
        task: z.string().optional(),
        aspect: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(20),
      })
      .optional()
      .describe("Optional filtering by project, task, aspect, or search text"),
  }),
  z.object({
    operation: z.literal("navigate"),
    target: z.object({
      project: z.string().optional(),
      task: z.string().optional(),
      aspect: z.string().optional(),
    }).describe("Target coordinates. Shows related sessions and available sub-levels."),
  }),
  z.object({
    operation: z.literal("load_context"),
    sessionId: z.string().describe("The ID of the session to load"),
  }),
  z.object({
    operation: z.literal("start_new"),
    project: z.string().optional().describe("Project name (auto-derived from bound root if not provided)"),
    task: z.string().optional().describe("Task within the project"),
    aspect: z.string().optional().describe("Specific aspect of the task"),
    domain: z
      .string()
      .optional()
      .describe("Reasoning domain (e.g., 'debugging', 'planning', 'architecture') - unlocks domain-specific mental models"),
  }),
  z.object({
    operation: z.literal("list_roots"),
  }),
  z.object({
    operation: z.literal("bind_root"),
    rootUri: z.string().describe("URI of the MCP root to bind (e.g., 'file:///path/to/project')"),
  }),
  z.object({
    operation: z.literal("cipher"),
    mode: z.string().optional().describe("Optional mode specific overriding of the cipher (e.g., 'test' or 'compact')"),
  })
]);

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
    
    // Convert discriminated union to flat args for legacy handler compatibility where needed
    const { operation, ...args } = input;
    
    // Build expected nested structures for init handler
    let builtArgs: any = { operation };
    
    if (operation === "list_sessions") {
      builtArgs.filters = (input as any).filters;
    } else if (operation === "navigate") {
      builtArgs.target = (input as any).target;
    } else if (operation === "load_context") {
      builtArgs.sessionId = (input as any).sessionId;
    } else if (operation === "start_new") {
      builtArgs.project = (input as any).project;
      builtArgs.task = (input as any).task;
      builtArgs.aspect = (input as any).aspect;
      builtArgs.domain = (input as any).domain;
    } else if (operation === "bind_root") {
      builtArgs.rootUri = (input as any).rootUri;
    }
    
    return this.handler.handle(builtArgs);
  }
}
