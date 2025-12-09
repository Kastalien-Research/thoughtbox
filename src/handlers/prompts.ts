
import { GetPromptRequest } from "@modelcontextprotocol/sdk/types.js";
import {
  LIST_MCP_ASSETS_PROMPT,
  getListMcpAssetsContent,
  INTERLEAVED_THINKING_PROMPT,
  getInterleavedThinkingContent,
} from "../prompts/index.js";

export async function handleListPrompts() {
  return {
    prompts: [LIST_MCP_ASSETS_PROMPT, INTERLEAVED_THINKING_PROMPT],
  };
}

export async function handleGetPrompt(request: GetPromptRequest) {
  if (request.params.name === "list_mcp_assets") {
    return {
      description: LIST_MCP_ASSETS_PROMPT.description,
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: getListMcpAssetsContent(),
          },
        },
      ],
    };
  }

  if (request.params.name === "interleaved-thinking") {
    // Extract arguments - MCP spec says arguments values are always strings
    const args = request.params.arguments ?? {};
    const task = args.task;
    
    if (!task) {
      throw new Error("Missing required argument 'task'");
    }

    // Convert string arguments to proper types
    const thoughts_limit = args.thoughts_limit 
      ? parseInt(args.thoughts_limit, 10) 
      : undefined;
    const clear_folder = args.clear_folder === "true";

    // Get the prompt content with variable substitution
    const content = getInterleavedThinkingContent({
      task: String(task),
      thoughts_limit,
      clear_folder,
    });

    return {
      description: INTERLEAVED_THINKING_PROMPT.description,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: content,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${request.params.name}`);
}
