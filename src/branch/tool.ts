import { z } from "zod";
import type { BranchHandler } from "./index.js";

export const branchToolInputSchema = z.object({
  operation: z.enum([
    "branch_spawn", "branch_merge", "branch_list", "branch_get",
  ]),
  sessionId: z.string().describe("Session ID"),
  branchId: z.string().optional().describe("Branch identifier"),
  description: z.string().optional().describe("Branch description"),
  branchFromThought: z.number().optional().describe(
    "Main-track thought number to branch from"
  ),
  synthesis: z.string().optional().describe("Merge synthesis text"),
  selectedBranchId: z.string().optional().describe(
    "Branch to select for 'selected' resolution"
  ),
  resolution: z.enum(["selected", "synthesized", "abandoned"]).optional()
    .describe("How to resolve branches on merge"),
});

export type BranchToolInput = z.infer<typeof branchToolInputSchema>;

export const BRANCH_TOOL = {
  name: "thoughtbox_branch",
  description:
    "Toolhost for managing reasoning branches. " +
    "Spawn parallel explorations, merge results, list and inspect branches.",
  inputSchema: branchToolInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

export class BranchTool {
  constructor(private handler: BranchHandler) {}

  async handle(input: BranchToolInput) {
    const { operation, ...args } = input;
    const strippedOp = operation.replace("branch_", "");
    return this.handler.processTool(strippedOp, args);
  }
}
