import { Effect, Schema as S } from "effect";
import type {
  ArtifactRef,
  NotebookMode,
  NotebookOutput,
  NotebookRun,
} from "./domain.js";
import {
  ArtifactTooLarge,
  InvalidNotebookShape,
  NotebookModeSchema,
  describeRunStatus,
} from "./domain.js";
import { getNotebookMode } from "./registry.js";

const MAX_ARTIFACT_BYTES = 1_000_000;

export interface StartNotebookRunInput {
  notebookId: string;
  mode: NotebookMode;
  executionMode?: "sync" | "async";
  inputs?: Record<string, unknown>;
}

export interface NotebookRunRuntimeResult {
  run: NotebookRun;
  message: string;
}

export class InMemoryNotebookEngineRuntime {
  private runs = new Map<string, NotebookRun>();
  private artifacts = new Map<string, { ref: ArtifactRef; content: string }>();

  persistNotebook(notebookId: string, content: string) {
    return Effect.gen(this, function* () {
      const artifact = yield* this.putArtifact(
        `${notebookId}.src.md`,
        "text/markdown",
        content,
      );
      return {
        success: true,
        notebookId,
        persistence: "in_memory",
        artifact,
      };
    });
  }

  startRun(input: StartNotebookRunInput) {
    return Effect.gen(this, function* () {
      const descriptor = getNotebookMode(input.mode);
      if (!descriptor) {
        return yield* Effect.fail(
          new InvalidNotebookShape({
            reason: `Unknown notebook mode: ${input.mode}`,
          }),
        );
      }

      const createdAt = new Date().toISOString();
      const runId = `nbr_${Math.random().toString(36).slice(2, 12)}`;
      const executionMode = input.executionMode ?? "sync";

      const parsedMode = yield* Effect.try({
        try: () => S.decodeUnknownSync(NotebookModeSchema)(input.mode),
        catch: () =>
          new InvalidNotebookShape({
            reason: `Invalid notebook mode: ${input.mode}`,
          }),
      });

      if (executionMode === "async") {
        const queued: NotebookRun = {
          _tag: "QueuedRun",
          runId,
          notebookId: input.notebookId,
          mode: parsedMode,
          status: "queued",
          createdAt,
        };
        this.runs.set(runId, queued);
        return {
          run: queued,
          message:
            "Run queued for external notebook runner. Supabase/Cloud Run worker dispatch is the durable v1 boundary.",
        } satisfies NotebookRunRuntimeResult;
      }

      const startedAt = new Date().toISOString();
      const running: NotebookRun = {
        _tag: "RunningRun",
        runId,
        notebookId: input.notebookId,
        mode: parsedMode,
        status: "running",
        createdAt,
        startedAt,
      };
      this.runs.set(runId, running);

      const artifact = yield* this.putArtifact(
        `${runId}-inputs.json`,
        "application/json",
        JSON.stringify(input.inputs ?? {}, null, 2),
      );

      const completedAt = new Date().toISOString();
      const completed: NotebookRun = {
        _tag: "CompletedRun",
        runId,
        notebookId: input.notebookId,
        mode: parsedMode,
        status: "completed",
        createdAt,
        startedAt,
        completedAt,
        outputs: [buildModeOutput(parsedMode, input.inputs ?? {}, artifact)],
        artifacts: [artifact],
      };
      this.runs.set(runId, completed);

      return {
        run: completed,
        message: describeRunStatus(completed),
      } satisfies NotebookRunRuntimeResult;
    });
  }

  getRun(runId: string): NotebookRun | null {
    return this.runs.get(runId) ?? null;
  }

  listRuns(notebookId?: string): NotebookRun[] {
    const runs = Array.from(this.runs.values());
    if (!notebookId) return runs;
    return runs.filter((run) => run.notebookId === notebookId);
  }

  cancelRun(runId: string, reason = "cancelled by caller"): NotebookRun | null {
    const run = this.runs.get(runId);
    if (!run) return null;
    if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
      return run;
    }
    const cancelled: NotebookRun = {
      _tag: "CancelledRun",
      runId: run.runId,
      notebookId: run.notebookId,
      mode: run.mode,
      status: "cancelled",
      createdAt: run.createdAt,
      startedAt: "startedAt" in run ? run.startedAt : undefined,
      completedAt: new Date().toISOString(),
      reason,
    };
    this.runs.set(runId, cancelled);
    return cancelled;
  }

  getArtifact(artifactId: string): { ref: ArtifactRef; content: string } | null {
    return this.artifacts.get(artifactId) ?? null;
  }

  private putArtifact(name: string, mimeType: string, content: string) {
    return Effect.gen(this, function* () {
      const sizeBytes = Buffer.byteLength(content, "utf8");
      if (sizeBytes > MAX_ARTIFACT_BYTES) {
        return yield* Effect.fail(
          new ArtifactTooLarge({ sizeBytes, maxBytes: MAX_ARTIFACT_BYTES }),
        );
      }
      const artifactId = `nba_${Math.random().toString(36).slice(2, 12)}`;
      const ref: ArtifactRef = { artifactId, name, mimeType, sizeBytes };
      this.artifacts.set(artifactId, { ref, content });
      return ref;
    });
  }
}

function buildModeOutput(
  mode: NotebookMode,
  inputs: Record<string, unknown>,
  artifact: ArtifactRef,
): NotebookOutput {
  switch (mode) {
    case "runbook":
      return {
        _tag: "RunbookVerdict",
        mode,
        pass: true,
        reason: "runbook substrate smoke run completed",
        evidence: inputs,
      };
    case "simulation":
      return {
        _tag: "SimulationSummary",
        mode,
        runs: typeof inputs.runs === "number" ? inputs.runs : 0,
        seed: typeof inputs.seed === "string" ? inputs.seed : "unseeded",
        summary: { status: "simulation substrate smoke run" },
        samples: artifact,
      };
    case "eval":
      return {
        _tag: "EvalScorecard",
        mode,
        score: 1,
        metrics: { status: "eval substrate smoke run" },
      };
    case "failure_capsule":
      return {
        _tag: "FailureCapsuleResult",
        mode,
        reproduced: false,
        fixed: false,
        regressionArtifact: artifact,
      };
    case "adr_evidence":
      return {
        _tag: "AdrEvidenceResult",
        mode,
        outcome: "inconclusive",
        evidence: { status: "adr evidence substrate smoke run" },
      };
    case "skill_certification":
      return {
        _tag: "SkillCertificationResult",
        mode,
        certified: false,
        cases: { status: "skill certification substrate smoke run" },
      };
    case "scenario_factory":
      return {
        _tag: "ScenarioFactoryResult",
        mode,
        generated: typeof inputs.count === "number" ? inputs.count : 0,
        artifact,
      };
    case "system_audit":
      return {
        _tag: "SystemAuditResult",
        mode,
        findings: [{ status: "system audit substrate smoke run" }],
      };
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}
