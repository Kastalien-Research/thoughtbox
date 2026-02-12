import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type SignalCategory =
  | "learning"
  | "proposal"
  | "approval"
  | "implementation"
  | "evaluation"
  | "pattern_fitness"
  | "regression"
  | "escalation"
  | "assumption_update";

export interface Signal {
  id: string;
  source_loop: string;
  source_type: "fast" | "medium" | "slow";
  timestamp: string;
  category: SignalCategory;
  payload: Record<string, unknown>;
  consumed_by: string[];
  fitness_tag: "HOT" | "WARM" | "COLD";
  ttl_days: number;
}

export interface ConsumeOptions {
  since?: string;
  categories?: SignalCategory[];
  source_types?: Array<"fast" | "medium" | "slow">;
  limit?: number;
}

const SIGNALS_DIR = path.resolve(process.cwd(), "agentops", "signals");
const INDEX_PATH = path.join(SIGNALS_DIR, "index.json");

async function ensureDir() {
  await fs.mkdir(SIGNALS_DIR, { recursive: true });
}

function dayPath(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return path.join(SIGNALS_DIR, `${y}-${m}-${d}.jsonl`);
}

async function readIndex(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed?.last_consumed ?? {};
  } catch {
    return {};
  }
}

async function writeIndex(lastConsumed: Record<string, string>) {
  await fs.writeFile(
    INDEX_PATH,
    JSON.stringify({ version: 1, last_consumed: lastConsumed }, null, 2),
    "utf8",
  );
}

export async function emitSignal(
  signal: Omit<Signal, "id" | "timestamp" | "consumed_by">,
): Promise<string> {
  await ensureDir();
  const record: Signal = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    consumed_by: [],
    ...signal,
  };
  await fs.appendFile(dayPath(), `${JSON.stringify(record)}\n`, "utf8");
  return record.id;
}

function notExpired(signal: Signal): boolean {
  const created = new Date(signal.timestamp).getTime();
  if (Number.isNaN(created)) return false;
  const ttlMs = signal.ttl_days * 24 * 60 * 60 * 1000;
  return Date.now() - created <= ttlMs;
}

async function readAllSignals(): Promise<Signal[]> {
  await ensureDir();
  const entries = await fs.readdir(SIGNALS_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".jsonl"))
    .map((e) => path.join(SIGNALS_DIR, e.name))
    .sort();

  const all: Signal[] = [];
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        all.push(JSON.parse(line));
      } catch {
        // ignore malformed JSONL line
      }
    }
  }
  return all;
}

export async function consumeSignals(
  consumer: string,
  opts: ConsumeOptions = {},
): Promise<Signal[]> {
  const all = await readAllSignals();
  const index = await readIndex();
  const sinceTs = opts.since ?? index[consumer];

  const filtered = all
    .filter(notExpired)
    .filter((s) => (sinceTs ? s.timestamp > sinceTs : true))
    .filter((s) => (opts.categories ? opts.categories.includes(s.category) : true))
    .filter((s) => (opts.source_types ? opts.source_types.includes(s.source_type) : true))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const limited = typeof opts.limit === "number" ? filtered.slice(0, opts.limit) : filtered;
  if (limited.length > 0) {
    index[consumer] = limited[limited.length - 1].timestamp;
    await writeIndex(index);
  }
  return limited;
}

export async function markConsumed(signalIds: string[], consumer: string): Promise<void> {
  if (signalIds.length === 0) return;
  await ensureDir();

  const entries = await fs.readdir(SIGNALS_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".jsonl"))
    .map((e) => path.join(SIGNALS_DIR, e.name));

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    let changed = false;
    const lines = raw.split(/\r?\n/).filter(Boolean).map((line) => {
      try {
        const signal = JSON.parse(line) as Signal;
        if (signalIds.includes(signal.id) && !signal.consumed_by.includes(consumer)) {
          signal.consumed_by.push(consumer);
          changed = true;
          return JSON.stringify(signal);
        }
        return line;
      } catch {
        return line;
      }
    });
    if (changed) {
      await fs.writeFile(file, `${lines.join("\n")}\n`, "utf8");
    }
  }
}
