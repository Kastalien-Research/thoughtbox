import type { NotebookMode } from "./domain.js";

export interface NotebookModeDescriptor {
  mode: NotebookMode;
  title: string;
  whenToUse: string;
  requiredInputs: string[];
  expectedOutputs: string[];
  templates: string[];
  exampleSequence: Array<{ operation: string; args: Record<string, unknown> }>;
}

export const NOTEBOOK_MODE_REGISTRY: Record<NotebookMode, NotebookModeDescriptor> = {
  runbook: {
    mode: "runbook",
    title: "Functional Skill Runbook",
    whenToUse:
      "Use when an agent workflow should be reusable, stepwise, and gated by deterministic validators.",
    requiredInputs: ["task description", "ordered steps", "validator cells"],
    expectedOutputs: ["step results", "validator verdicts", "runbook summary"],
    templates: ["evidence-runbook"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "Runbook", language: "typescript", template: "evidence-runbook" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "runbook", executionMode: "sync" } },
    ],
  },
  simulation: {
    mode: "simulation",
    title: "Monte Carlo Simulation Notebook",
    whenToUse:
      "Use when stochastic or parameterized experiments should influence reasoning with repeatable seeds and aggregates.",
    requiredInputs: ["simulation kernel", "seed", "run count", "parameter ranges"],
    expectedOutputs: ["summary statistics", "sample artifact", "interpretation"],
    templates: ["evidence-simulation"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "Simulation", language: "typescript", template: "evidence-simulation" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "simulation", inputs: { runs: 1000, seed: "demo" } } },
    ],
  },
  eval: {
    mode: "eval",
    title: "Executable Evaluation Workbook",
    whenToUse:
      "Use when a model, tool, claim, or workflow needs a scored executable evaluation rather than narrative judgment.",
    requiredInputs: ["dataset", "grader cells", "score schema"],
    expectedOutputs: ["scorecard", "metrics", "grader evidence"],
    templates: ["evidence-eval-workbook"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "Eval Workbook", language: "typescript", template: "evidence-eval-workbook" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "eval", executionMode: "sync" } },
    ],
  },
  failure_capsule: {
    mode: "failure_capsule",
    title: "Failure Capsule / Debugging Lab",
    whenToUse:
      "Use when a bug, production incident, or agent failure should become replayable and regression-testable.",
    requiredInputs: ["symptom", "reproduction", "observed evidence", "fix validator"],
    expectedOutputs: ["reproduction result", "fix verdict", "regression artifact"],
    templates: ["evidence-failure-capsule"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "Failure Capsule", language: "typescript", template: "evidence-failure-capsule" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "failure_capsule", executionMode: "sync" } },
    ],
  },
  adr_evidence: {
    mode: "adr_evidence",
    title: "Executable ADR Evidence Pack",
    whenToUse:
      "Use when an architectural hypothesis needs executable evidence attached to the ADR lifecycle.",
    requiredInputs: ["ADR id", "hypothesis", "prediction", "validation cells"],
    expectedOutputs: ["validated/rejected/inconclusive outcome", "evidence record"],
    templates: ["evidence-adr-pack"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "ADR Evidence", language: "typescript", template: "evidence-adr-pack" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "adr_evidence", executionMode: "sync" } },
    ],
  },
  skill_certification: {
    mode: "skill_certification",
    title: "Skill Certification Harness",
    whenToUse:
      "Use when a reusable skill needs positive, adversarial, and negative-control proof obligations.",
    requiredInputs: ["skill name", "case matrix", "certification validators"],
    expectedOutputs: ["certification verdict", "case-level evidence"],
    templates: ["evidence-skill-certification"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "Skill Certification", language: "typescript", template: "evidence-skill-certification" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "skill_certification", executionMode: "sync" } },
    ],
  },
  scenario_factory: {
    mode: "scenario_factory",
    title: "Dataset And Scenario Factory",
    whenToUse:
      "Use when tests or evals need parameterized, schema-validated generated scenarios.",
    requiredInputs: ["scenario schema", "generation parameters", "validation cells"],
    expectedOutputs: ["generated dataset artifact", "schema validation summary"],
    templates: ["evidence-scenario-factory"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "Scenario Factory", language: "typescript", template: "evidence-scenario-factory" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "scenario_factory", executionMode: "sync" } },
    ],
  },
  system_audit: {
    mode: "system_audit",
    title: "Living System Audit",
    whenToUse:
      "Use when repo, protocol, or infrastructure invariants should be checked repeatedly and reported as issue-ready findings.",
    requiredInputs: ["invariant set", "audit cells", "finding schema"],
    expectedOutputs: ["audit findings", "pass/fail summary", "evidence artifacts"],
    templates: ["evidence-system-audit"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "System Audit", language: "typescript", template: "evidence-system-audit" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "system_audit", executionMode: "sync" } },
    ],
  },
};

export function listNotebookModes(): NotebookModeDescriptor[] {
  return Object.values(NOTEBOOK_MODE_REGISTRY);
}

export function getNotebookMode(mode: string): NotebookModeDescriptor | undefined {
  return (NOTEBOOK_MODE_REGISTRY as Record<string, NotebookModeDescriptor>)[mode];
}

export function getNotebookCapabilitiesJson(): string {
  return JSON.stringify(
    {
      version: "1.0",
      description:
        "Notebook Evidence Engine capabilities: executable, replayable notebooks with prose, code, validators, structured outputs, and durable run artifacts.",
      lowLevelPredicatePrimitive: "notebook_validate",
      durableOrchestration:
        "Supabase run records are the durable state machine; long compute belongs in the Cloud Run runner.",
      observatoryScope:
        "Observatory integration is out of scope. Outputs are local-first notebook exports and run artifacts.",
      modes: listNotebookModes(),
    },
    null,
    2,
  );
}

export function getNotebookCapabilitiesMarkdown(): string {
  const modeDocs = listNotebookModes()
    .map((mode) => {
      const sequence = mode.exampleSequence
        .map((step) => `  - \`${step.operation}\` ${JSON.stringify(step.args)}`)
        .join("\n");
      return `### ${mode.title}\n\n**Mode:** \`${mode.mode}\`\n\n**When to use:** ${mode.whenToUse}\n\n**Required inputs:** ${mode.requiredInputs.join(", ")}\n\n**Expected outputs:** ${mode.expectedOutputs.join(", ")}\n\n**Templates:** ${mode.templates.map((t) => `\`${t}\``).join(", ")}\n\n**Example sequence:**\n${sequence}`;
    })
    .join("\n\n");

  return `# Notebook Evidence Engine Capabilities

Thoughtbox notebooks are an evidence engine: executable Markdown artifacts that combine prose, code, deterministic validators, structured outputs, and replayable runs.

Use \`notebook_validate\` as the low-level predicate primitive. Use \`notebook_start_run\` when a full notebook mode should produce artifacts, scorecards, simulation summaries, audit findings, or certification results.

Long-running execution should be coordinated through persisted run records and a Cloud Run runner. Observatory integration is intentionally out of scope.

${modeDocs}
`;
}
