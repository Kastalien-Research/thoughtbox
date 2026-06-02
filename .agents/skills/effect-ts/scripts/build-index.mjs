#!/usr/bin/env node
/**
 * build-index.mjs
 *
 * Fetches Effect-TS docs from llms-full.txt, chunks by markdown sections,
 * generates embeddings via Voyage AI, and saves a JSON index to data/index.json.
 *
 * Usage: VOYAGE_API_KEY=... node .claude/skills/effect-ts/scripts/build-index.mjs
 *
 * Optional env:
 *   EFFECT_DOCS_URL  — override the docs URL (default: https://effect.website/llms-full.txt)
 *   VOYAGE_MODEL     — override the embedding model (default: voyage-3.5-lite)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env file if it exists (simple key=value parser, no dependency needed)
function loadEnv() {
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", ".env"),
  ];
  for (const envPath of candidates) {
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
}
loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const INDEX_PATH = join(DATA_DIR, "index.json");

const DOCS_URL =
  process.env.EFFECT_DOCS_URL || "https://effect.website/llms-full.txt";
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || "voyage-3.5-lite";
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

// Max tokens per chunk (rough: 1 token ≈ 4 chars)
const MAX_CHUNK_CHARS = 2000;

if (!VOYAGE_API_KEY) {
  console.error("Error: VOYAGE_API_KEY is required");
  process.exit(1);
}

// --- Fetch docs ---
async function fetchDocs() {
  console.log(`Fetching docs from ${DOCS_URL}...`);
  const res = await fetch(DOCS_URL);
  if (!res.ok) throw new Error(`Failed to fetch docs: ${res.status}`);
  const text = await res.text();
  console.log(`Fetched ${text.length} chars (${(text.length / 4) | 0} ~tokens)`);
  return text;
}

// --- Chunk by markdown headers ---
function chunkDocs(text) {
  // Split on h1 headers: # [Title](url) or # Title
  const h1Regex = /^# .+$/gm;
  const h1Sections = [];
  let lastIndex = 0;
  let match;

  // Find all h1 positions
  const h1Positions = [];
  while ((match = h1Regex.exec(text)) !== null) {
    h1Positions.push({ index: match.index, header: match[0] });
  }

  // Split into h1 sections
  for (let i = 0; i < h1Positions.length; i++) {
    const start = h1Positions[i].index;
    const end = i + 1 < h1Positions.length ? h1Positions[i + 1].index : text.length;
    h1Sections.push({
      h1: h1Positions[i].header,
      content: text.slice(start, end).trim(),
    });
  }

  // If no h1 headers found, treat entire text as one section
  if (h1Sections.length === 0) {
    h1Sections.push({ h1: "# Effect Documentation", content: text });
  }

  // Now split each h1 section into smaller chunks on ## headers
  const chunks = [];
  for (const section of h1Sections) {
    const h2Regex = /^## .+$/gm;
    const h2Positions = [];
    let m;
    while ((m = h2Regex.exec(section.content)) !== null) {
      h2Positions.push({ index: m.index, header: m[0] });
    }

    if (h2Positions.length === 0) {
      // No h2 subdivisions — chunk the whole section
      splitLongChunk(section.content, section.h1, chunks);
    } else {
      // Intro before first h2
      if (h2Positions[0].index > 0) {
        const intro = section.content.slice(0, h2Positions[0].index).trim();
        if (intro.length > 50) {
          splitLongChunk(intro, section.h1, chunks);
        }
      }
      // Each h2 subsection
      for (let j = 0; j < h2Positions.length; j++) {
        const start = h2Positions[j].index;
        const end =
          j + 1 < h2Positions.length
            ? h2Positions[j + 1].index
            : section.content.length;
        const subContent = section.content.slice(start, end).trim();
        const breadcrumb = `${section.h1} > ${h2Positions[j].header}`;
        splitLongChunk(subContent, breadcrumb, chunks);
      }
    }
  }

  return chunks;
}

function splitLongChunk(text, breadcrumb, chunks) {
  if (text.length <= MAX_CHUNK_CHARS) {
    chunks.push({ text, breadcrumb });
    return;
  }

  // Split on ### headers if the chunk is too long
  const h3Regex = /^### .+$/gm;
  const h3Positions = [];
  let m;
  while ((m = h3Regex.exec(text)) !== null) {
    h3Positions.push({ index: m.index, header: m[0] });
  }

  if (h3Positions.length > 1) {
    // Intro before first h3
    if (h3Positions[0].index > 0) {
      const intro = text.slice(0, h3Positions[0].index).trim();
      if (intro.length > 50) {
        chunks.push({ text: intro, breadcrumb });
      }
    }
    for (let i = 0; i < h3Positions.length; i++) {
      const start = h3Positions[i].index;
      const end =
        i + 1 < h3Positions.length ? h3Positions[i + 1].index : text.length;
      const sub = text.slice(start, end).trim();
      const bc = `${breadcrumb} > ${h3Positions[i].header}`;
      // If still too long, just split by paragraphs
      if (sub.length > MAX_CHUNK_CHARS) {
        splitByParagraphs(sub, bc, chunks);
      } else {
        chunks.push({ text: sub, breadcrumb: bc });
      }
    }
  } else {
    splitByParagraphs(text, breadcrumb, chunks);
  }
}

function splitByParagraphs(text, breadcrumb, chunks) {
  const paragraphs = text.split(/\n\n+/);
  let current = "";
  for (const p of paragraphs) {
    if (current.length + p.length > MAX_CHUNK_CHARS && current.length > 0) {
      chunks.push({ text: current.trim(), breadcrumb });
      current = p;
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }
  if (current.trim().length > 50) {
    chunks.push({ text: current.trim(), breadcrumb });
  }
}

// --- Generate embeddings via Voyage ---
async function embedBatch(texts) {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: "document",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

async function generateEmbeddings(chunks) {
  const BATCH_SIZE = 64; // Voyage supports up to 128 per batch
  const allEmbeddings = [];
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNum = (i / BATCH_SIZE + 1) | 0;
    console.log(
      `Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`
    );
    const embeddings = await embedBatch(batch.map((c) => c.text));
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

// --- Main ---
async function main() {
  const text = await fetchDocs();
  const chunks = chunkDocs(text);
  console.log(`Chunked into ${chunks.length} sections`);

  // Show a sample
  console.log(`\nSample chunks:`);
  for (let i = 0; i < Math.min(3, chunks.length); i++) {
    console.log(
      `  [${i}] ${chunks[i].breadcrumb} (${chunks[i].text.length} chars)`
    );
  }

  const embeddings = await generateEmbeddings(chunks);

  // Build the index
  const index = {
    version: 1,
    model: VOYAGE_MODEL,
    created: new Date().toISOString(),
    source: DOCS_URL,
    chunks: chunks.map((c, i) => ({
      id: i,
      breadcrumb: c.breadcrumb,
      text: c.text,
      embedding: embeddings[i],
    })),
  };

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(INDEX_PATH, JSON.stringify(index));
  const sizeMB = (Buffer.byteLength(JSON.stringify(index)) / 1024 / 1024).toFixed(1);
  console.log(`\nWrote index to ${INDEX_PATH} (${sizeMB} MB, ${chunks.length} chunks)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
