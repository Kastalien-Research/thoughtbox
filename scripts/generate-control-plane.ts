#!/usr/bin/env tsx
/**
 * Generate ADR-017 unified autonomy control-plane artifacts.
 *
 * Output surfaces:
 * - .specs/unified-autonomy-control-plane/*.md
 * - automation-self-improvement/control-plane/generated/control-plane.json
 * - automation-self-improvement/control-plane/generated/test-truth.json
 */

import { promises as fsp } from 'node:fs';
import { glob } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { parse } from 'yaml';
import process from 'node:process';
import { DISCOVER_GLOBS, IGNORE_GLOBS } from './control-plane-globs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(process.cwd());

const DEFAULT_MANIFEST_PATH = path.join(REPO_ROOT, 'automation-self-improvement/control-plane/manifest.yaml');
const DEFAULT_VITEST_CONFIG_PATH = path.join(REPO_ROOT, 'vitest.config.ts');
const GENERATED_BY = 'scripts/generate-control-plane.ts';

// DISCOVER_GLOBS and IGNORE_GLOBS imported from ./control-plane-globs.ts
// Do not redeclare here — edit the shared module to keep checker in sync.

const GENERATED_AT = 'manifest-driven-stable';
const BANNER = `<!--
AUTO-GENERATED — DO NOT EDIT MANUALLY.
Source: automation-self-improvement/control-plane/manifest.yaml
-->`;

export type TestExecutionProfile =
  | 'ci-executed'
  | 'ci-declared-but-empty'
  | 'local-integration'
  | 'local-only'
  | 'stale-or-unreferenced';

export interface Manifest {
  version: string;
  repo: {
    name: string;
    root: string;
    branch: string;
  };
  systems: Array<{
    id: string;
    name: string;
    paths: string[];
    entrypoints: string[];
    maturity: 'implemented' | 'partial' | 'external' | 'research-only';
    owner_workflows: string[];
    upstream_artifacts?: string[];
    downstream_artifacts?: string[];
  }>;
  workflows: Array<{
    id: string;
    plane: string;
    trigger: string;
    maturity: 'implemented' | 'partial' | 'external' | 'research-only';
    paths: string[];
    entrypoints: string[];
    states: string[];
    steps: string[];
    inputs: string[];
    outputs: string[];
    gates: string[];
  }>;
  artifacts: Array<{
    id: string;
    kind: string;
    path: string;
    source_of_truth: string;
    produced_by: string;
    consumed_by: string[];
  }>;
  generation: {
    source_of_truth: string;
    generated_by: string;
    generated_from: string;
    outputs: string[];
  };
  tests: Array<{
    suite_id: string;
    glob: string;
    runner: string;
    execution_profile: TestExecutionProfile;
    real_dependencies: string[];
    coverage: { components: string[] };
    gaps?: string[];
  }>;
  drift_rules: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high';
    matcher: string;
    legacy_prefixes?: string[];
    failure_message: string;
  }>;
}

export interface TestFileRecord {
  file: string;
  ci_executed: boolean;
  runner: string;
  runner_include_glob: string;
  real_dependencies: string[];
  uses_real_services: boolean;
  covered_components: string[];
  missing_integration_or_e2e: boolean;
}

export interface TestTruthSuite {
  suite_id: string;
  glob: string;
  runner: string;
  execution_profile: TestExecutionProfile;
  manifest_classification: TestExecutionProfile;
  files: string[];
  ci_files: string[];
  real_dependencies: string[];
  coverage_components: string[];
  gaps: string[];
  dependencies_real_services: boolean;
  file_records: TestFileRecord[];
}

export interface TestTruth {
  generated_at: string;
  source_manifest: string;
  generator: string;
  vitest: {
    include: string[];
    exclude: string[];
  };
  suites: TestTruthSuite[];
  discovered_test_files: string[];
  declared_test_files: string[];
  undeclared_test_files: string[];
  overlapping_test_files: Array<{ file: string; suites: string[] }>;
  coverage_components: string[];
  classification: {
    total_suites: number;
    by_classification: Record<TestExecutionProfile, number>;
  };
  explicit_gaps: string[];
}

