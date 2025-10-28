import { randomUUID } from "crypto";
import {
  BehaviorDimension,
  Solution,
  ArchiveMetadata,
  CoverageStats,
  ProposeSolutionResponse,
} from "./types.js";
import { CoordinateMapper } from "./coordinate-mapper.js";

/**
 * EliteArchive manages a multi-dimensional grid of elite solutions.
 * This is the core data structure for MAP-Elites and other Quality Diversity algorithms.
 */
export class EliteArchive {
  private id: string;
  private dimensions: BehaviorDimension[];
  private elites: Map<string, Solution>;
  private mapper: CoordinateMapper;
  private metadata: ArchiveMetadata;
  private totalNiches: number;

  constructor(
    dimensions: BehaviorDimension[],
    archiveId?: string,
    metadata?: ArchiveMetadata
  ) {
    this.id = archiveId || randomUUID();
    this.dimensions = dimensions;
    this.elites = new Map();
    this.mapper = new CoordinateMapper();
    this.metadata = metadata || {};
    this.totalNiches = this.mapper.calculateTotalNiches(dimensions);

    if (dimensions.length === 0) {
      throw new Error("Archive must have at least one dimension");
    }
  }

  getId(): string {
    return this.id;
  }

  getDimensions(): BehaviorDimension[] {
    return this.dimensions;
  }

  getTotalNiches(): number {
    return this.totalNiches;
  }

  getMetadata(): ArchiveMetadata {
    return this.metadata;
  }

  /**
   * Core MAP-Elites operation: Propose a solution and potentially add it to the archive.
   * THE ONE PIECE OF LOGIC: If performance > current elite performance, replace it.
   *
   * @param solution The solution content (LLM-generated)
   * @param behavioralCharacteristics Continuous behavioral values
   * @param performance Fitness/quality score
   * @param metadata Optional metadata about the solution
   * @returns Response indicating whether solution was accepted
   */
  propose(
    solution: any,
    behavioralCharacteristics: number[],
    performance: number,
    metadata?: any
  ): ProposeSolutionResponse {
    // Validate input
    if (behavioralCharacteristics.length !== this.dimensions.length) {
      return {
        success: false,
        accepted: false,
        coordinates: [],
        reason: `Behavioral characteristics length (${behavioralCharacteristics.length}) must match dimensions length (${this.dimensions.length})`,
        coverageStats: this.getCoverageStats(),
      };
    }

    // Discretize behavioral characteristics to coordinates
    const coordinates = this.mapper.discretizeAll(
      behavioralCharacteristics,
      this.dimensions
    );
    const key = this.mapper.coordinatesToKey(coordinates);

    // Get current elite at these coordinates (if any)
    const currentElite = this.elites.get(key);

    // THE CORE LOGIC: Compare performance
    if (!currentElite || performance > currentElite.performance) {
      // Create new solution object
      const newSolution: Solution = {
        id: randomUUID(),
        content: solution,
        behavioralCharacteristics,
        coordinates,
        performance,
        metadata: {
          generatedAt: Date.now(),
          ...metadata,
        },
      };

      // Replace or add elite
      this.elites.set(key, newSolution);

      // Determine acceptance reason
      const reason = currentElite
        ? `Improved performance from ${currentElite.performance.toFixed(4)} to ${performance.toFixed(4)}`
        : `New niche discovered at coordinates [${coordinates.join(", ")}]`;

      return {
        success: true,
        accepted: true,
        coordinates,
        previousElite: currentElite,
        reason,
        coverageStats: this.getCoverageStats(),
      };
    } else {
      // Solution not good enough to replace current elite
      return {
        success: true,
        accepted: false,
        coordinates,
        previousElite: currentElite,
        reason: `Performance ${performance.toFixed(4)} not better than current elite ${currentElite.performance.toFixed(4)}`,
        coverageStats: this.getCoverageStats(),
      };
    }
  }

  /**
   * Get the elite solution at specific coordinates
   */
  getElite(coordinates: number[]): Solution | null {
    if (coordinates.length !== this.dimensions.length) {
      throw new Error(
        `Coordinates length (${coordinates.length}) must match dimensions length (${this.dimensions.length})`
      );
    }

    const key = this.mapper.coordinatesToKey(coordinates);
    return this.elites.get(key) || null;
  }

  /**
   * Get all elite solutions currently in the archive
   */
  getAllElites(): Solution[] {
    return Array.from(this.elites.values());
  }

  /**
   * Get coverage statistics for the archive
   */
  getCoverageStats(): CoverageStats {
    const filledNiches = this.elites.size;
    const totalNiches = this.totalNiches;
    const coverage = (filledNiches / totalNiches) * 100;

    const elites = this.getAllElites();
    const bestPerformance =
      elites.length > 0 ? Math.max(...elites.map((e) => e.performance)) : 0;
    const averagePerformance =
      elites.length > 0
        ? elites.reduce((sum, e) => sum + e.performance, 0) / elites.length
        : 0;

    return {
      totalNiches,
      filledNiches,
      coverage,
      bestPerformance,
      averagePerformance,
    };
  }

  /**
   * Get coordinates of empty niches (up to limit)
   */
  getEmptyNiches(limit?: number): number[][] {
    const emptyNiches: number[][] = [];
    const allCoordinates = this.mapper.generateAllCoordinates(this.dimensions);

    for (const coords of allCoordinates) {
      const key = this.mapper.coordinatesToKey(coords);
      if (!this.elites.has(key)) {
        emptyNiches.push(coords);
        if (limit && emptyNiches.length >= limit) {
          break;
        }
      }
    }

    return emptyNiches;
  }

  /**
   * Get neighboring elite solutions within a given radius
   */
  getNeighbors(coordinates: number[], radius: number = 1): Solution[] {
    if (coordinates.length !== this.dimensions.length) {
      throw new Error(
        `Coordinates length (${coordinates.length}) must match dimensions length (${this.dimensions.length})`
      );
    }

    const neighborCoords = this.mapper.getNeighboringCoordinates(
      coordinates,
      this.dimensions,
      radius
    );

    const neighbors: Solution[] = [];
    for (const coords of neighborCoords) {
      const elite = this.getElite(coords);
      if (elite) {
        neighbors.push(elite);
      }
    }

    return neighbors;
  }

  /**
   * Get a summary of the archive state
   */
  getSummary(): {
    archiveId: string;
    dimensions: BehaviorDimension[];
    coverageStats: CoverageStats;
    metadata: ArchiveMetadata;
  } {
    return {
      archiveId: this.id,
      dimensions: this.dimensions,
      coverageStats: this.getCoverageStats(),
      metadata: this.metadata,
    };
  }
}
