// Type definitions for MAP-Elites server

export interface BehaviorDimension {
  name: string;
  min: number;
  max: number;
  resolution: number; // Number of discrete bins
}

export interface Solution {
  id: string;
  content: any; // LLM-generated solution content
  behavioralCharacteristics: number[]; // Continuous values before discretization
  coordinates: number[]; // Discretized coordinates in the grid
  performance: number; // Fitness/quality score
  metadata?: {
    generatedAt?: number; // Timestamp
    parentId?: string;
    mutationStrategy?: string;
    generationNumber?: number;
    [key: string]: any; // Allow additional metadata
  };
}

export interface ArchiveMetadata {
  description?: string;
  performanceMetric?: string;
  [key: string]: any;
}

export interface CoverageStats {
  totalNiches: number;
  filledNiches: number;
  coverage: number; // Percentage (0-100)
  bestPerformance: number;
  averagePerformance: number;
}

// Operation argument types

export interface CreateArchiveArgs {
  archiveId?: string;
  dimensions: BehaviorDimension[];
  metadata?: ArchiveMetadata;
}

export interface ProposeSolutionArgs {
  archiveId: string;
  solution: any;
  behavioralCharacteristics: number[];
  performance: number;
  metadata?: {
    parentId?: string;
    mutationStrategy?: string;
    generationNumber?: number;
    [key: string]: any;
  };
}

export interface GetEliteArgs {
  archiveId: string;
  coordinates: number[];
}

export interface GetMapStateArgs {
  archiveId: string;
  includeVisualization?: boolean;
}

export interface GetEmptyNichesArgs {
  archiveId: string;
  limit?: number;
}

export interface GetNeighborsArgs {
  archiveId: string;
  coordinates: number[];
  radius?: number;
}

// Response types

export interface CreateArchiveResponse {
  success: boolean;
  archiveId: string;
  totalNiches: number;
  dimensions: BehaviorDimension[];
}

export interface ProposeSolutionResponse {
  success: boolean;
  accepted: boolean;
  coordinates: number[];
  previousElite?: Solution;
  reason: string;
  coverageStats: CoverageStats;
}

export interface GetEliteResponse {
  success: boolean;
  elite: Solution | null;
}

export interface GetMapStateResponse {
  success: boolean;
  archiveId: string;
  coverageStats: CoverageStats;
  elites: Solution[];
  visualization?: string;
}

export interface GetEmptyNichesResponse {
  success: boolean;
  emptyNiches: number[][];
  count: number;
}

export interface GetNeighborsResponse {
  success: boolean;
  neighbors: Solution[];
  count: number;
}