export interface GeneratedArtifacts {
  markdown: Record<string, string>;
  json: Record<string, string>;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+$/, '');
}

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sort(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en-US'));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function toArray<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid manifest: ${label} must be an array`);
  }
  return value as T[];
}

function mustString(value: unknown, label: string): string {
  assert(typeof value === 'string' && value.trim().length > 0, `${label} must be a non-empty string`);
  return value;
}

function normalizeManifest(manifest: Manifest): Manifest {
  return {
    version: manifest.version,
    repo: {
      name: manifest.repo.name,
      root: normalizePath(manifest.repo.root),
      branch: manifest.repo.branch,
    },
    systems: sort(manifest.systems.map(s => s.id)).map((id) => {
      const s = manifest.systems.find((entry) => entry.id === id);
      assert(s, `Missing system for id ${id}`);
      return {
        id: s.id,
        name: s.name,
        paths: sort(s.paths.map(normalizePath)),
        entrypoints: sort(s.entrypoints.map(normalizePath)),
        maturity: s.maturity,
        owner_workflows: sort(s.owner_workflows.map((i) => normalizePath(i))),
        upstream_artifacts: s.upstream_artifacts ? sort(s.upstream_artifacts.map(normalizePath)) : undefined,
        downstream_artifacts: s.downstream_artifacts ? sort(s.downstream_artifacts.map(normalizePath)) : undefined,
      };
    }),
    workflows: sort(manifest.workflows.map((w) => w.id)).map((id) => {
      const w = manifest.workflows.find((entry) => entry.id === id);
      assert(w, `Missing workflow for id ${id}`);
      return {
        id: w.id,
        plane: w.plane,
        trigger: w.trigger,
        maturity: w.maturity,
        paths: sort(w.paths.map(normalizePath)),
        entrypoints: sort(w.entrypoints.map(normalizePath)),
        states: dedupe(w.states.map(normalizePath)),
        steps: dedupe(w.steps.map((s) => s.trim())),
        inputs: sort(w.inputs.map(normalizePath)),
        outputs: sort(w.outputs.map(normalizePath)),
        gates: sort(w.gates.map(normalizePath)),
      };
    }),
    artifacts: sort(manifest.artifacts.map((a) => a.id)).map((id) => {
      const a = manifest.artifacts.find((entry) => entry.id === id);
      assert(a, `Missing artifact for id ${id}`);
      return {
        id: a.id,
        kind: a.kind,
        path: normalizePath(a.path),
        source_of_truth: normalizePath(a.source_of_truth),
        produced_by: normalizePath(a.produced_by),
        consumed_by: sort(a.consumed_by.map(normalizePath)),
      };
    }),
    generation: {
      source_of_truth: normalizePath(manifest.generation.source_of_truth),
      generated_by: normalizePath(manifest.generation.generated_by),
      generated_from: normalizePath(manifest.generation.generated_from),
      outputs: sort(manifest.generation.outputs.map(normalizePath)),
    },
    tests: sort(manifest.tests.map((suite) => suite.suite_id)).map((suiteId) => {
      const t = manifest.tests.find((suite) => suite.suite_id === suiteId);
      assert(t, `Missing suite for id ${suiteId}`);
      return {
        suite_id: t.suite_id,
        glob: normalizePath(t.glob),
        runner: t.runner,
        execution_profile: t.execution_profile,
        real_dependencies: sort(t.real_dependencies.map(normalizePath)),
        coverage: {
          components: sort(t.coverage.components.map(normalizePath)),
        },
        gaps: t.gaps && t.gaps.length > 0 ? sort(t.gaps.map((gap) => gap.trim())) : undefined,
      };
    }),
    drift_rules: sort(manifest.drift_rules.map((rule) => rule.id)).map((id) => {
      const rule = manifest.drift_rules.find((entry) => entry.id === id);
      assert(rule, `Missing drift rule for id ${id}`);
      return {
        id: rule.id,
        severity: rule.severity,
        matcher: rule.matcher,
        legacy_prefixes: rule.legacy_prefixes ? sort(rule.legacy_prefixes) : undefined,
        failure_message: rule.failure_message,
      };
    }),
  };
}

