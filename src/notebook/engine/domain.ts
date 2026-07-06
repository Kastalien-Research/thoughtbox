import { Context, Data, Match, Schema as S } from "effect";

export const NotebookModeSchema = S.Literal(
  "runbook",
  "simulation",
  "eval",
  "failure_capsule",
  "adr_evidence",
  "skill_certification",
  "scenario_factory",
  "system_audit",
  "merge_evidence",
);
export type NotebookMode = typeof NotebookModeSchema.Type;

export const JsonRecordSchema = S.Record({
  key: S.String,
  value: S.Unknown,
});

export const ArtifactRefSchema = S.Struct({
  artifactId: S.String,
  name: S.String,
  mimeType: S.String,
  sizeBytes: S.Number,
});
export type ArtifactRef = typeof ArtifactRefSchema.Type;

const CellBaseSchema = {
  id: S.String,
  tags: S.optional(S.Array(S.String)),
  dependsOn: S.optional(S.Array(S.String)),
};

export const TitleCellSchema = S.Struct({
  ...CellBaseSchema,
  _tag: S.Literal("TitleCell"),
  type: S.Literal("title"),
  role: S.Literal("title"),
  text: S.String,
});

export const MarkdownCellSchema = S.Struct({
  ...CellBaseSchema,
  _tag: S.Literal("MarkdownCell"),
  type: S.Literal("markdown"),
  role: S.Literal("prose", "evidence", "hypothesis", "instructions"),
  text: S.String,
});

export const PackageJsonCellSchema = S.Struct({
  ...CellBaseSchema,
  _tag: S.Literal("PackageJsonCell"),
  type: S.Literal("package.json"),
  role: S.Literal("dependencies"),
  filename: S.Literal("package.json"),
  source: S.String,
});

export const CodeCellSchema = S.Struct({
  ...CellBaseSchema,
  _tag: S.Literal("CodeCell"),
  type: S.Literal("code"),
  role: S.Literal(
    "setup",
    "step",
    "validator",
    "simulation",
    "grader",
    "generator",
    "audit",
    "analysis",
  ),
  language: S.Literal("javascript", "typescript"),
  filename: S.String,
  source: S.String,
  validatorFor: S.optional(S.String),
  outputName: S.optional(S.String),
});

/**
 * Await cell (SPEC-AGX-SUBSTRATE B6 — claim c4): a claim subscription plus a
 * predicate over the claim's current status ("claim X reaches one of
 * `until`"). Satisfaction marks the cell runnable; it executes nothing.
 * Evaluated pull-only by the advancer (tb.runbook.advance, B8).
 */
export const AwaitCellSchema = S.Struct({
  ...CellBaseSchema,
  _tag: S.Literal("AwaitCell"),
  type: S.Literal("await"),
  role: S.Literal("await"),
  claimId: S.String,
  until: S.Array(
    S.Literal("asserted", "supported", "invalidated", "superseded"),
  ),
});

export const NotebookCellSchema = S.Union(
  TitleCellSchema,
  MarkdownCellSchema,
  PackageJsonCellSchema,
  CodeCellSchema,
  AwaitCellSchema,
);
export type NotebookCell = typeof NotebookCellSchema.Type;

const NotebookBaseSchema = {
  schemaVersion: S.Literal("1.0"),
  id: S.String,
  language: S.Literal("javascript", "typescript"),
  cells: S.Array(NotebookCellSchema),
  createdAt: S.Number,
  updatedAt: S.Number,
};

export const RunbookNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("RunbookNotebook"),
  mode: S.Literal("runbook"),
  parameters: S.optional(JsonRecordSchema),
});

export const SimulationNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("SimulationNotebook"),
  mode: S.Literal("simulation"),
  simulation: S.Struct({
    runs: S.Number,
    seed: S.String,
    parameters: JsonRecordSchema,
  }),
});

export const EvalNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("EvalNotebook"),
  mode: S.Literal("eval"),
  eval: S.Struct({
    datasetName: S.String,
    scoreName: S.String,
  }),
});

export const FailureCapsuleNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("FailureCapsuleNotebook"),
  mode: S.Literal("failure_capsule"),
  failure: S.Struct({
    symptom: S.String,
    reproduction: S.String,
  }),
});

export const AdrEvidenceNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("AdrEvidenceNotebook"),
  mode: S.Literal("adr_evidence"),
  adr: S.Struct({
    adrId: S.String,
    hypothesis: S.String,
  }),
});

export const SkillCertificationNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("SkillCertificationNotebook"),
  mode: S.Literal("skill_certification"),
  skill: S.Struct({
    name: S.String,
    version: S.String,
  }),
});

export const ScenarioFactoryNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("ScenarioFactoryNotebook"),
  mode: S.Literal("scenario_factory"),
  scenario: S.Struct({
    schemaName: S.String,
    count: S.Number,
  }),
});

