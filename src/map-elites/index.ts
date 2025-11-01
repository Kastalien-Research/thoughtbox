import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { EliteArchive } from "./archive.js";
import { Visualizer } from "./visualizer.js";
import {
  CreateArchiveArgs,
  ProposeSolutionArgs,
  GetEliteArgs,
  GetMapStateArgs,
  GetEmptyNichesArgs,
  GetNeighborsArgs,
  CreateArchiveResponse,
  ProposeSolutionResponse,
  GetEliteResponse,
  GetMapStateResponse,
  GetEmptyNichesResponse,
  GetNeighborsResponse,
} from "./types.js";

export const MAP_ELITES_TOOL: Tool = {
  name: "map_elites",
  description: `A structured workspace for population-based exploration using Quality Diversity algorithms.

This tool provides a multi-dimensional elite archive for illuminating behavior spaces.
Acts as state manager (a "notebook") for QD algorithms like MAP-Elites, Novelty Search, etc.

**CRITICAL: This is NOT an evaluator or optimizer. You (the LLM) must:**
- Define behavioral dimensions that characterize solutions
- Generate/mutate solutions
- Evaluate behavioral characteristics of each solution
- Evaluate performance/fitness of each solution
- Run the exploration loop (selection, variation, evaluation)

**The server ONLY:**
- Validates input schema
- Manages the elite archive state (N-dimensional map)
- Compares: IF new_performance > current_elite_performance THEN replace
- Returns archive state and coverage statistics

**Use cases:**
- Generating diverse creative content (prompts, stories, designs)
- Exploring solution spaces (algorithms, architectures, configurations)
- Multi-objective optimization with behavioral constraints
- Discovering stepping stones to hard-to-reach solutions
- Understanding trade-offs between competing objectives

**Operations:**
- create_archive: Initialize a new elite archive with specified dimensions
- propose_solution: Submit a solution for potential inclusion in archive
- get_elite: Retrieve the elite solution at specific coordinates
- get_map_state: Get archive overview with coverage statistics
- get_empty_niches: Find unexplored regions of behavior space
- get_neighbors: Get elite solutions near given coordinates

See the map://algorithms resource for detailed guide on Quality Diversity algorithms.`,

  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: [
          "create_archive",
          "propose_solution",
          "get_elite",
          "get_map_state",
          "get_empty_niches",
          "get_neighbors",
        ],
        description: "The operation to perform",
      },
      args: {
        type: "object",
        description:
          "Arguments for the operation (schema varies by operation)",
      },
    },
    required: ["operation"],
  },
  annotations: {
    audience: ["assistant"],
    priority: 0.75,
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

/**
 * MapElitesServer manages multiple elite archives for Quality Diversity algorithms
 */
export class MapElitesServer {
  private archives: Map<string, EliteArchive>;
  private visualizer: Visualizer;
  private disableLogging: boolean;

  constructor(disableLogging: boolean = false) {
    this.archives = new Map();
    this.visualizer = new Visualizer();
    this.disableLogging = disableLogging;
  }

  /**
   * Main tool dispatcher - routes operations to appropriate handlers
   */
  processTool(
    operation: string,
    args: any
  ): { content: Array<any>; isError?: boolean } {
    try {
      switch (operation) {
        case "create_archive":
          return this.createArchive(args as CreateArchiveArgs);
        case "propose_solution":
          return this.proposeSolution(args as ProposeSolutionArgs);
        case "get_elite":
          return this.getElite(args as GetEliteArgs);
        case "get_map_state":
          return this.getMapState(args as GetMapStateArgs);
        case "get_empty_niches":
          return this.getEmptyNiches(args as GetEmptyNichesArgs);
        case "get_neighbors":
          return this.getNeighbors(args as GetNeighborsArgs);
        default:
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: `Unknown operation: ${operation}`,
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
                success: false,
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
   * Create a new elite archive
   */
  private createArchive(
    args: CreateArchiveArgs
  ): { content: Array<any>; isError?: boolean } {
    if (!args.dimensions || args.dimensions.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: "dimensions parameter is required and must be non-empty",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const archive = new EliteArchive(
      args.dimensions,
      args.archiveId,
      args.metadata
    );
    this.archives.set(archive.getId(), archive);

    const response: CreateArchiveResponse = {
      success: true,
      archiveId: archive.getId(),
      totalNiches: archive.getTotalNiches(),
      dimensions: archive.getDimensions(),
    };

    if (!this.disableLogging) {
      console.error(
        `\n🗺️  Created MAP-Elites archive: ${archive.getId()}\n` +
          this.visualizer.formatDimensions(args.dimensions) +
          `   Total niches: ${archive.getTotalNiches()}\n`
      );
    }

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
   * Propose a solution to the archive
   */
  private proposeSolution(
    args: ProposeSolutionArgs
  ): { content: Array<any>; isError?: boolean } {
    const archive = this.archives.get(args.archiveId);
    if (!archive) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `Archive not found: ${args.archiveId}`,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const result = archive.propose(
      args.solution,
      args.behavioralCharacteristics,
      args.performance,
      args.metadata
    );

    if (!this.disableLogging) {
      console.error(this.visualizer.formatProposalResult(result));
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Get elite at specific coordinates
   */
  private getElite(
    args: GetEliteArgs
  ): { content: Array<any>; isError?: boolean } {
    const archive = this.archives.get(args.archiveId);
    if (!archive) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `Archive not found: ${args.archiveId}`,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const elite = archive.getElite(args.coordinates);
    const response: GetEliteResponse = {
      success: true,
      elite,
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
   * Get archive state with optional visualization
   */
  private getMapState(
    args: GetMapStateArgs
  ): { content: Array<any>; isError?: boolean } {
    const archive = this.archives.get(args.archiveId);
    if (!archive) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `Archive not found: ${args.archiveId}`,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const response: GetMapStateResponse = {
      success: true,
      archiveId: args.archiveId,
      coverageStats: archive.getCoverageStats(),
      elites: archive.getAllElites(),
      visualization: args.includeVisualization
        ? this.visualizer.generateVisualization(archive)
        : undefined,
    };

    if (!this.disableLogging && args.includeVisualization) {
      console.error(response.visualization);
    }

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
   * Get empty niches (unexplored regions)
   */
  private getEmptyNiches(
    args: GetEmptyNichesArgs
  ): { content: Array<any>; isError?: boolean } {
    const archive = this.archives.get(args.archiveId);
    if (!archive) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `Archive not found: ${args.archiveId}`,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const emptyNiches = archive.getEmptyNiches(args.limit);
    const response: GetEmptyNichesResponse = {
      success: true,
      emptyNiches,
      count: emptyNiches.length,
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
   * Get neighboring elite solutions
   */
  private getNeighbors(
    args: GetNeighborsArgs
  ): { content: Array<any>; isError?: boolean } {
    const archive = this.archives.get(args.archiveId);
    if (!archive) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: `Archive not found: ${args.archiveId}`,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const neighbors = archive.getNeighbors(args.coordinates, args.radius);
    const response: GetNeighborsResponse = {
      success: true,
      neighbors,
      count: neighbors.length,
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
   * Get all archives (for debugging/status)
   */
  getStatus(): any {
    const archives: any[] = [];
    for (const [id, archive] of this.archives) {
      archives.push(archive.getSummary());
    }
    return {
      totalArchives: this.archives.size,
      archives,
    };
  }
}
