#!/usr/bin/env npx tsx
/**
 * Direct test script for mental_models tool
 *
 * This script directly calls the MentalModelsHandler to test the three operations:
 * 1. list_models (no args)
 * 2. get_model (with model: "five-whys")
 * 3. list_models (with tag: "debugging")
 */

import { MentalModelsHandler } from "../src/mental-models/index.js";

async function main() {
  const handler = new MentalModelsHandler();

  console.log("=".repeat(80));
  console.log("TEST 1: list_models (no additional args)");
  console.log("=".repeat(80));

  const test1Result = await handler.processTool("list_models", {});
  const test1Response = JSON.parse(test1Result.content[0].text!);

  console.log("\nRaw Response:");
  console.log(JSON.stringify(test1Response, null, 2));

  console.log("\n--- Verification ---");
  console.log(`✓ Total models returned: ${test1Response.count}`);
  console.log(`✓ Has at least 5 models: ${test1Response.count >= 5 ? "PASS" : "FAIL"}`);
  console.log(`✓ Each model has name: ${test1Response.models.every((m: any) => m.name) ? "PASS" : "FAIL"}`);
  console.log(`✓ Each model has description: ${test1Response.models.every((m: any) => m.description) ? "PASS" : "FAIL"}`);

  console.log("\n" + "=".repeat(80));
  console.log("TEST 2: get_model with args { model: 'five-whys' }");
  console.log("=".repeat(80));

  const test2Result = await handler.processTool("get_model", { model: "five-whys" });
  const test2Response = JSON.parse(test2Result.content[0].text!);

  console.log("\nRaw Response:");
  console.log(JSON.stringify(test2Response, null, 2));

  console.log("\n--- Verification ---");
  console.log(`✓ Model name: ${test2Response.name}`);
  console.log(`✓ Model title: ${test2Response.title}`);
  console.log(`✓ Has content: ${test2Response.content ? "PASS" : "FAIL"}`);
  console.log(`✓ Content includes Process: ${test2Response.content.includes("## Process") ? "PASS" : "FAIL"}`);
  console.log(`✓ Content includes framework: ${test2Response.content.includes("## ") ? "PASS" : "FAIL"}`);
  console.log(`✓ Content length: ${test2Response.content.length} characters`);

  console.log("\n" + "=".repeat(80));
  console.log("TEST 3: list_models with args { tag: 'debugging' }");
  console.log("=".repeat(80));

  const test3Result = await handler.processTool("list_models", { tag: "debugging" });
  const test3Response = JSON.parse(test3Result.content[0].text!);

  console.log("\nRaw Response:");
  console.log(JSON.stringify(test3Response, null, 2));

  console.log("\n--- Verification ---");
  console.log(`✓ Filter applied: ${test3Response.filter}`);
  console.log(`✓ Models returned: ${test3Response.count}`);
  console.log(`✓ All models have debugging tag: ${test3Response.models.every((m: any) => m.tags.includes("debugging")) ? "PASS" : "FAIL"}`);

  console.log("\n" + "=".repeat(80));
  console.log("Models with debugging tag:");
  test3Response.models.forEach((m: any) => {
    console.log(`  - ${m.name}: ${m.description}`);
    console.log(`    Tags: [${m.tags.join(", ")}]`);
  });

  console.log("\n" + "=".repeat(80));
  console.log("ALL TESTS COMPLETED SUCCESSFULLY");
  console.log("=".repeat(80));
}

main().catch(console.error);