export const SystemAuditNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("SystemAuditNotebook"),
  mode: S.Literal("system_audit"),
  audit: S.Struct({
    invariantSet: S.String,
  }),
});

export const MergeEvidenceNotebookSchema = S.Struct({
  ...NotebookBaseSchema,
  _tag: S.Literal("MergeEvidenceNotebook"),
  mode: S.Literal("merge_evidence"),
  merge: S.Struct({
    mergeId: S.String,
    workspaceId: S.String,
    parentBranchIds: S.Array(S.String),
  }),
});

export const NotebookDocumentSchema = S.Union(
  RunbookNotebookSchema,
  SimulationNotebookSchema,
  EvalNotebookSchema,
  FailureCapsuleNotebookSchema,
  AdrEvidenceNotebookSchema,
  SkillCertificationNotebookSchema,
  ScenarioFactoryNotebookSchema,
  SystemAuditNotebookSchema,
  MergeEvidenceNotebookSchema,
);
export type NotebookDocument = typeof NotebookDocumentSchema.Type;

export const ValidatorRefSchema = S.Struct({
  _tag: S.Literal("ValidatorRef"),
  notebookId: S.String,
  cellId: S.String,
});
export type ValidatorRef = typeof ValidatorRefSchema.Type;

export const BoundValidatorSchema = S.Struct({
  _tag: S.Literal("BoundValidator"),
  notebookId: S.String,
  cellId: S.String,
  snapshotHash: S.String,
  boundAt: S.String,
  snapshot: JsonRecordSchema,
});
export type BoundValidator = typeof BoundValidatorSchema.Type;

export const NotebookOutputSchema = S.Union(
  S.Struct({
    _tag: S.Literal("RunbookVerdict"),
    mode: S.Literal("runbook"),
    pass: S.Boolean,
    reason: S.String,
    /**
     * Fraction of non-validator code cells covered by a declared outcome
     * contract (tier 1) or a tier-2 validator. 0 means the verdict is
     * procedural only — downstream fitness must exclude such runs from
     * pass-rates (SPEC-AGX-SUBSTRATE §5.1).
     */
    contractCoverage: S.Number,
    evidence: S.optional(S.Unknown),
  }),
  S.Struct({
    _tag: S.Literal("SimulationSummary"),
    mode: S.Literal("simulation"),
    runs: S.Number,
    seed: S.String,
    summary: JsonRecordSchema,
    samples: S.optional(ArtifactRefSchema),
  }),
  S.Struct({
    _tag: S.Literal("EvalScorecard"),
    mode: S.Literal("eval"),
    score: S.Number,
    metrics: JsonRecordSchema,
  }),
  S.Struct({
    _tag: S.Literal("FailureCapsuleResult"),
    mode: S.Literal("failure_capsule"),
    reproduced: S.Boolean,
    fixed: S.Boolean,
    regressionArtifact: S.optional(ArtifactRefSchema),
  }),
  S.Struct({
    _tag: S.Literal("AdrEvidenceResult"),
    mode: S.Literal("adr_evidence"),
    outcome: S.Literal("validated", "rejected", "inconclusive"),
    evidence: JsonRecordSchema,
  }),
  S.Struct({
    _tag: S.Literal("SkillCertificationResult"),
    mode: S.Literal("skill_certification"),
    certified: S.Boolean,
    cases: JsonRecordSchema,
  }),
  S.Struct({
    _tag: S.Literal("ScenarioFactoryResult"),
    mode: S.Literal("scenario_factory"),
    generated: S.Number,
    artifact: ArtifactRefSchema,
  }),
  S.Struct({
    _tag: S.Literal("SystemAuditResult"),
    mode: S.Literal("system_audit"),
    findings: S.Array(JsonRecordSchema),
  }),
  S.Struct({
    /**
     * Execution result of a merge-evidence run: same derivation semantics as
     * RunbookVerdict (declared expectations decide; §5.1). The frozen-schema
     * merge verdict JSON is assembled by generateMergeEvidence
     * (src/merge-evidence/) FROM this result — it is not this output.
     */
    _tag: S.Literal("MergeEvidenceRunResult"),
    mode: S.Literal("merge_evidence"),
    pass: S.Boolean,
    reason: S.String,
    contractCoverage: S.Number,
    evidence: S.optional(S.Unknown),
  }),
);
export type NotebookOutput = typeof NotebookOutputSchema.Type;

const RunBaseSchema = {
  runId: S.String,
  notebookId: S.String,
  mode: NotebookModeSchema,
  createdAt: S.String,
};

