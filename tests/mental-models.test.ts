/**
 * Behavior tests for mental_models toolhost
 *
 * Run with: npx tsx tests/mental-models.test.ts
 */

import { MentalModelsServer, MENTAL_MODELS_TOOL } from "../src/mental-models/index.js";
import { getModelNames, getTagNames, MENTAL_MODELS, TAG_DEFINITIONS } from "../src/mental-models/operations.js";

const server = new MentalModelsServer();

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

async function runTests() {
  console.log("\n🧪 Mental Models Toolhost Tests\n");

  // Tool definition tests
  await test("Tool has correct name", () => {
    assert(MENTAL_MODELS_TOOL.name === "mental_models", "Expected name 'mental_models'");
  });

  await test("Tool description includes model count", () => {
    assert(
      MENTAL_MODELS_TOOL.description?.includes("15 mental models"),
      "Description should mention 15 models"
    );
  });

  await test("Tool description includes all tags", () => {
    const desc = MENTAL_MODELS_TOOL.description || "";
    for (const tag of getTagNames()) {
      assert(desc.includes(tag), `Description missing tag: ${tag}`);
    }
  });

  await test("Tool schema has dynamic model enum", () => {
    const schema = MENTAL_MODELS_TOOL.inputSchema as any;
    const modelEnum = schema.properties.args.properties.model.enum;
    assert(Array.isArray(modelEnum), "Model enum should be array");
    assert(modelEnum.length === 15, `Expected 15 models, got ${modelEnum.length}`);
    assert(modelEnum.includes("five-whys"), "Should include five-whys");
  });

  await test("Tool schema has dynamic tag enum", () => {
    const schema = MENTAL_MODELS_TOOL.inputSchema as any;
    const tagEnum = schema.properties.args.properties.tag.enum;
    assert(Array.isArray(tagEnum), "Tag enum should be array");
    assert(tagEnum.length === 9, `Expected 9 tags, got ${tagEnum.length}`);
    assert(tagEnum.includes("debugging"), "Should include debugging");
  });

  // list_tags operation
  await test("list_tags returns all tags", async () => {
    const result = await server.processTool("list_tags", {});
    const response = JSON.parse(result.content[0].text);
    assert(response.count === 9, `Expected 9 tags, got ${response.count}`);
    assert(response.tags.length === 9, "Tags array should have 9 items");
  });

  await test("list_tags includes descriptions", async () => {
    const result = await server.processTool("list_tags", {});
    const response = JSON.parse(result.content[0].text);
    const debugTag = response.tags.find((t: any) => t.name === "debugging");
    assert(debugTag, "Should have debugging tag");
    assert(debugTag.description.length > 10, "Description should be meaningful");
  });

  // list_models operation
  await test("list_models returns all models without filter", async () => {
    const result = await server.processTool("list_models", {});
    const response = JSON.parse(result.content[0].text);
    assert(response.count === 15, `Expected 15 models, got ${response.count}`);
    assert(!response.filter, "Should not have filter when unfiltered");
  });

  await test("list_models filters by tag", async () => {
    const result = await server.processTool("list_models", { tag: "debugging" });
    const response = JSON.parse(result.content[0].text);
    assert(response.count === 2, `Expected 2 debugging models, got ${response.count}`);
    assert(response.filter === "debugging", "Should show filter");
    // All returned models should have debugging tag
    for (const model of response.models) {
      assert(model.tags.includes("debugging"), `${model.name} should have debugging tag`);
    }
  });

  await test("list_models rejects invalid tag", async () => {
    const result = await server.processTool("list_models", { tag: "invalid-tag" });
    assert(result.isError === true, "Should return error");
    const response = JSON.parse(result.content[0].text);
    assert(response.error.includes("Unknown tag"), "Should mention unknown tag");
  });

  // get_model operation
  await test("get_model returns full content", async () => {
    const result = await server.processTool("get_model", { model: "five-whys" });
    const response = JSON.parse(result.content[0].text);
    assert(response.name === "five-whys", "Name should match");
    assert(response.title === "Five Whys", "Title should match");
    assert(response.tags.includes("debugging"), "Should have debugging tag");
    assert(response.content.includes("# Five Whys"), "Content should have heading");
    assert(response.content.includes("## Process"), "Content should have Process section");
    assert(response.content.length > 1000, "Content should be substantial");
  });

  await test("get_model requires model name", async () => {
    const result = await server.processTool("get_model", {});
    assert(result.isError === true, "Should return error");
    const response = JSON.parse(result.content[0].text);
    assert(response.error.includes("required"), "Should mention required");
  });

  await test("get_model rejects invalid model", async () => {
    const result = await server.processTool("get_model", { model: "invalid-model" });
    assert(result.isError === true, "Should return error");
    const response = JSON.parse(result.content[0].text);
    assert(response.error.includes("not found"), "Should mention not found");
  });

  // get_capability_graph operation
  await test("get_capability_graph returns entities and relations", async () => {
    const result = await server.processTool("get_capability_graph", {});
    const response = JSON.parse(result.content[0].text);
    assert(Array.isArray(response.entities), "Should have entities array");
    assert(Array.isArray(response.relations), "Should have relations array");
    assert(response.entities.length > 20, "Should have many entities");
    assert(response.relations.length > 20, "Should have many relations");
  });

  await test("get_capability_graph includes all models as entities", async () => {
    const result = await server.processTool("get_capability_graph", {});
    const response = JSON.parse(result.content[0].text);
    const modelEntities = response.entities.filter((e: any) => e.entityType === "mental_model");
    assert(modelEntities.length === 15, `Expected 15 model entities, got ${modelEntities.length}`);
  });

  await test("get_capability_graph includes usage instructions", async () => {
    const result = await server.processTool("get_capability_graph", {});
    const response = JSON.parse(result.content[0].text);
    assert(response.usage, "Should have usage instructions");
    assert(response.usage.step1.includes("memory_create_entities"), "Should reference memory tools");
  });

  // Content quality tests
  await test("All models have required content sections", async () => {
    for (const modelName of getModelNames()) {
      const result = await server.processTool("get_model", { model: modelName });
      const response = JSON.parse(result.content[0].text);
      const content = response.content;

      assert(content.includes("# "), `${modelName}: Missing title heading`);
      assert(content.includes("## When to Use"), `${modelName}: Missing When to Use section`);
      assert(content.includes("## Process"), `${modelName}: Missing Process section`);
      assert(content.includes("## "), `${modelName}: Should have multiple sections`);
    }
  });

  await test("All models have meaningful descriptions", () => {
    for (const model of MENTAL_MODELS) {
      assert(model.description.length > 20, `${model.name}: Description too short`);
      assert(model.description.length < 200, `${model.name}: Description too long`);
    }
  });

  await test("All tags are used by at least one model", () => {
    for (const tag of TAG_DEFINITIONS) {
      const modelsWithTag = MENTAL_MODELS.filter(m => m.tags.includes(tag.name));
      assert(modelsWithTag.length > 0, `Tag ${tag.name} has no models`);
    }
  });

  // Error handling
  await test("Unknown operation returns error with available operations", async () => {
    const result = await server.processTool("invalid_operation", {});
    assert(result.isError === true, "Should return error");
    const response = JSON.parse(result.content[0].text);
    assert(response.availableOperations, "Should list available operations");
  });

  console.log("\n✨ All tests completed\n");
}

runTests().catch(console.error);
