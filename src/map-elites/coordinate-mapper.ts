import { BehaviorDimension } from "./types.js";

/**
 * CoordinateMapper handles discretization of continuous behavioral characteristics
 * into discrete grid coordinates for the MAP-Elites archive.
 */
export class CoordinateMapper {
  /**
   * Discretize a continuous value into a discrete bin index based on dimension spec
   * @param value Continuous value to discretize
   * @param dimension Dimension specification with min, max, and resolution
   * @returns Discrete bin index (0 to resolution-1)
   */
  discretize(value: number, dimension: BehaviorDimension): number {
    const range = dimension.max - dimension.min;

    if (range <= 0) {
      throw new Error(
        `Invalid dimension ${dimension.name}: max (${dimension.max}) must be greater than min (${dimension.min})`
      );
    }

    if (dimension.resolution <= 0) {
      throw new Error(
        `Invalid dimension ${dimension.name}: resolution (${dimension.resolution}) must be positive`
      );
    }

    // Clamp value to valid range
    const clampedValue = Math.max(dimension.min, Math.min(dimension.max, value));

    // Calculate bin size
    const binSize = range / dimension.resolution;

    // Calculate bin index
    let bin = Math.floor((clampedValue - dimension.min) / binSize);

    // Handle edge case where value equals max (would map to resolution instead of resolution-1)
    if (bin >= dimension.resolution) {
      bin = dimension.resolution - 1;
    }

    return bin;
  }

  /**
   * Discretize an array of continuous behavioral characteristics into discrete coordinates
   * @param behavioralCharacteristics Array of continuous values
   * @param dimensions Array of dimension specifications
   * @returns Array of discrete bin indices
   */
  discretizeAll(
    behavioralCharacteristics: number[],
    dimensions: BehaviorDimension[]
  ): number[] {
    if (behavioralCharacteristics.length !== dimensions.length) {
      throw new Error(
        `Behavioral characteristics length (${behavioralCharacteristics.length}) must match dimensions length (${dimensions.length})`
      );
    }

    return behavioralCharacteristics.map((value, index) =>
      this.discretize(value, dimensions[index])
    );
  }

  /**
   * Convert coordinate array to a string key for Map storage
   * @param coordinates Array of discrete bin indices
   * @returns String key (comma-separated coordinates)
   */
  coordinatesToKey(coordinates: number[]): string {
    return coordinates.join(",");
  }

  /**
   * Convert string key back to coordinate array
   * @param key String key (comma-separated coordinates)
   * @returns Array of discrete bin indices
   */
  keyToCoordinates(key: string): number[] {
    return key.split(",").map(Number);
  }

  /**
   * Calculate total number of niches in the archive
   * @param dimensions Array of dimension specifications
   * @returns Total number of possible niches (product of all resolutions)
   */
  calculateTotalNiches(dimensions: BehaviorDimension[]): number {
    return dimensions.reduce((total, dim) => total * dim.resolution, 1);
  }

  /**
   * Generate all possible coordinate combinations for an archive
   * @param dimensions Array of dimension specifications
   * @returns Array of all possible coordinate arrays
   */
  generateAllCoordinates(dimensions: BehaviorDimension[]): number[][] {
    if (dimensions.length === 0) {
      return [[]];
    }

    const [firstDim, ...restDims] = dimensions;
    const restCoords = this.generateAllCoordinates(restDims);
    const allCoords: number[][] = [];

    for (let i = 0; i < firstDim.resolution; i++) {
      for (const restCoord of restCoords) {
        allCoords.push([i, ...restCoord]);
      }
    }

    return allCoords;
  }

  /**
   * Get neighboring coordinates within a given radius
   * @param coordinates Center coordinates
   * @param dimensions Array of dimension specifications
   * @param radius Maximum distance in each dimension (default 1)
   * @returns Array of neighboring coordinate arrays
   */
  getNeighboringCoordinates(
    coordinates: number[],
    dimensions: BehaviorDimension[],
    radius: number = 1
  ): number[][] {
    if (coordinates.length !== dimensions.length) {
      throw new Error(
        `Coordinates length (${coordinates.length}) must match dimensions length (${dimensions.length})`
      );
    }

    const neighbors: number[][] = [];

    const generateNeighbors = (index: number, current: number[]): void => {
      if (index === coordinates.length) {
        // Don't include the center point itself
        if (!current.every((val, i) => val === coordinates[i])) {
          neighbors.push([...current]);
        }
        return;
      }

      const centerCoord = coordinates[index];
      const maxCoord = dimensions[index].resolution - 1;

      for (let offset = -radius; offset <= radius; offset++) {
        const newCoord = centerCoord + offset;
        if (newCoord >= 0 && newCoord <= maxCoord) {
          // Clone array before mutation to prevent shared state bugs
          const newCurrent = [...current];
          newCurrent[index] = newCoord;
          generateNeighbors(index + 1, newCurrent);
        }
      }
    };

    generateNeighbors(0, new Array(coordinates.length));
    return neighbors;
  }
}