function validateManifest(manifest: unknown): Manifest {
  assert(typeof manifest === 'object' && manifest !== null, 'Manifest must be an object');

  const asRecord = manifest as Record<string, unknown>;
  const version = mustString(asRecord.version, 'version');
  const repo = asRecord.repo as Record<string, unknown> | undefined;
  assert(typeof repo === 'object' && repo !== null, 'repo is required');
  assert(typeof repo.name === 'string' && repo.name.trim(), 'repo.name is required');
  assert(typeof repo.root === 'string' && repo.root.trim(), 'repo.root is required');
  assert(typeof repo.branch === 'string' && repo.branch.trim(), 'repo.branch is required');

  const systems = toArray<Manifest['systems'][number]>(asRecord.systems, 'systems');
  const workflows = toArray<Manifest['workflows'][number]>(asRecord.workflows, 'workflows');
  const artifacts = toArray<Manifest['artifacts'][number]>(asRecord.artifacts, 'artifacts');
  const tests = toArray<Manifest['tests'][number]>(asRecord.tests, 'tests');
  const driftRules = toArray<Manifest['drift_rules'][number]>(asRecord.drift_rules, 'drift_rules');
  const generation = asRecord.generation as Manifest['generation'];
  assert(typeof generation === 'object' && generation !== null, 'generation is required');
  const generationOutputs = toArray<string>(generation.outputs, 'generation.outputs');
  const validMaturity = ['implemented', 'partial', 'external', 'research-only'];
  const validProfiles: TestExecutionProfile[] = [
    'ci-executed',
    'ci-declared-but-empty',
    'local-integration',
    'local-only',
    'stale-or-unreferenced',
  ];

  systems.forEach((system, idx) => {
    assert(typeof system === 'object' && system !== null, `systems[${idx}] must be an object`);
    mustString(system.id, `systems[${idx}].id`);
    mustString(system.name, `systems[${idx}].name`);
    assert(toArray(system.paths, `systems[${idx}].paths`).every((value) => typeof value === 'string'), `systems[${idx}].paths must contain strings`);
    assert(toArray(system.entrypoints, `systems[${idx}].entrypoints`).every((value) => typeof value === 'string'), `systems[${idx}].entrypoints must contain strings`);
    assert(validMaturity.includes(system.maturity), `systems[${idx}].maturity invalid`);
    assert(toArray(system.owner_workflows, `systems[${idx}].owner_workflows`).every((value) => typeof value === 'string'), `systems[${idx}].owner_workflows must contain strings`);
    if (system.upstream_artifacts !== undefined) {
      assert(Array.isArray(system.upstream_artifacts), `systems[${idx}].upstream_artifacts must be an array`);
    }
    if (system.downstream_artifacts !== undefined) {
      assert(Array.isArray(system.downstream_artifacts), `systems[${idx}].downstream_artifacts must be an array`);
    }
  });

  workflows.forEach((workflow, idx) => {
    assert(typeof workflow === 'object' && workflow !== null, `workflows[${idx}] must be an object`);
    mustString(workflow.id, `workflows[${idx}].id`);
    mustString(workflow.plane, `workflows[${idx}].plane`);
    mustString(workflow.trigger, `workflows[${idx}].trigger`);
    assert(validMaturity.includes(workflow.maturity), `workflows[${idx}].maturity invalid`);
    assert(toArray(workflow.paths, `workflows[${idx}].paths`).every((value) => typeof value === 'string'), `workflows[${idx}].paths must contain strings`);
    assert(toArray(workflow.entrypoints, `workflows[${idx}].entrypoints`).every((value) => typeof value === 'string'), `workflows[${idx}].entrypoints must contain strings`);
    assert(toArray(workflow.states, `workflows[${idx}].states`).every((value) => typeof value === 'string'), `workflows[${idx}].states must contain strings`);
    assert(toArray(workflow.steps, `workflows[${idx}].steps`).every((value) => typeof value === 'string'), `workflows[${idx}].steps must contain strings`);
    assert(toArray(workflow.inputs, `workflows[${idx}].inputs`).every((value) => typeof value === 'string'), `workflows[${idx}].inputs must contain strings`);
    assert(toArray(workflow.outputs, `workflows[${idx}].outputs`).every((value) => typeof value === 'string'), `workflows[${idx}].outputs must contain strings`);
    assert(toArray(workflow.gates, `workflows[${idx}].gates`).every((value) => typeof value === 'string'), `workflows[${idx}].gates must contain strings`);
  });

  artifacts.forEach((artifact, idx) => {
    assert(typeof artifact === 'object' && artifact !== null, `artifacts[${idx}] must be an object`);
    mustString(artifact.id, `artifacts[${idx}].id`);
    mustString(artifact.kind, `artifacts[${idx}].kind`);
    mustString(artifact.path, `artifacts[${idx}].path`);
    mustString(artifact.source_of_truth, `artifacts[${idx}].source_of_truth`);
    mustString(artifact.produced_by, `artifacts[${idx}].produced_by`);
    assert(Array.isArray(artifact.consumed_by), `artifacts[${idx}].consumed_by must be array`);
  });

  assert(generationOutputs.length > 0, 'generation.outputs must have at least one entry');
  assert(toArray(generationOutputs, 'generation.outputs').every((value) => typeof value === 'string'), 'generation.outputs must contain strings');

  tests.forEach((suite, idx) => {
    assert(typeof suite === 'object' && suite !== null, `tests[${idx}] must be an object`);
    mustString(suite.suite_id, `tests[${idx}].suite_id`);
    mustString(suite.glob, `tests[${idx}].glob`);
    mustString(suite.runner, `tests[${idx}].runner`);
    assert(validProfiles.includes(suite.execution_profile), `tests[${idx}].execution_profile invalid`);
    assert(Array.isArray(suite.real_dependencies), `tests[${idx}].real_dependencies must be array`);
    assert(typeof suite.coverage === 'object' && suite.coverage !== null, `tests[${idx}].coverage must be object`);
    assert(Array.isArray(suite.coverage.components), `tests[${idx}].coverage.components must be array`);
  });

  driftRules.forEach((rule, idx) => {
    assert(typeof rule === 'object' && rule !== null, `drift_rules[${idx}] must be an object`);
    mustString(rule.id, `drift_rules[${idx}].id`);
    mustString(rule.matcher, `drift_rules[${idx}].matcher`);
    mustString(rule.failure_message, `drift_rules[${idx}].failure_message`);
    assert(['low', 'medium', 'high'].includes(rule.severity), `drift_rules[${idx}].severity invalid`);
  });

  return {
    version,
    repo: {
      name: mustString(repo.name, 'repo.name'),
      root: mustString(repo.root, 'repo.root'),
      branch: mustString(repo.branch, 'repo.branch'),
    },
    systems,
    workflows,
    artifacts,
    generation: {
      source_of_truth: mustString(generation.source_of_truth, 'generation.source_of_truth'),
      generated_by: mustString(generation.generated_by, 'generation.generated_by'),
      generated_from: mustString(generation.generated_from, 'generation.generated_from'),
      outputs: generationOutputs,
    },
    tests,
    drift_rules: driftRules,
  };
}

