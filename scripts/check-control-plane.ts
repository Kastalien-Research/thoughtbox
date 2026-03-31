#!/usr/bin/env tsx
/**
 * Validate ADR-017 control-plane manifest, generated outputs, and test truth coverage.
 */

import { promises as fsp } from 'node:fs';
import { glob } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { parse } from 'yaml';

import { type Manifest, type GeneratedArtifacts, buildManifestBundle, getManifest, validateManifest } from './generate-control-plane.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(process.cwd());

const MANIFEST_PATH = path.join(REPO_ROOT, 'automation-self-improvement/control-plane/manifest.yaml');
const TEST_IGNORE_GLOBS = ['**/node_modules/**', '**/.git/**', '**/dist/**'];
const CATCH_ALL_TEST_GLOBS = [
  'src/**/__tests__/**/*.ts',
  'tests/**/*.ts',
];

interface CheckFailure {
  id: string;
  message: string;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+$/, '');
}

function extractLegacyPrefixes(manifest: Manifest): string[] {
  const legacyRule = manifest.drift_rules.find((rule) => rule.id === 'no-legacy-root-paths');
  if (!legacyRule) return [];
  const prefixes = (legacyRule as Record<string, unknown>).legacy_prefixes;
  if (!Array.isArray(prefixes)) return [];
  return prefixes.filter((p): p is string => typeof p === 'string' && p.length > 0);
}

function hasLegacyPrefix(value: string, legacyPrefixes: string[]): boolean {
  const normalized = normalizePath(value);
  return legacyPrefixes.some((prefix) => normalized.startsWith(prefix));
}

function hasGlob(value: string): boolean {
  return value.includes('*') || value.includes('?') || value.includes('[') || value.includes('{');
}

async function exists(candidate: string): Promise<boolean> {
  try {
    await fsp.access(candidate);
    return true;
  } catch {
    return false;
  }
}

function uniqueIds(entries: Array<{ id: string }>): CheckFailure[] {
  const seen = new Set<string>();
  const failures: CheckFailure[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      failures.push({ id: 'duplicate-id', message: `Duplicate id: ${entry.id}` });
    }
    seen.add(entry.id);
  }
  return failures;
}

async function collectFiles(pattern: string): Promise<string[]> {
  const matches: string[] = [];
  for await (const entry of glob(pattern, {
    cwd: REPO_ROOT,
    exclude: TEST_IGNORE_GLOBS,
  })) {
    matches.push(normalizePath(String(entry)));
  }
  return matches;
}

function canonicalizeArtifacts(artifacts: GeneratedArtifacts): GeneratedArtifacts {
  return {
    markdown: Object.fromEntries(Object.entries(artifacts.markdown).sort(([a], [b]) => a.localeCompare(b, 'en-US'))),
    json: Object.fromEntries(Object.entries(artifacts.json).sort(([a], [b]) => a.localeCompare(b, 'en-US'))),
  };
}

function isRelativeOrAbsolute(value: string): string {
  if (path.isAbsolute(value)) {
    return normalizePath(path.relative(REPO_ROOT, value));
  }
  return value;
}

function gatherReferencedPaths(manifest: Manifest): string[] {
  return [
    ...manifest.systems.flatMap((system) => system.paths),
    ...manifest.systems.flatMap((system) => system.entrypoints),
    ...manifest.workflows.flatMap((workflow) => workflow.paths),
    ...manifest.workflows.flatMap((workflow) => workflow.entrypoints),
    ...manifest.artifacts.map((artifact) => artifact.path),
    ...manifest.artifacts.map((artifact) => artifact.source_of_truth),
    ...manifest.artifacts.map((artifact) => artifact.produced_by),
    ...manifest.generation.outputs,
    ...manifest.generation.outputs.map((output) => path.dirname(output)),
    ...manifest.tests.map((suite) => suite.glob),
    manifest.generation.source_of_truth,
    manifest.generation.generated_by,
    manifest.generation.generated_from,
  ].flat();
}

