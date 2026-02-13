#!/usr/bin/env tsx
import fs from "fs/promises";
import path from "path";

const SIGNALS_DIR = path.resolve(process.cwd(), "agentops", "signals");
const INDEX_PATH = path.join(SIGNALS_DIR, "index.json");

async function main() {
  await fs.mkdir(SIGNALS_DIR, { recursive: true });
  const index = {
    version: 1,
    last_consumed: {},
  };
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), "utf8");
  process.stdout.write(`Initialized ${INDEX_PATH}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
