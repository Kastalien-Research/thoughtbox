/**
 * Dataset Manager (Layer 2)
 * SPEC: SPEC-EVAL-001
 *
 * Manages ALMA-style collection/deployment datasets in LangSmith.
 */

import { Client } from "langsmith";
import type { CollectionTask, DeploymentTask, LangSmithConfig } from "./types.js";

type KV = Record<string, unknown>;

interface DatasetRecord {
  id: string;
  name: string;
  description: string;
  example_count?: number;
}

interface ExampleRecord {
  id: string;
  inputs: KV;
  outputs?: KV;
  metadata?: KV;
  split?: string | string[];
}

interface DatasetClient {
  hasDataset(args: { datasetName: string }): Promise<boolean>;
  readDataset(args: { datasetName: string }): Promise<DatasetRecord>;
  createDataset(name: string, args?: { description?: string; metadata?: KV }): Promise<DatasetRecord>;
  listDatasets(args?: { datasetNameContains?: string; limit?: number; offset?: number }): AsyncIterable<DatasetRecord>;
  createExamples(uploads: Array<{ inputs: KV; outputs?: KV; metadata?: KV; split?: string | string[]; dataset_name: string }>): Promise<unknown[]>;
  listExamples(args: { datasetName: string; limit?: number; offset?: number }): AsyncIterable<ExampleRecord>;
}

/**
 * Layer 2 dataset manager for LangSmith.
 */
export class DatasetManager {
  private readonly client: DatasetClient | null;

  constructor(config: LangSmithConfig | null, client?: DatasetClient) {
    if (!config) {
      this.client = null;
      return;
    }

    this.client =
      client ??
      new Client({
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
      });
  }

  /**
   * Returns true when LangSmith dataset features are available.
   */
  isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Ensure a dataset exists (idempotent).
   */
  async ensureDataset(name: string, description: string): Promise<DatasetRecord | null> {
    return this.safe("ensureDataset", null, async () => {
      const exists = await this.client!.hasDataset({ datasetName: name });
      if (exists) {
        return await this.client!.readDataset({ datasetName: name });
      }

      return await this.client!.createDataset(name, {
        description,
        metadata: {
          source: "thoughtbox-evaluation",
          createdBy: "DatasetManager",
        },
      });
    });
  }

  /**
   * Add collection (no-memory) tasks to a dataset.
   */
  async addCollectionExamples(datasetName: string, tasks: CollectionTask[]): Promise<number> {
    if (tasks.length === 0) return 0;

    return this.safe("addCollectionExamples", 0, async () => {
      const uploads = tasks.map((task) => ({
        dataset_name: datasetName,
        inputs: {
          taskId: task.taskId,
          description: task.description,
          expectedCapabilities: task.expectedCapabilities,
          difficultyTier: task.difficultyTier,
        },
        outputs: {
          expectedTaskType: "collection",
        },
        metadata: {
          taskType: "collection",
          expectedCapabilities: task.expectedCapabilities,
          difficultyTier: task.difficultyTier,
        },
        split: "collection",
      }));

      await this.client!.createExamples(uploads);
      return uploads.length;
    });
  }

  /**
   * Add deployment (with-memory) tasks to a dataset.
   */
  async addDeploymentExamples(datasetName: string, tasks: DeploymentTask[]): Promise<number> {
    if (tasks.length === 0) return 0;

    return this.safe("addDeploymentExamples", 0, async () => {
      const uploads = tasks.map((task) => ({
        dataset_name: datasetName,
        inputs: {
          taskId: task.taskId,
          description: task.description,
          expectedCapabilities: task.expectedCapabilities,
          difficultyTier: task.difficultyTier,
          memoryDesignId: task.memoryDesignId,
          priorContext: task.priorContext,
        },
        outputs: {
          expectedTaskType: "deployment",
          memoryDesignId: task.memoryDesignId,
        },
        metadata: {
          taskType: "deployment",
          memoryDesignId: task.memoryDesignId,
          expectedCapabilities: task.expectedCapabilities,
          difficultyTier: task.difficultyTier,
        },
        split: "deployment",
      }));

      await this.client!.createExamples(uploads);
      return uploads.length;
    });
  }

  /**
   * List datasets in the current workspace/project.
   */
  async listDatasets(filter?: { nameContains?: string; limit?: number; offset?: number }): Promise<DatasetRecord[]> {
    return this.safe("listDatasets", [], async () => {
      const datasets: DatasetRecord[] = [];
      for await (const ds of this.client!.listDatasets({
        datasetNameContains: filter?.nameContains,
        limit: filter?.limit,
        offset: filter?.offset,
      })) {
        datasets.push(ds);
      }
      return datasets;
    });
  }

  /**
   * List dataset examples for inspection.
   */
  async getDatasetExamples(datasetName: string, options?: { limit?: number; offset?: number }): Promise<ExampleRecord[]> {
    return this.safe("getDatasetExamples", [], async () => {
      const examples: ExampleRecord[] = [];
      for await (const example of this.client!.listExamples({
        datasetName,
        limit: options?.limit,
        offset: options?.offset,
      })) {
        examples.push(example);
      }
      return examples;
    });
  }

  /**
   * Execute an async operation with consistent error handling and no-op when disabled.
   */
  private async safe<T>(label: string, fallback: T, fn: () => Promise<T>): Promise<T> {
    if (!this.client) return fallback;
    try {
      return await fn();
    } catch (err) {
      console.warn(`[Evaluation] ${label}:`, err instanceof Error ? err.message : err);
      return fallback;
    }
  }
}