function hasGlobChars(value: string): boolean {
  return value.includes('*') || value.includes('?') || value.includes('[') || value.includes('{');
}

async function collectFiles(pattern: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of glob(pattern, {
    cwd: REPO_ROOT,
    exclude: IGNORE_GLOBS,
  })) {
    files.push(normalizePath(String(entry)));
  }
  return sort(dedupe(files));
}

function matchSetFromGlobs(values: string[]): Promise<string[]> {
  return Promise.all(values.map((pattern) => collectFiles(pattern))).then((groups) => {
    const all: string[] = [];
    for (const g of groups) all.push(...g);
    return sort(dedupe(all));
  });
}

async function getVitestConfig(): Promise<{ include: string[]; exclude: string[] }> {
  try {
    const imported = await import(pathToFileURL(DEFAULT_VITEST_CONFIG_PATH).href);
    const testConfig = imported?.default?.test || {};
    const include = toArray<string>(testConfig.include || [], 'vitest.test.include');
    const exclude = toArray<string>(testConfig.exclude || [], 'vitest.test.exclude');
    return {
      include: sort(include.map(normalizePath)),
      exclude: sort(exclude.map(normalizePath)),
    };
  } catch {
    return { include: [], exclude: [] };
  }
}

function classifyProfile(suite: Manifest['tests'][number], suiteFiles: string[], ciSet: Set<string>): TestExecutionProfile {
  const ciCovered = suiteFiles.some((file) => ciSet.has(file));
  if (ciCovered) {
    return 'ci-executed';
  }

  if (suite.execution_profile === 'ci-executed') {
    return suiteFiles.length > 0 ? 'ci-declared-but-empty' : 'stale-or-unreferenced';
  }

  if (suite.execution_profile === 'ci-declared-but-empty') {
    return 'ci-declared-but-empty';
  }

  if (suite.execution_profile === 'local-only') {
    return suiteFiles.length > 0 ? 'local-only' : 'stale-or-unreferenced';
  }

  if (suite.execution_profile === 'local-integration') {
    return suiteFiles.length > 0 ? 'local-integration' : 'stale-or-unreferenced';
  }

  return suiteFiles.length > 0 ? suite.execution_profile : 'stale-or-unreferenced';
}

