#!/usr/bin/env node
/**
 * Minimal, deterministic bridge from Claude Code hooks → Thoughtbox Knowledge JSONL.
 *
 * Writes project-scoped entries to:
 *   <project>/.thoughtbox/projects/<projectId>/memory/graph.jsonl
 *
 * This is intentionally standalone (no TS imports) so hooks can run without build steps.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function usage(exitCode = 2) {
  process.stderr.write(
    [
      'Usage:',
      '  knowledge_memory_bridge.mjs add-insight \\',
      '    --name <string> --label <string> --content <string> \\',
      '    [--session-id <string>] [--properties-json <json>]',
      '',
      'Env:',
      '  CLAUDE_PROJECT_DIR: repo root (preferred)',
      '  THOUGHTBOX_PROJECT_ID: override project id folder name',
      '',
    ].join('\n') + '\n'
  );
  process.exit(exitCode);
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function requireArg(flag) {
  const v = getArg(flag);
  if (!v) usage();
  return v;
}

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR
    ? path.resolve(process.env.CLAUDE_PROJECT_DIR)
    : process.cwd();
}

function projectId(root) {
  return (process.env.THOUGHTBOX_PROJECT_ID || path.basename(root)).replace(/[^\w.-]+/g, '_');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// Deterministic UUID-like string derived from input (stable across runs).
function stableId(input) {
  const h = sha256Hex(input);
  // UUID v4 shape, but deterministic.
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function appendJsonlLine(jsonlPath, obj) {
  fs.appendFileSync(jsonlPath, JSON.stringify(obj) + '\n', 'utf8');
}

function main() {
  const cmd = process.argv[2];
  if (!cmd) usage();

  const root = projectRoot();
  const pid = projectId(root);
  const memoryDir = path.join(root, '.thoughtbox', 'projects', pid, 'memory');
  const jsonlPath = path.join(memoryDir, 'graph.jsonl');
  ensureDir(memoryDir);
  if (!fs.existsSync(jsonlPath)) fs.writeFileSync(jsonlPath, '', 'utf8');

  if (cmd === 'add-insight') {
    const name = requireArg('--name');
    const label = requireArg('--label');
    const content = requireArg('--content');
    const sessionId = getArg('--session-id');
    const rawProps = getArg('--properties-json');

    let properties = {};
    if (rawProps) {
      try {
        properties = JSON.parse(rawProps);
      } catch {
        // Ignore malformed properties; keep deterministic/noisy failures out of hooks.
        properties = {};
      }
    }

    const entityType = 'Insight';
    const entityId = stableId(`${entityType}:${name}`);
    const t = nowIso();

    // Entity line (idempotent by deterministic id).
    appendJsonlLine(jsonlPath, {
      type: 'entity',
      id: entityId,
      name,
      entityType,
      label,
      properties,
      created_at: t,
      updated_at: t,
      created_by: 'claude-hook',
      visibility: 'agent-private',
      valid_from: t,
      valid_to: null,
      superseded_by: null,
    });

    // Observation line attached to entity.
    const obsId = stableId(`Observation:${entityId}:${sha256Hex(`${t}:${content}`).slice(0, 16)}`);
    appendJsonlLine(jsonlPath, {
      type: 'observation',
      id: obsId,
      entity_id: entityId,
      content,
      source_session: sessionId || null,
      added_by: 'claude-hook',
      added_at: t,
      valid_from: t,
      valid_to: null,
      superseded_by: null,
    });

    process.exit(0);
  }

  usage();
}

try {
  main();
} catch {
  // Hooks must not break the main run.
  process.exit(0);
}