export const NotebookRunSchema = S.Union(
  S.Struct({
    ...RunBaseSchema,
    _tag: S.Literal("RunningRun"),
    status: S.Literal("running"),
    startedAt: S.String,
  }),
  S.Struct({
    ...RunBaseSchema,
    _tag: S.Literal("CompletedRun"),
    status: S.Literal("completed"),
    startedAt: S.String,
    completedAt: S.String,
    outputs: S.Array(NotebookOutputSchema),
    artifacts: S.Array(ArtifactRefSchema),
  }),
  S.Struct({
    ...RunBaseSchema,
    _tag: S.Literal("FailedRun"),
    status: S.Literal("failed"),
    startedAt: S.String,
    completedAt: S.String,
    error: S.String,
  }),
  S.Struct({
    ...RunBaseSchema,
    _tag: S.Literal("CancelledRun"),
    status: S.Literal("cancelled"),
    startedAt: S.optional(S.String),
    completedAt: S.String,
    reason: S.String,
  }),
);
export type NotebookRun = typeof NotebookRunSchema.Type;

export const EphemeralNotebookSchema = S.Struct({
  _tag: S.Literal("EphemeralNotebook"),
  document: NotebookDocumentSchema,
});
export const PersistedNotebookSchema = S.Struct({
  _tag: S.Literal("PersistedNotebook"),
  document: NotebookDocumentSchema,
  workspaceId: S.String,
  persistedAt: S.String,
});
export const NotebookPersistenceSchema = S.Union(
  EphemeralNotebookSchema,
  PersistedNotebookSchema,
);
export type NotebookPersistence = typeof NotebookPersistenceSchema.Type;

export class InvalidNotebookShape extends Data.TaggedError("InvalidNotebookShape")<{
  readonly reason: string;
}> {}
export class ValidatorFailed extends Data.TaggedError("ValidatorFailed")<{
  readonly reason: string;
}> {}
export class SnapshotMismatch extends Data.TaggedError("SnapshotMismatch")<{
  readonly expected: string;
  readonly actual: string;
}> {}
export class RunnerTimeout extends Data.TaggedError("RunnerTimeout")<{
  readonly timeoutMs: number;
}> {}
export class SandboxDenied extends Data.TaggedError("SandboxDenied")<{
  readonly reason: string;
}> {}
export class ArtifactTooLarge extends Data.TaggedError("ArtifactTooLarge")<{
  readonly sizeBytes: number;
  readonly maxBytes: number;
}> {}
export class StoreUnavailable extends Data.TaggedError("StoreUnavailable")<{
  readonly store: string;
  readonly reason: string;
}> {}
export class NotebookModeNotImplemented extends Data.TaggedError(
  "NotebookModeNotImplemented",
)<{
  readonly mode: string;
  readonly reason: string;
}> {
  override get message(): string {
    return this.reason;
  }
}

export type NotebookEngineError =
  | InvalidNotebookShape
  | ValidatorFailed
  | SnapshotMismatch
  | RunnerTimeout
  | SandboxDenied
  | ArtifactTooLarge
  | StoreUnavailable
  | NotebookModeNotImplemented;

export interface NotebookStore {
  readonly save: (notebook: NotebookPersistence) => Promise<void>;
  readonly load: (notebookId: string) => Promise<NotebookPersistence | null>;
}

export interface NotebookRunStore {
  readonly saveRun: (run: NotebookRun) => Promise<void>;
  readonly getRun: (runId: string) => Promise<NotebookRun | null>;
  readonly listRuns: (notebookId?: string) => Promise<NotebookRun[]>;
}

export interface ArtifactStore {
  readonly put: (name: string, mimeType: string, content: string) => Promise<ArtifactRef>;
  readonly get: (artifactId: string) => Promise<{ ref: ArtifactRef; content: string } | null>;
}

export interface SandboxExecutor {
  readonly execute: (input: {
    readonly notebookId: string;
    readonly cellId: string;
    readonly timeoutMs: number;
  }) => Promise<unknown>;
}

export class NotebookStoreService extends Context.Tag("NotebookStore")<
  NotebookStoreService,
  NotebookStore
>() {}
export class NotebookRunStoreService extends Context.Tag("NotebookRunStore")<
  NotebookRunStoreService,
  NotebookRunStore
>() {}
export class ArtifactStoreService extends Context.Tag("ArtifactStore")<
  ArtifactStoreService,
  ArtifactStore
>() {}
export class SandboxExecutorService extends Context.Tag("SandboxExecutor")<
  SandboxExecutorService,
  SandboxExecutor
>() {}

export function describeRunStatus(run: NotebookRun): string {
  return Match.value(run).pipe(
    Match.tagsExhaustive({
      RunningRun: () => "running",
      CompletedRun: (r) => `completed:${r.outputs.length}`,
      FailedRun: (r) => `failed:${r.error}`,
      CancelledRun: (r) => `cancelled:${r.reason}`,
    }),
  );
}

export function parseNotebookDocument(input: unknown): NotebookDocument {
  return S.decodeUnknownSync(NotebookDocumentSchema)(input);
}

export function parseNotebookRun(input: unknown): NotebookRun {
  return S.decodeUnknownSync(NotebookRunSchema)(input);
}