function componentsNeedIntegration(components: string[]): boolean {
  const lower = new Set(components.map((value) => value.toLowerCase()));
  const required = ['runtime', 'persistence', 'evaluation', 'integration'];
  return required.some((component) => {
    return !lower.has(component);
  });
}

async function buildTestTruth(manifest: Manifest, vitestConfig: { include: string[]; exclude: string[] }): Promise<TestTruth> {
  const vitestIncludeSet = new Set(await matchSetFromGlobs(vitestConfig.include));
  const candidateFiles = sort(dedupe((await matchSetFromGlobs(DISCOVER_GLOBS)).filter((value) => !value.includes('/dist/') )));

  const discoveredFilesSet = new Set(candidateFiles);
  const suiteDeclarations: Array<{ suiteId: string; files: string[] }> = [];
  const suites: TestTruthSuite[] = [];

  let suiteCounter: Record<TestExecutionProfile, number> = {
    'ci-executed': 0,
    'ci-declared-but-empty': 0,
    'local-integration': 0,
    'local-only': 0,
    'stale-or-unreferenced': 0,
  };
  const fileToSuites = new Map<string, string[]>();

  for (const suite of manifest.tests) {
    const files = await collectFiles(suite.glob);
    const ciFiles = files.filter((file) => vitestIncludeSet.has(file));
    const realDependencies = sort(dedupe(suite.real_dependencies.map(normalizePath)));
    const classif = classifyProfile(suite, files, vitestIncludeSet);
    const fileRecords: TestFileRecord[] = files.map((file) => {
      const lower = suite.coverage.components.map((entry) => normalizePath(entry).toLowerCase());
      const rec = {
        file,
        ci_executed: ciFiles.includes(file),
        runner: suite.runner,
        runner_include_glob: suite.glob,
        real_dependencies: realDependencies,
        uses_real_services: realDependencies.some((dependency) =>
          ['supabase', 'network', 'docker', 'subprocess'].includes(dependency),
        ),
        covered_components: sort(dedupe(lower)),
        missing_integration_or_e2e: componentsNeedIntegration(lower),
      };
      const prior = fileToSuites.get(file) || [];
      prior.push(suite.suite_id);
      fileToSuites.set(file, prior);
      return rec;
    });

    suiteDeclarations.push({
      suiteId: suite.suite_id,
      files,
    });

    const gaps = dedupe([
      ...(suite.gaps || []),
      ...(suite.execution_profile === 'ci-declared-but-empty' ? ['suite declared as CI profile without CI files currently in config'] : []),
    ]);

    suites.push({
      suite_id: suite.suite_id,
      glob: suite.glob,
      runner: suite.runner,
      execution_profile: suite.execution_profile,
      manifest_classification: classif,
      files,
      ci_files: ciFiles,
      real_dependencies: realDependencies,
      coverage_components: sort(dedupe(suite.coverage.components.map(normalizePath))),
      gaps,
      dependencies_real_services: realDependencies.some((dependency) =>
        ['supabase', 'network', 'docker', 'subprocess'].includes(dependency),
      ),
      file_records: fileRecords,
    });
    suiteCounter[classif] += 1;
  }

  const declaredSet = new Set<string>();
  for (const declaration of suiteDeclarations) {
    for (const file of declaration.files) {
      declaredSet.add(file);
    }
  }

  const undeclared = [...discoveredFilesSet].filter((file) => !declaredSet.has(file)).sort((a, b) => a.localeCompare(b, 'en-US'));

  const overlapping = [...fileToSuites.entries()]
    .filter((entry) => entry[1].length > 1)
    .map(([file, suites]) => ({ file, suites: sort(suites) }));

  const allCoverage = sort(dedupe(suites.flatMap((suite) => suite.coverage_components)));

  const explicitGaps = dedupe([
    'tests/unit/*.ts is out-of-band relative to current Vitest include config',
    'automation-self-improvement/agentops/tests/**/*.ts is out-of-band relative to current Vitest include config',
    'local Supabase integration tests skip when Supabase is unavailable, so they are not reliable CI coverage',
    'there is no end-to-end suite spanning workflow trigger -> runtime/persistence -> evaluation/integration',
    ...suites.flatMap((suite) => suite.gaps || []),
  ]);

  return {
    generated_at: GENERATED_AT,
    source_manifest: normalizePath(path.relative(REPO_ROOT, DEFAULT_MANIFEST_PATH)),
    generator: GENERATED_BY,
    vitest: {
      include: vitestConfig.include,
      exclude: vitestConfig.exclude,
    },
    suites,
    discovered_test_files: sort([...discoveredFilesSet]),
    declared_test_files: sort([...declaredSet]),
    undeclared_test_files: undeclared,
    overlapping_test_files: overlapping,
    coverage_components: allCoverage,
    classification: {
      total_suites: suites.length,
      by_classification: suiteCounter,
    },
    explicit_gaps: explicitGaps,
  };
}

