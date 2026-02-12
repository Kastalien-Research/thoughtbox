/**
 * Unit tests for DatasetManager (Layer 2)
 *
 * Run with: npx tsx tests/unit/dataset-manager.test.ts
 */

import { DatasetManager } from "../../src/evaluation/dataset-manager.js";
import type { CollectionTask, DeploymentTask, LangSmithConfig } from "../../src/evaluation/types.js";

type KV = Record<string, unknown>;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

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

async function runTests() {
  console.log("\n🧪 DatasetManager Tests\n");

  await test("isEnabled returns false when config missing", async () => {
    const manager = new DatasetManager(null);
    assertEqual(manager.isEnabled(), false, "Manager should be disabled");
    const datasets = await manager.listDatasets();
    assertEqual(datasets.length, 0, "Disabled manager should return no datasets");
  });

  await test("ensureDataset reads existing dataset", async () => {
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

    assert(ds !== null, "Dataset should be returned");
    assertEqual(ds?.name, "eval-collection", "Should read expected dataset");
    assert(readCalled, "readDataset should be called");
  });

  await test("ensureDataset creates missing dataset", async () => {
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

    assert(ds !== null, "Dataset should be created");
    assertEqual(createdName, "eval-deployment", "Expected createDataset name");
  });

  await test("addCollectionExamples uploads mapped collection tasks", async () => {
    let uploadCount = 0;
    const mockClient = {
      hasDataset: async () => false,
      readDataset: async () => ({ id: "x", name: "x", description: "x" }),
      createDataset: async () => ({ id: "x", name: "x", description: "x" }),
      listDatasets: () => fromArray([]),
      createExamples: async (uploads: Array<{ metadata?: KV; split?: string | string[] }>) => {
        uploadCount = uploads.length;
        assertEqual(uploads[0].split as string, "collection", "Collection split expected");
        assertEqual(uploads[0].metadata?.taskType as string, "collection", "Task type expected");
        return [];
      },
      listExamples: () => fromArray([]),
    };

    const manager = new DatasetManager(createConfig(), mockClient);
    const count = await manager.addCollectionExamples("collection-ds", [
      createCollectionTask("c1"),
      createCollectionTask("c2"),
    ]);

    assertEqual(uploadCount, 2, "Should upload 2 examples");
    assertEqual(count, 2, "Should report uploaded count");
  });

  await test("addDeploymentExamples uploads mapped deployment tasks", async () => {
    let uploadCount = 0;
    const mockClient = {
      hasDataset: async () => false,
      readDataset: async () => ({ id: "x", name: "x", description: "x" }),
      createDataset: async () => ({ id: "x", name: "x", description: "x" }),
      listDatasets: () => fromArray([]),
      createExamples: async (uploads: Array<{ metadata?: KV; split?: string | string[] }>) => {
        uploadCount = uploads.length;
        assertEqual(uploads[0].split as string, "deployment", "Deployment split expected");
        assertEqual(uploads[0].metadata?.taskType as string, "deployment", "Task type expected");
        return [];
      },
      listExamples: () => fromArray([]),
    };

    const manager = new DatasetManager(createConfig(), mockClient);
    const count = await manager.addDeploymentExamples("deployment-ds", [
      createDeploymentTask("d1"),
    ]);

    assertEqual(uploadCount, 1, "Should upload 1 example");
    assertEqual(count, 1, "Should report uploaded count");
  });

  await test("listDatasets and getDatasetExamples return iterable data", async () => {
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

    assertEqual(datasets.length, 2, "Should list two datasets");
    assertEqual(examples.length, 2, "Should list two examples");
    assertEqual(datasets[0].name, "collection-ds", "Expected first dataset");
  });

  console.log("\n✨ DatasetManager tests complete\n");
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});

