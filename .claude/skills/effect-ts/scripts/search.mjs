#!/usr/bin/env node
/**
 * search.mjs
 *
 * Semantic search over the Effect-TS docs index.
 *
 * Usage: VOYAGE_API_KEY=... node .claude/skills/effect-ts/scripts/search.mjs "how do I use layers"
 *
 * Optional:
 *   --top-k N     Number of results (default: 5)
 *   --chars N     Max chars per result (default: 1500)
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env file if it exists
function loadEnv() {
  const __dir = dirname(fileURLToPath(import.meta.url));
  const envPath = join(__dir, "..", "..", "..", "..", ".env");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, "..", "data", "index.json");

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || "voyage-3.5-lite";
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

function parseArgs(args) {
  const query = [];
  let topK = 5;
  let maxChars = 1500;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--top-k" && args[i + 1]) {
      topK = parseInt(args[++i], 10);
    } else if (args[i] === "--chars" && args[i + 1]) {
      maxChars = parseInt(args[++i], 10);
    } else {
      query.push(args[i]);
    }
  }
  return { query: query.join(" "), topK, maxChars };
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedQuery(text) {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: "query",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

async function main() {
  const { query, topK, maxChars } = parseArgs(process.argv.slice(2));

  if (!query) {
    console.error("Usage: search.mjs <query> [--top-k N] [--chars N]");
    process.exit(1);
  }

  if (!VOYAGE_API_KEY) {
    console.error("Error: VOYAGE_API_KEY is required");
    process.exit(1);
  }

  // Load index
  let index;
  try {
    index = JSON.parse(readFileSync(INDEX_PATH, "utf-8"));
  } catch {
    console.error(
      `Index not found at ${INDEX_PATH}. Run build-index.mjs first.`
    );
    process.exit(1);
  }

  // Embed the query
  const queryEmbedding = await embedQuery(query);

  // Score all chunks
  const scored = index.chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by score descending and take top K
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, topK);

  // Output
  console.log(`\n=== Effect-TS Docs Search: "${query}" (top ${topK}) ===\n`);
  for (const r of results) {
    const text = r.text.length > maxChars
      ? r.text.slice(0, maxChars) + "..."
      : r.text;
    console.log(`--- [${r.score.toFixed(4)}] ${r.breadcrumb} ---`);
    console.log(text);
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
