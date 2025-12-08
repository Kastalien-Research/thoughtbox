
import { ReadResourceRequest } from "@modelcontextprotocol/sdk/types.js";
import { PATTERNS_COOKBOOK } from "../resources/patterns-cookbook-content.js";
import { SERVER_ARCHITECTURE_GUIDE } from "../resources/server-architecture-content.js";
import { 
    MentalModelsServer, 
    getMentalModelsResources,
    getMentalModelsResourceTemplates,
    getMentalModelsResourceContent 
} from "../mental-models/index.js";
import { 
    KnowledgeServer, 
    getKnowledgeResources,
    getKnowledgeResourceTemplates,
    getKnowledgeResourceContent 
} from "../knowledge/index.js";
import { NotebookServer } from "../notebook/index.js";
import { 
    getInterleavedResourceTemplates,
    getInterleavedGuideForUri 
} from "../prompts/index.js";
import { KnowledgeStorage } from "../persistence/index.js";

export async function handleListResources() {
    return {
        resources: [
            {
                uri: "system://status",
                name: "Notebook Server Status",
                description: "Health snapshot of the notebook server",
                mimeType: "application/json",
            },
            {
                uri: "thoughtbox://notebook/operations",
                name: "Notebook Operations Catalog",
                description: "Complete catalog of notebook operations with schemas and examples",
                mimeType: "application/json",
            },
            {
                uri: "thoughtbox://patterns-cookbook",
                name: "Thoughtbox Patterns Cookbook",
                description: "Guide to core reasoning patterns for thoughtbox tool",
                mimeType: "text/markdown",
            },
            {
                uri: "thoughtbox://architecture",
                name: "Server Architecture Guide",
                description: "Interactive notebook explaining Thoughtbox MCP server architecture and implementation patterns",
                mimeType: "text/markdown",
            },
            {
                uri: "thoughtbox://mental-models/operations",
                name: "Mental Models Operations Catalog",
                description: "Complete catalog of mental models, tags, and operations",
                mimeType: "application/json",
            },
            // Mental models browsable hierarchy
            ...getMentalModelsResources(),
            // Knowledge Zone resources
            ...getKnowledgeResources(),
        ],
    };
}

export async function handleListResourceTemplates() {
    const interleavedTemplates = getInterleavedResourceTemplates();
    const mentalModelsTemplates = getMentalModelsResourceTemplates();
    const knowledgeTemplates = getKnowledgeResourceTemplates();
    return {
        resourceTemplates: [
            ...interleavedTemplates.resourceTemplates,
            ...mentalModelsTemplates.resourceTemplates,
            ...knowledgeTemplates.resourceTemplates,
        ],
    };
}

export async function handleReadResource(
    request: ReadResourceRequest,
    services: {
        notebook: NotebookServer;
        mentalModels: MentalModelsServer;
        knowledge: KnowledgeServer;
        knowledgeStorage: KnowledgeStorage;
    }
) {
    const uri = request.params.uri;

    if (uri === "system://status") {
      const status = services.notebook.getStatus();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }

    if (uri === "thoughtbox://notebook/operations") {
      const catalog = services.notebook.getOperationsCatalog();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: catalog,
          },
        ],
      };
    }

    if (uri === "thoughtbox://patterns-cookbook") {
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: PATTERNS_COOKBOOK,
          },
        ],
      };
    }

    if (uri === "thoughtbox://architecture") {
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: SERVER_ARCHITECTURE_GUIDE,
          },
        ],
      };
    }

    if (uri === "thoughtbox://mental-models/operations") {
      const catalog = services.mentalModels.getOperationsCatalog();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: catalog,
          },
        ],
      };
    }

    // Handle mental models browsable hierarchy
    if (uri.startsWith("thoughtbox://mental-models")) {
      const content = getMentalModelsResourceContent(uri);
      if (content) {
        return {
          contents: [content],
        };
      }
    }

    // Handle interleaved thinking resource templates
    if (uri.startsWith("thoughtbox://interleaved/")) {
      try {
        const resource = getInterleavedGuideForUri(uri);
        return {
          contents: [resource],
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Handle knowledge zone resources
    if (uri === "thoughtbox://knowledge/operations") {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: services.knowledge.getOperationsCatalog(),
          },
        ],
      };
    }

    if (uri.startsWith("thoughtbox://knowledge")) {
      const content = await getKnowledgeResourceContent(uri, services.knowledgeStorage);
      if (content) {
        return {
          contents: [content],
        };
      }
    }

    throw new Error(`Unknown resource: ${uri}`);
}