function artifactMismatchMessages(first: GeneratedArtifacts, second: GeneratedArtifacts): string[] {
  const firstCanonical = canonicalizeArtifacts(first);
  const secondCanonical = canonicalizeArtifacts(second);
  const failures: string[] = [];

  const markdownKeys = new Set([...Object.keys(firstCanonical.markdown), ...Object.keys(secondCanonical.markdown)]);
  for (const key of [...markdownKeys].sort((a, b) => a.localeCompare(b, 'en-US'))) {
    if (firstCanonical.markdown[key] !== secondCanonical.markdown[key]) {
      failures.push(`Markdown artifact mismatch after re-run: ${key}`);
    }
  }

  const jsonKeys = new Set([...Object.keys(firstCanonical.json), ...Object.keys(secondCanonical.json)]);
  for (const key of [...jsonKeys].sort((a, b) => a.localeCompare(b, 'en-US'))) {
    if (firstCanonical.json[key] !== secondCanonical.json[key]) {
      failures.push(`JSON artifact mismatch after re-run: ${key}`);
    }
  }

  return failures;
}

function validateManifestDepth(manifest: Manifest): CheckFailure[] {
  const failures: CheckFailure[] = [];

  failures.push(...uniqueIds(manifest.systems));
  failures.push(...uniqueIds(manifest.workflows));
  failures.push(...uniqueIds(manifest.artifacts));

  const suiteIds = new Set<string>();
  for (const suite of manifest.tests) {
    if (suiteIds.has(suite.suite_id)) {
      failures.push({ id: 'duplicate-test-suite', message: `Duplicate test suite id: ${suite.suite_id}` });
    }
    suiteIds.add(suite.suite_id);
  }

  return failures;
}

function schemaFailure(error: unknown): CheckFailure {
  if (error instanceof Error) {
    return { id: 'schema', message: `Manifest schema invalid: ${error.message}` };
  }
  return { id: 'schema', message: `Manifest schema invalid: ${String(error)}` };
}

async function validateReferences(manifest: Manifest, legacyPrefixes: string[]): Promise<CheckFailure[]> {
  const failures: CheckFailure[] = [];
  const references = gatherReferencedPaths(manifest);

  for (const reference of references) {
    if (hasLegacyPrefix(reference, legacyPrefixes)) {
      failures.push({ id: 'legacy-path', message: `Legacy path reference found: ${reference}` });
      continue;
    }

    if (hasGlob(reference)) {
      const matches = await collectFiles(reference);
      if (matches.length === 0) {
        failures.push({ id: 'empty-glob', message: `Glob pattern matches zero files: ${reference}` });
      }
      continue;
    }

    if (!path.isAbsolute(reference)) {
      const abs = path.join(REPO_ROOT, reference);
      const existsOnDisk = await exists(abs);
      if (!existsOnDisk) {
        failures.push({ id: 'missing-path', message: `Manifest references missing path: ${reference}` });
      }
      continue;
    }

    const relative = isRelativeOrAbsolute(reference);
    if (!relative.startsWith('..')) {
      const abs = path.join(REPO_ROOT, relative);
      if (!(await exists(abs))) {
        failures.push({ id: 'missing-path', message: `Manifest absolute path missing: ${reference}` });
      }
    }
  }

  return failures;
}

function validateCrossReferences(manifest: Manifest): CheckFailure[] {
  const failures: CheckFailure[] = [];
  const workflowIds = new Set(manifest.workflows.map((w) => w.id));
  const artifactIds = new Set(manifest.artifacts.map((a) => a.id));

  for (const system of manifest.systems) {
    for (const wfId of system.owner_workflows) {
      if (!workflowIds.has(wfId)) {
        failures.push({ id: 'broken-ref', message: `System '${system.id}' references unknown workflow: ${wfId}` });
      }
    }
    for (const artId of system.upstream_artifacts ?? []) {
      if (!artifactIds.has(artId)) {
        failures.push({ id: 'broken-ref', message: `System '${system.id}' references unknown upstream artifact: ${artId}` });
      }
    }
    for (const artId of system.downstream_artifacts ?? []) {
      if (!artifactIds.has(artId)) {
        failures.push({ id: 'broken-ref', message: `System '${system.id}' references unknown downstream artifact: ${artId}` });
      }
    }
  }

  return failures;
}