function markdownTable(headers: string[], rows: string[][]): string {
  const escapePipe = (value: string): string => value.replace(/\|/g, '\\|');
  const header = `| ${headers.map(escapePipe).join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.map((cell) => escapePipe(cell)).join(' | ')} |`).join('\n');
  return `${header}\n${separator}\n${body}`;
}

function formatList(items: string[]): string {
  if (items.length === 0) {
    return '- None';
  }
  return items.map((item) => `- ${item}`).join('\n');
}

function formatReferenceLinks(items: string[]): string {
  if (items.length === 0) {
    return '- None';
  }
  return items.map((item) => `- [${item}](${item})`).join('\n');
}

function generateIndex(manifest: Manifest): string {
  const planes = [
    ['decision', manifest.systems.filter((system) => system.id === 'decision-plane').map((system) => system.name).join(', ') || 'Not declared'],
    ['execution', manifest.systems.filter((system) => system.id === 'execution-plane').map((system) => system.name).join(', ') || 'Not declared'],
    ['learning', manifest.systems.filter((system) => system.id === 'learning-plane').map((system) => system.name).join(', ') || 'Not declared'],
    ['governance', manifest.systems.filter((system) => system.id === 'governance-plane').map((system) => system.name).join(', ') || 'Not declared'],
  ];

  return `${BANNER}
# Unified Autonomy Control Plane

**Version:** ${manifest.version}
**Repo:** ${manifest.repo.name}
**Branch:** ${manifest.repo.branch}
**Planes:** decision / execution / learning

## Scope

ADR-017 establishes a declarative source of truth for unified autonomy, architecture, and test coverage truth.

## Canonical Surfaces

- [System map](./01-systems.md)
- [Workflows and states](./02-workflows-and-state.md)
- [Generation and drift gates](./03-generation-and-drift.md)
- [Test truth](./04-test-truth.md)

## Plane assignment

${markdownTable(['Plane', 'Primary system'], planes)}

## Workflow Inventory

${markdownTable(
  ['Workflow ID', 'Plane', 'Trigger', 'States'],
  manifest.workflows.map((workflow) => [workflow.id, workflow.plane, workflow.trigger, workflow.states.join(', ')]),
)}
`;
}

