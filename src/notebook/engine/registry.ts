import type { NotebookMode } from "./domain.js";

export interface NotebookModeDescriptor {
  mode: NotebookMode;
  /**
   * "implemented": notebook_start_run executes cells and derives a real
   * verdict. "specified": the mode is designed (schema, templates, docs)
   * but start_run rejects it with an explicit not-implemented error; use
   * notebook_run_cell and notebook_validate for cell-level evidence.
   */
  runStatus: "implemented" | "specified";
  title: string;
  whenToUse: string;
  requiredInputs: string[];
  expectedOutputs: string[];
  templates: string[];
  exampleSequence: Array<{ operation: string; args: Record<string, unknown> }>;
}

/**
 * Engine mode registry. Every entry corresponds to a NotebookMode literal
 * (domain.ts) and — when runStatus is "implemented" — a verdict builder in
 * runtime.ts. The six speculative stub modes were removed 2026-07-06; their
 * .src.md files survive as plain notebook_create authoring templates
 * (evidence-simulation, evidence-failure-capsule, evidence-adr-pack,
 * evidence-skill-certification, evidence-scenario-factory,
 * evidence-system-audit). The registry is extensible: register a new mode by
 * adding its literal, schemas, descriptor, and verdict builder.
 */
export const NOTEBOOK_MODE_REGISTRY: Record<NotebookMode, NotebookModeDescriptor> = {
  runbook: {
    mode: "runbook",
    runStatus: "implemented",
    title: "Functional Skill Runbook",
    whenToUse:
      "Use when an agent workflow should be reusable, stepwise, and gated by deterministic validators.",
    requiredInputs: ["task description", "ordered steps", "validator cells"],
    expectedOutputs: ["step results", "validator verdicts", "runbook summary"],
    templates: ["evidence-runbook"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "Runbook", language: "typescript", template: "evidence-runbook" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "runbook" } },
    ],
  },
  eval: {
    mode: "eval",
    runStatus: "implemented",
    title: "Executable Evaluation Workbook",
    whenToUse:
      "Use when a model, tool, claim, or workflow needs a scored executable evaluation rather than narrative judgment.",
    requiredInputs: ["graded cells (tier-1 contracts and/or tier-2 validator cells)"],
    expectedOutputs: [
      "EvalScorecard (score = passed/evaluated over declared expectations)",
      "per-expectation metrics",
      "cell evidence",
    ],
    templates: ["evidence-eval-workbook"],
    exampleSequence: [
      { operation: "notebook_create", args: { title: "Eval Workbook", language: "typescript", template: "evidence-eval-workbook" } },
      { operation: "notebook_start_run", args: { notebookId: "<id>", mode: "eval" } },
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
      execution:
        "Runs execute synchronously in-process through real cell subprocesses. Modes marked implemented derive real verdicts; modes marked specified reject notebook_start_run.",
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
      return `### ${mode.title}\n\n**Mode:** \`${mode.mode}\` (${mode.runStatus})\n\n**When to use:** ${mode.whenToUse}\n\n**Required inputs:** ${mode.requiredInputs.join(", ")}\n\n**Expected outputs:** ${mode.expectedOutputs.join(", ")}\n\n**Templates:** ${mode.templates.map((t) => `\`${t}\``).join(", ")}\n\n**Example sequence:**\n${sequence}`;
    })
    .join("\n\n");

  return `# Notebook Evidence Engine Capabilities

Thoughtbox notebooks are an evidence engine: executable Markdown artifacts that combine prose, code, deterministic validators, structured outputs, and replayable runs.

Use \`notebook_validate\` as the low-level predicate primitive. Use \`notebook_start_run\` to execute a notebook's cells and derive a mode-specific verdict from the real results (a pass/fail RunbookVerdict, or an EvalScorecard scored over declared expectations). Any mode marked **specified** below is designed but not yet runnable through \`notebook_start_run\` — it rejects explicitly; use \`notebook_run_cell\` and \`notebook_validate\` for cell-level evidence in those modes.

Additional evidence-flavoured authoring templates (simulation, failure capsule, ADR pack, skill certification, scenario factory, system audit) remain available through \`notebook_create\`'s \`template\` parameter as plain scaffolds without engine-run verdicts.

Runs execute synchronously in-process. Observatory integration is intentionally out of scope.

${modeDocs}
`;
}