async function checkGeneratedArtifacts(): Promise<CheckFailure[]> {
  const failures: CheckFailure[] = [];
  const generated = await buildManifestBundle(MANIFEST_PATH);
  const generatedEntries = { ...generated.artifacts.markdown, ...generated.artifacts.json };

  for (const [relativePath, expectedContent] of Object.entries(generatedEntries)) {
    const absolutePath = path.join(REPO_ROOT, normalizePath(relativePath));
    try {
      const current = await fsp.readFile(absolutePath, 'utf8');
      if (current !== expectedContent) {
        failures.push({ id: 'stale-output', message: `Generated artifact stale or modified: ${relativePath}` });
      }
    } catch {
      failures.push({ id: 'missing-output', message: `Generated artifact missing: ${relativePath}` });
    }
  }

  return failures;
}

async function discoverCodeTests(manifest: Manifest): Promise<Set<string>> {
  const manifestGlobs = manifest.tests.map((suite) => suite.glob);
  const allGlobs = [...new Set([...CATCH_ALL_TEST_GLOBS, ...manifestGlobs])];

  const groups = await Promise.all(allGlobs.map(collectFiles));
  const discovered = new Set<string>();
  for (const group of groups) {
    for (const file of group) {
      discovered.add(file);
    }
  }
  return discovered;
}

async function validateDeclaredSuites(manifest: Manifest): Promise<CheckFailure[]> {
  const failures: CheckFailure[] = [];
  const discovered = await discoverCodeTests(manifest);
  const declared = new Set<string>();

  for (const suite of manifest.tests) {
    const suiteFiles = await collectFiles(suite.glob);
    for (const file of suiteFiles) {
      declared.add(file);
    }
  }

  for (const file of discovered) {
    if (!declared.has(file) && file.endsWith('.ts')) {
      failures.push({ id: 'undeclared-suite', message: `Code-based test file is not declared in manifest tests: ${file}` });
    }
  }

  return failures;
}

async function validateDeterminism(manifestPath = MANIFEST_PATH): Promise<CheckFailure[]> {
  const first = await buildManifestBundle(manifestPath);
  const second = await buildManifestBundle(manifestPath);

  const mismatches = artifactMismatchMessages(first.artifacts, second.artifacts);
  return mismatches.map((message) => ({ id: 'nondeterministic-output', message }));
}

async function main(): Promise<void> {
  const failures: CheckFailure[] = [];
  const rawManifest = parse(await fsp.readFile(MANIFEST_PATH, 'utf8'));

  try {
    validateManifest(rawManifest);
  } catch (error) {
    failures.push(schemaFailure(error));
  }

  let manifest: Manifest | null = null;
  try {
    manifest = await getManifest(MANIFEST_PATH);
  } catch (error) {
    failures.push(schemaFailure(error));
  }

  if (!manifest) {
    failures.push({ id: 'schema', message: 'Unable to proceed with invalid manifest; aborting deeper control-plane checks.' });
    for (const failure of failures) {
      console.log(`- [${failure.id}] ${failure.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const legacyPrefixes = extractLegacyPrefixes(manifest);
  failures.push(...validateManifestDepth(manifest));
  failures.push(...validateCrossReferences(manifest));
  failures.push(...(await validateReferences(manifest, legacyPrefixes)));
  failures.push(...(await checkGeneratedArtifacts()));
  failures.push(...(await validateDeclaredSuites(manifest)));
  failures.push(...(await validateDeterminism(MANIFEST_PATH)));

  if (failures.length === 0) {
    console.log('check:control-plane passed');
    return;
  }

  console.log('check:control-plane failed');
  for (const failure of failures) {
    console.log(`- [${failure.id}] ${failure.message}`);
  }
  process.exitCode = 1;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
