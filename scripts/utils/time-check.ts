#!/usr/bin/env tsx
/**
 * Prints UTC time with optional elapsed minutes from PROMPT_START_TIME.
 */

function parseEnvNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseStart(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function main() {
  const now = new Date();
  const start = parseStart(process.env.PROMPT_START_TIME);
  const targetMin = parseEnvNumber(process.env.TARGET_MINUTES, 45);
  const elapsed = start ? (now.getTime() - start.getTime()) / 60000 : null;

  const payload = {
    utc: now.toISOString(),
    elapsed_min: elapsed == null ? null : Number(elapsed.toFixed(2)),
    target_min: targetMin,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