function generateSystems(manifest: Manifest): string {
  return `${BANNER}
# 01-systems

${markdownTable(
  ['System ID', 'Name', 'Maturity', 'Owner Workflows', 'Upstream artifacts', 'Downstream artifacts'],
  manifest.systems.map((system) => [
    system.id,
    system.name,
    system.maturity,
    system.owner_workflows.join(', '),
    (system.upstream_artifacts || []).join(', ') || 'None',
    (system.downstream_artifacts || []).join(', ') || 'None',
  ]),
)}

## Paths

${manifest.systems
  .map((system) => `### ${system.name}\n\n${formatList(system.paths.map((entry) => '`' + entry + '`'))}\n`)
  .join('\n')}

## Entrypoints

${manifest.systems
  .map((system) => `### ${system.name}\n\n${formatList(system.entrypoints.map((entry) => '`' + entry + '`'))}\n`)
  .join('\n')}
`;
}

function generateWorkflows(manifest: Manifest): string {
  return `${BANNER}
# 02-workflows-and-state

${markdownTable(
  ['Workflow ID', 'Plane', 'Maturity', 'Trigger', 'Steps', 'States', 'Inputs', 'Outputs', 'Gates'],
  manifest.workflows.map((workflow) => [
    workflow.id,
    workflow.plane,
    workflow.maturity,
    workflow.trigger,
    workflow.steps.join('; '),
    workflow.states.join('; '),
    workflow.inputs.join('; '),
    workflow.outputs.join('; '),
    workflow.gates.join('; '),
  ]),
)}
`;
}

function generateDrift(manifest: Manifest): string {
  return `${BANNER}
# 03-generation-and-drift

## Drift Rules

${markdownTable(
  ['Rule ID', 'Severity', 'Matcher', 'Failure Message'],
  manifest.drift_rules.map((rule) => {
    const matcherDisplay = rule.legacy_prefixes
      ? `legacy-prefix-list: ${rule.legacy_prefixes.join(', ')}`
      : rule.matcher;
    return [rule.id, rule.severity, matcherDisplay, rule.failure_message];
  }),
)}

## Generated Artifacts

${manifest.artifacts
  .map(
    (artifact) => `### ${artifact.id}\n- kind: ${artifact.kind}\n- path: \`${artifact.path}\`\n- produced by: \`${artifact.produced_by}\`\n- consumed by: ${artifact.consumed_by.map((item) => `\`${item}\``).join(', ') || 'None'}`,
  )
  .join('\n\n')}

### Generator

- manifest: \`${manifest.generation.source_of_truth}\`
- generated output by: \`${manifest.generation.generated_by}\`
- generated from: \`${manifest.generation.generated_from}\`
`;
}

function generateTestTruth(manifest: Manifest, testTruth: TestTruth): string {
  return `${BANNER}
# 04-test-truth

Source of truth: \`${manifest.generation.source_of_truth}\`

## Vitest Inclusion Surface

- include: ${testTruth.vitest.include.length > 0 ? testTruth.vitest.include.map((value) => `\`${value}\``).join(', ') : 'None'}
- exclude: ${testTruth.vitest.exclude.length > 0 ? testTruth.vitest.exclude.map((value) => `\`${value}\``).join(', ') : 'None'}

## Summary by classification

${markdownTable(
  ['Classification', 'Suite count'],
  (Object.entries(testTruth.classification.by_classification) as Array<[TestExecutionProfile, number]>).map(([profile, count]) => [profile, String(count)]),
)}

## Suites

