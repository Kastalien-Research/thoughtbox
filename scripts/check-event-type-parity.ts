#!/usr/bin/env tsx
/**
 * Code ↔ DB invariant check for `protocol_history.event_type`.
 *
 * The bug this guards against: the handler emits a new event_type value, but
 * the live CHECK constraint hasn't been extended, so the insert fails at
 * runtime. (commit d764ae6 — `fix(ulysses): allow validator history events`.)
 *
 * Invariant: every `event_type: 'literal'` produced by src/protocol/handler.ts
 * must appear in the live `protocol_history_event_type_check` constraint.
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN - personal access token from supabase.com/dashboard/account/tokens
 *   SUPABASE_PROJECT_REF  - project to query (defaults to production)
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HANDLER_PATH = path.join(PROJECT_ROOT, 'src/protocol/handler.ts');
const CONSTRAINT_NAME = 'protocol_history_event_type_check';
const DEFAULT_PROJECT_REF = 'akjccuoncxlvrrtkvtno';

interface QueryResponse {
  result?: Array<{ def: string }>;
}

async function querySupabase(projectRef: string, token: string, sql: string): Promise<QueryResponse> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    throw new Error(`Supabase query failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as unknown;
  if (Array.isArray(body)) {
    return { result: body as Array<{ def: string }> };
  }
  return body as QueryResponse;
}

function extractEmittedLiterals(source: string): Set<string> {
  const emitted = new Set<string>();
  const pattern = /event_type:\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    emitted.add(match[1]);
  }
  return emitted;
}

function extractAllowedLiterals(constraintDef: string): Set<string> {
  const allowed = new Set<string>();
  const pattern = /'([^']+)'::text/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(constraintDef)) !== null) {
    allowed.add(match[1]);
  }
  return allowed;
}

async function main(): Promise<void> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error('error: SUPABASE_ACCESS_TOKEN is required');
    process.exit(2);
  }
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? DEFAULT_PROJECT_REF;

  const source = await readFile(HANDLER_PATH, 'utf8');
  const emitted = extractEmittedLiterals(source);
  if (emitted.size === 0) {
    console.error(`error: no event_type literals found in ${HANDLER_PATH}`);
    process.exit(2);
  }

  const constraintQuery = `
    SELECT pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.protocol_history'::regclass
      AND conname = '${CONSTRAINT_NAME}'
  `;
  const response = await querySupabase(projectRef, token, constraintQuery);
  const def = response.result?.[0]?.def;
  if (!def) {
    console.error(`error: constraint ${CONSTRAINT_NAME} not found on project ${projectRef}`);
    process.exit(2);
  }
  const allowed = extractAllowedLiterals(def);

  const missing = [...emitted].filter((v) => !allowed.has(v)).sort();
  const unused = [...allowed].filter((v) => !emitted.has(v)).sort();

  console.log(`Project: ${projectRef}`);
  console.log(`Emitted by handler.ts: ${[...emitted].sort().join(', ')}`);
  console.log(`Allowed by constraint:  ${[...allowed].sort().join(', ')}`);

  if (missing.length > 0) {
    console.error(`\nFAIL: handler emits event_types not allowed by constraint:`);
    for (const v of missing) {
      console.error(`  - ${v}`);
    }
    console.error('\nFix: extend the CHECK constraint via a new migration.');
    process.exit(1);
  }

  if (unused.length > 0) {
    console.log(`\nNote: constraint allows event_types not emitted by handler: ${unused.join(', ')}`);
    console.log('(Not a failure — could be dead values or emitted from other sources.)');
  }

  console.log('\nOK: every emitted event_type is allowed by the live constraint.');
}

main().catch((err) => {
  console.error('check-event-type-parity failed:', err);
  process.exit(2);
});
