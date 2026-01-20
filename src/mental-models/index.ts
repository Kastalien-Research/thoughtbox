/**
 * Mental Models Toolhost
 *
 * Provides structured reasoning prompts through a toolhost pattern.
 * Infrastructure for cognition, not intelligence - the server serves
 * process scaffolds that tell agents HOW to think, not WHAT to think.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  MENTAL_MODELS,
  TAG_DEFINITIONS,
  MENTAL_MODELS_OPERATIONS,
  getModelNames,
  getTagNames,
  getModel,
  getModelsByTag,
  generateToolDescription,
  getOperationsCatalog,
  getModelCount,
} from "./operations.js";
import {
  GetModelResponse,
  ListModelsResponse,
  ListTagsResponse,
} from "./types.js";

/**
 * Mental Models Handler
 */
export class MentalModelsHandler {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(os.homedir(), ".thoughtbox", "mental-models");
  }

  /**
   * Sync embedded mental models to filesystem for inspection
   * Creates tag directories and writes model files
   * URI: thoughtbox://mental-models/{tag}/{model} → ~/.thoughtbox/mental-models/{tag}/{model}.md
   */
  async syncToFilesystem(): Promise<void> {
    // Create base directory
    await fs.promises.mkdir(this.baseDir, { recursive: true });

    // Create tag directories and write models
    for (const tag of TAG_DEFINITIONS) {
      const tagDir = path.join(this.baseDir, tag.name);
      await fs.promises.mkdir(tagDir, { recursive: true });

      // Write each model that has this tag
      const modelsWithTag = getModelsByTag(tag.name);
      for (const model of modelsWithTag) {
        const filePath = path.join(tagDir, `${model.name}.md`);

        // Build file content with frontmatter
        const content = `---
name: ${model.name}
title: ${model.title}
tags: [${model.tags.join(", ")}]
uri: thoughtbox://mental-models/${tag.name}/${model.name}
---

${model.content}`;

        await fs.promises.writeFile(filePath, content, "utf-8");
      }
    }
  }

  /**
   * Process a mental_models tool call
   */
  async processTool(
    operation: string,
    args: Record<string, any>
  ): Promise<{
    content: Array<{ type: string; text?: string; resource?: any }>;
    isError?: boolean;
  }> {
    try {
      switch (operation) {
        case "get_model":
          return this.handleGetModel(args.model);
        case "list_models":
          return this.handleListModels(args.tag, args.tags);
        case "list_tags":
          return this.handleListTags();
        case "get_capability_graph":
          return this.handleGetCapabilityGraph();
        default:
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `Unknown operation: ${operation}`,
                    availableOperations: MENTAL_MODELS_OPERATIONS.map(
                      (op) => op.name
                    ),
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle get_model operation
   */
  private handleGetModel(modelName: string): {
    content: Array<{ type: string; text?: string; resource?: any }>;
    isError?: boolean;
  } {
    if (!modelName) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "Model name is required",
                availableModels: getModelNames(),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const model = getModel(modelName);
    if (!model) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: `Model not found: ${modelName}`,
                availableModels: getModelNames(),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const response: GetModelResponse = {
      name: model.name,
      title: model.title,
      tags: model.tags,
      content: model.content,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Handle list_models operation
   */
  private handleListModels(tag?: string, tags?: string[]): {
    content: Array<{ type: string; text?: string; resource?: any }>;
    isError?: boolean;
  } {
    let models = MENTAL_MODELS;

    // Prefer tags array over single tag (backward compatibility)
    const filterTags = tags || (tag ? [tag] : undefined);

    if (filterTags && filterTags.length > 0) {
      // Validate all tags exist
      const invalidTags = filterTags.filter(t => !getTagNames().includes(t));
      if (invalidTags.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: `Unknown tags: ${invalidTags.join(", ")}`,
                  availableTags: getTagNames(),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Filter models that have ALL specified tags (AND logic)
      models = MENTAL_MODELS.filter(m =>
        filterTags.every(tagName => m.tags.includes(tagName))
      );
    }

    const response: ListModelsResponse = {
      models: models.map((m) => ({
        name: m.name,
        title: m.title,
        description: m.description,
        tags: m.tags,
      })),
      count: models.length,
      filter: filterTags,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Handle list_tags operation
   */
  private handleListTags(): {
    content: Array<{ type: string; text?: string; resource?: any }>;
    isError?: boolean;
  } {
    const response: ListTagsResponse = {
      tags: TAG_DEFINITIONS,
      count: TAG_DEFINITIONS.length,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Handle get_capability_graph operation
   * Returns a structured representation of the Thoughtbox capability hierarchy
   * for initializing a knowledge graph
   */
  private handleGetCapabilityGraph(): {
    content: Array<{ type: string; text?: string; resource?: any }>;
    isError?: boolean;
  } {
    // Build entities for the capability graph
    const entities = [
      // Root entity
      {
        name: "thoughtbox_server",
        entityType: "mcp_server",
        observations: [
          "Thoughtbox MCP server providing cognitive enhancement tools for LLM agents",
          "Provides infrastructure for structured reasoning, not intelligence",
          "Contains tools: thoughtbox, notebook, mental_models, memory_*",
        ],
      },
      // Main tools
      {
        name: "thoughtbox_tool",
        entityType: "tool",
        observations: [
          "Sequential thinking tool supporting multiple reasoning patterns",
          "Patterns: forward thinking, backward thinking, branching, revision, interleaved",
          "Parameters: thought, thoughtNumber, totalThoughts, nextThoughtNeeded",
          "Optional: isRevision, revisesThought, branchFromThought, branchId, includeGuide",
        ],
      },
      {
        name: "notebook_tool",
        entityType: "toolhost",
        observations: [
          "Notebook toolhost for literate programming with JavaScript/TypeScript",
          "Operations: create, list, load, add_cell, update_cell, run_cell, install_deps, list_cells, get_cell, export",
          "Supports templates like sequential-feynman",
        ],
      },
      {
        name: "mental_models_tool",
        entityType: "toolhost",
        observations: [
          "Mental models toolhost providing structured reasoning prompts",
          "Operations: get_model, list_models, list_tags, get_capability_graph",
          `Contains ${MENTAL_MODELS.length} mental models across ${TAG_DEFINITIONS.length} tags`,
        ],
      },
      {
        name: "memory_tools",
        entityType: "tool_group",
        observations: [
          "Knowledge graph memory tools for persistent storage",
          "Tools: memory_create_entities, memory_create_relations, memory_add_observations",
          "Tools: memory_delete_entities, memory_delete_observations, memory_delete_relations",
          "Tools: memory_read_graph, memory_search_nodes, memory_open_nodes",
        ],
      },
      // Tags as entities
      ...TAG_DEFINITIONS.map((tag) => ({
        name: `tag_${tag.name}`,
        entityType: "tag",
        observations: [
          tag.description,
          `Models with this tag: ${getModelsByTag(tag.name)
            .map((m) => m.name)
            .join(", ")}`,
        ],
      })),
      // Mental models as entities
      ...MENTAL_MODELS.map((model) => ({
        name: `model_${model.name}`,
        entityType: "mental_model",
        observations: [
          model.title,
          model.description,
          `Tags: ${model.tags.join(", ")}`,
        ],
      })),
    ];

    // Build relations
    const relations = [
      // Tool hierarchy
      {
        from: "thoughtbox_server",
        to: "thoughtbox_tool",
        relationType: "provides",
      },
      {
        from: "thoughtbox_server",
        to: "notebook_tool",
        relationType: "provides",
      },
      {
        from: "thoughtbox_server",
        to: "mental_models_tool",
        relationType: "provides",
      },
      {
        from: "thoughtbox_server",
        to: "memory_tools",
        relationType: "provides",
      },
      // Mental models to tags
      ...MENTAL_MODELS.flatMap((model) =>
        model.tags.map((tag) => ({
          from: `model_${model.name}`,
          to: `tag_${tag}`,
          relationType: "tagged_with",
        }))
      ),
      // Models to mental_models_tool
      ...MENTAL_MODELS.map((model) => ({
        from: "mental_models_tool",
        to: `model_${model.name}`,
        relationType: "contains",
      })),
    ];

    const response = {
      description:
        "Capability graph for Thoughtbox MCP server. Use with memory_create_entities and memory_create_relations to initialize your knowledge graph.",
      entities,
      relations,
      usage: {
        step1:
          "Call memory_create_entities with the entities array to create all nodes",
        step2:
          "Call memory_create_relations with the relations array to create all edges",
        step3:
          "Use memory_search_nodes to find relevant tools and models for your task",
      },
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Get operations catalog
   */
  getOperationsCatalog(): string {
    return getOperationsCatalog();
  }
}

/**
 * Mental Models Tool Definition
 */
export const MENTAL_MODELS_TOOL: Tool = {
  name: "mental_models",
  description: generateToolDescription(),
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["get_model", "list_models", "list_tags", "get_capability_graph"],
        description: "The operation to execute",
      },
      args: {
        type: "object",
        description: "Arguments for the operation",
        properties: {
          model: {
            type: "string",
            enum: getModelNames(),
            description: "Name of the mental model to retrieve (for get_model)",
          },
          tag: {
            type: "string",
            enum: getTagNames(),
            description: "Tag to filter models by (for list_models) - DEPRECATED, use tags instead",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
              enum: getTagNames()
            },
            description: "Array of tags to filter models by (for list_models). Returns models matching ALL tags (AND logic).",
          },
        },
      },
    },
    required: ["operation"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Export for convenience
export {
  MENTAL_MODELS,
  TAG_DEFINITIONS,
  getModelNames,
  getTagNames,
} from "./operations.js";

/**
 * Generate resource templates for tag-based URI hierarchy
 *
 * URI pattern: thoughtbox://mental-models/{tag}/{model}
 *
 * This allows browsing models by tag, with the same model
 * addressable via multiple tag paths.
 */
export function getMentalModelsResourceTemplates(): {
  resourceTemplates: Array<{
    uriTemplate: string;
    name: string;
    description: string;
    mimeType: string;
  }>;
} {
  return {
    resourceTemplates: [
      {
        uriTemplate: "thoughtbox://mental-models/{tag}/{model}",
        name: "Mental Model by Tag",
        description: `Browse mental models organized by tag. Available tags: ${getTagNames().join(", ")}. Models can appear under multiple tags.`,
        mimeType: "text/markdown",
      },
      {
        uriTemplate: "thoughtbox://mental-models/{tag}",
        name: "Mental Models Tag Directory",
        description: "List all models under a specific tag",
        mimeType: "application/json",
      },
    ],
  };
}

/**
 * Get static resources for mental models
 */
export function getMentalModelsResources(): Array<{
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}> {
  const resources: Array<{
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  }> = [
    {
      uri: "thoughtbox://mental-models",
      name: "Mental Models Root",
      description: `Root directory: ${getModelCount()} models across ${getTagNames().length} tags`,
      mimeType: "application/json",
    },
  ];

  // Add each tag as a browsable directory
  for (const tag of TAG_DEFINITIONS) {
    const models = getModelsByTag(tag.name);
    resources.push({
      uri: `thoughtbox://mental-models/${tag.name}`,
      name: `Tag: ${tag.name}`,
      description: `${tag.description} (${models.length} models)`,
      mimeType: "application/json",
    });
  }

  return resources;
}

/**
 * Read a mental models resource by URI
 *
 * Supported patterns:
 * - thoughtbox://mental-models - Root directory
 * - thoughtbox://mental-models/{tag} - List models in tag
 * - thoughtbox://mental-models/{tag}/{model} - Get model content
 */
export function getMentalModelsResourceContent(uri: string): {
  uri: string;
  mimeType: string;
  text: string;
} | null {
  // Root directory
  if (uri === "thoughtbox://mental-models") {
    const structure = {
      description: "Mental Models Directory",
      total_models: getModelCount(),
      total_tags: TAG_DEFINITIONS.length,
      tags: TAG_DEFINITIONS.map((tag) => ({
        name: tag.name,
        description: tag.description,
        uri: `thoughtbox://mental-models/${tag.name}`,
        model_count: getModelsByTag(tag.name).length,
      })),
      all_models: MENTAL_MODELS.map((m) => ({
        name: m.name,
        title: m.title,
        tags: m.tags,
        uris: m.tags.map((t) => `thoughtbox://mental-models/${t}/${m.name}`),
      })),
    };
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(structure, null, 2),
    };
  }

  // Check for tag directory or model
  const match = uri.match(/^thoughtbox:\/\/mental-models\/([^/]+)(?:\/(.+))?$/);
  if (!match) return null;

  const [, tagName, modelName] = match;

  // Validate tag
  if (!getTagNames().includes(tagName)) {
    return null;
  }

  // Tag directory listing
  if (!modelName) {
    const models = getModelsByTag(tagName);
    const tagDef = TAG_DEFINITIONS.find((t) => t.name === tagName);
    // Defensive check - should never happen since we validated tagName above
    if (!tagDef) {
      return null;
    }
    const listing = {
      tag: tagName,
      description: tagDef.description,
      uri: `thoughtbox://mental-models/${tagName}`,
      models: models.map((m) => ({
        name: m.name,
        title: m.title,
        description: m.description,
        uri: `thoughtbox://mental-models/${tagName}/${m.name}`,
        all_tags: m.tags,
      })),
      count: models.length,
    };
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(listing, null, 2),
    };
  }

  // Model content
  const model = getModel(modelName);
  if (!model || !model.tags.includes(tagName)) {
    return null;
  }

  // Return the model content as markdown with metadata header
  const content = `---
name: ${model.name}
title: ${model.title}
tags: [${model.tags.join(", ")}]
uri: ${uri}
alternate_uris:
${model.tags.map((t) => `  - thoughtbox://mental-models/${t}/${model.name}`).join("\n")}
---

${model.content}`;

  return {
    uri,
    mimeType: "text/markdown",
    text: content,
  };
}