${markdownTable(
  ['Suite', 'Runner', 'Manifest profile', 'Computed profile', 'Declared files', 'CI files', 'Uses real services'],
  testTruth.suites.map((suite) => [
    suite.suite_id,
    suite.runner,
    suite.execution_profile,
    suite.manifest_classification,
    String(suite.files.length),
    String(suite.ci_files.length),
    suite.dependencies_real_services ? 'yes' : 'no',
  ]),
)}

## Explicit Gaps

${formatList(testTruth.explicit_gaps)}

## Declared test files

${markdownTable(
  ['Suite', 'File', 'CI executed', 'Uses real services', 'Covered components'],
  testTruth.suites.flatMap((suite) =>
    suite.file_records.map((record) => [
      suite.suite_id,
      record.file,
      record.ci_executed ? 'yes' : 'no',
      record.uses_real_services ? 'yes' : 'no',
      record.covered_components.join(', ') || 'None',
    ]),
  ),
)}

## Unknown test files

${formatList(testTruth.undeclared_test_files)}
`;
}

async function buildManifestBundle(manifestPath = DEFAULT_MANIFEST_PATH): Promise<{ manifest: Manifest; testTruth: TestTruth; artifacts: GeneratedArtifacts }> {
  const raw = await fsp.readFile(manifestPath, 'utf8');
  const parsed = parse(raw);
  const validManifest = validateManifest(parsed);
  const manifest = normalizeManifest(validManifest);

  const vitest = await getVitestConfig();
  const testTruth = await buildTestTruth(manifest, vitest);

  const artifactBundle: GeneratedArtifacts = {
    markdown: {
      '.specs/unified-autonomy-control-plane/00-index.md': `${generateIndex(manifest)}\n`,
      '.specs/unified-autonomy-control-plane/01-systems.md': `${generateSystems(manifest)}\n`,
      '.specs/unified-autonomy-control-plane/02-workflows-and-state.md': `${generateWorkflows(manifest)}\n`,
      '.specs/unified-autonomy-control-plane/03-generation-and-drift.md': `${generateDrift(manifest)}\n`,
      '.specs/unified-autonomy-control-plane/04-test-truth.md': `${generateTestTruth(manifest, testTruth)}\n`,
    },
    json: {
      'automation-self-improvement/control-plane/generated/control-plane.json': `${JSON.stringify(
        {
          generated_at: GENERATED_AT,
          generator: GENERATED_BY,
          manifest,
          test_surfaces: {
            declared: testTruth.declared_test_files,
            discovered: testTruth.discovered_test_files,
            undeclared: testTruth.undeclared_test_files,
          },
        },
        null,
        2,
      )}\n`,
      'automation-self-improvement/control-plane/generated/test-truth.json': `${JSON.stringify(testTruth, null, 2)}\n`,
    },
  };

  return {
    manifest,
    testTruth,
    artifacts: artifactBundle,
  };
}

async function writeBundle(bundle: GeneratedArtifacts): Promise<void> {
  for (const [target, content] of Object.entries(bundle.markdown)) {
    const abs = path.resolve(REPO_ROOT, target);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, content, 'utf8');
  }

  for (const [target, content] of Object.entries(bundle.json)) {
    const abs = path.resolve(REPO_ROOT, target);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, content, 'utf8');
  }
}

export async function generateControlPlane(manifestPath = DEFAULT_MANIFEST_PATH): Promise<GeneratedArtifacts> {
  const generated = await buildManifestBundle(manifestPath);
  return generated.artifacts;
}

export async function getManifest(manifestPath = DEFAULT_MANIFEST_PATH): Promise<Manifest> {
  const raw = await fsp.readFile(manifestPath, 'utf8');
  const parsed = parse(raw);
  return normalizeManifest(validateManifest(parsed));
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  void (async () => {
    const bundle = await buildManifestBundle();
    await writeBundle(bundle.artifacts);
    console.log('Generated control-plane artifacts under .specs/unified-autonomy-control-plane and automation-self-improvement/control-plane/generated');
  })().catch((error) => {
    console.error('Error generating control-plane artifacts:', error);
    process.exitCode = 1;
  });
}

export { normalizeManifest, validateManifest, buildManifestBundle };
