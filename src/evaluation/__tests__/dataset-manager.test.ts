/**
 * Unit tests for DatasetManager (Layer 2)
 *
 * Converted from tests/unit/dataset-manager.test.ts (hand-rolled tsx runner)
 * to vitest.
 */

import { describe, it, expect } from "vitest";
import { DatasetManager } from "../dataset-manager.js";
import type { CollectionTask, DeploymentTask, LangSmithConfig } from "../types.js";

type KV = Record<string, unknown>;

async function* fromArray<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

function createConfig(): LangSmithConfig {
  return {
    apiKey: "test-key",
    apiUrl: "https://api.smith.langchain.com",
    project: "test-project",
  };
}

function createCollectionTask(id: string): CollectionTask {
  return {
    _type: "collection",
    taskId: id,
    description: `Task ${id}`,
    expectedCapabilities: ["reasoning"],
    difficultyTier: "smoke",
  };
}

function createDeploymentTask(id: string): DeploymentTask {
  return {
    _type: "deployment",
    taskId: id,
    description: `Task ${id}`,
    expectedCapabilities: ["reasoning", "memory"],
    difficultyTier: "regression",
    memoryDesignId: "memory-v1",
    priorContext: { prior: true },
  };
}

describe("DatasetManager", () => {
  it("isEnabled returns false when config missing", async () => {
    const manager = new DatasetManager(null);
    expect(manager.isEnabled()).toBe(false);
    const datasets = await manager.listDatasets();
    expect(datasets.length).toBe(0);
  });

  it("ensureDataset reads existing dataset", async () => {
    let readCalled = false;
    const mockClient = {
      hasDataset: async () => true,
      readDataset: async ({ datasetName }: { datasetName: string }) => {
        readCalled = true;
        return { id: "ds-1", name: datasetName, description: "Existing dataset" };
      },
      createDataset: async () => {
        throw new Error("Should not create");
      },
      listDatasets: () => fromArray([]),
      createExamples: async () => [],
      listExamples: () => fromArray([]),
    };

    const manager = new DatasetManager(createConfig(), mockClient);
    const ds = await manager.ensureDataset("eval-collection", "desc");

    expect(ds).not.toBeNull();
    expect(ds?.name).toBe("eval-collection");
    expect(readCalled).toBe(true);
  });

  it("ensureDataset creates missing dataset", async () => {
    let createdName = "";
    const mockClient = {
      hasDataset: async () => false,
      readDataset: async () => ({ id: "never", name: "never", description: "never" }),
      createDataset: async (name: string, args?: { description?: string; metadata?: KV }) => {
        createdName = name;
        return { id: "ds-created", name, description: args?.description ?? "" };
      },
      listDatasets: () => fromArray([]),
      createExamples: async () => [],
      listExamples: () => fromArray([]),
    };

    const manager = new DatasetManager(createConfig(), mockClient);
    const ds = await manager.ensureDataset("eval-deployment", "Deployment dataset");

    expect(ds).not.toBeNull();
    expect(createdName).toBe("eval-deployment");
  });

  it("addCollectionExamples uploads mapped collection tasks", async () => {
    let uploadCount = 0;
    const mockClient = {
      hasDataset: async () => false,
      readDataset: async () => ({ id: "x", name: "x", description: "x" }),
      createDataset: async () => ({ id: "x", name: "x", description: "x" }),
      listDatasets: () => fromArray([]),
      createExamples: async (uploads: Array<{ metadata?: KV; split?: string | string[] }>) => {
        uploadCount = uploads.length;
        expect(uploads[0].split as string).toBe("collection");
        expect(uploads[0].metadata?.taskType as string).toBe("collection");
        return [];
      },
      listExamples: () => fromArray([]),
    };

    const manager = new DatasetManager(createConfig(), mockClient);
    const count = await manager.addCollectionExamples("collection-ds", [
      createCollectionTask("c1"),
      createCollectionTask("c2"),
    ]);

    expect(uploadCount).toBe(2);
    expect(count).toBe(2);
  });

  it("addDeploymentExamples uploads mapped deployment tasks", async () => {
    let uploadCount = 0;
    const mockClient = {
      hasDataset: async () => false,
      readDataset: async () => ({ id: "x", name: "x", description: "x" }),
      createDataset: async () => ({ id: "x", name: "x", description: "x" }),
      listDatasets: () => fromArray([]),
      createExamples: async (uploads: Array<{ metadata?: KV; split?: string | string[] }>) => {
        uploadCount = uploads.length;
        expect(uploads[0].split as string).toBe("deployment");
        expect(uploads[0].metadata?.taskType as string).toBe("deployment");
        return [];
      },
      listExamples: () => fromArray([]),
    };

    const manager = new DatasetManager(createConfig(), mockClient);
    const count = await manager.addDeploymentExamples("deployment-ds", [
      createDeploymentTask("d1"),
    ]);

    expect(uploadCount).toBe(1);
    expect(count).toBe(1);
  });

  it("listDatasets and getDatasetExamples return iterable data", async () => {
    const mockClient = {
      hasDataset: async () => false,
      readDataset: async () => ({ id: "x", name: "x", description: "x" }),
      createDataset: async () => ({ id: "x", name: "x", description: "x" }),
      listDatasets: () =>
        fromArray([
          { id: "ds-1", name: "collection-ds", description: "Collection", example_count: 2 },
          { id: "ds-2", name: "deployment-ds", description: "Deployment", example_count: 1 },
        ]),
      createExamples: async () => [],
      listExamples: () =>
        fromArray([
          { id: "ex-1", inputs: { taskId: "t1" }, outputs: { ok: true } },
          { id: "ex-2", inputs: { taskId: "t2" }, outputs: { ok: true } },
        ]),
    };

    const manager = new DatasetManager(createConfig(), mockClient);
    const datasets = await manager.listDatasets({ nameContains: "ds" });
    const examples = await manager.getDatasetExamples("collection-ds");

    expect(datasets.length).toBe(2);
    expect(examples.length).toBe(2);
    expect(datasets[0].name).toBe("collection-ds");
  });
});
