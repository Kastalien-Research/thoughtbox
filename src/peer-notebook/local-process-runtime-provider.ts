import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  executeCodeCell,
  writeCodeCellToDisk,
  writePackageJsonToDisk,
  writeTsconfigToDisk,
} from "../notebook/execution.js";
import type {
  RuntimeArtifactOutput,
  RuntimeInvocationInput,
  RuntimeInvocationResult,
  RuntimeProvider,
  RuntimeProviderDescription,
} from "./runtime-provider.js";
import type { JsonValue, PeerNotebookCodeSnapshot } from "./types.js";
import { notebookEntryFilename, PeerNotebookError } from "./types.js";

const PROVIDER_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_EXTENSION = import.meta.url.endsWith(".ts") ? ".ts" : ".js";
const SIGKILL_GRACE_MS = 2_000;
const STDERR_LIMIT = 2_000;

const BUILTIN_ENTRIES: Record<string, string> = {
  "claim-extractor": path.join(PROVIDER_DIR, "peers", `claim-extractor${SCRIPT_EXTENSION}`),
};

export interface LocalProcessRuntimeProviderOptions {
  /** Extra entry-name to script-path registrations (test fixtures only). */
  entries?: Record<string, string>;
}

/**
 * Development-only runtime provider executing peer tool invocations in a
 * spawned local child process. This is process separation, NOT isolation:
 * the child shares the host filesystem, network, and environment. Production
 * isolation remains the deferred smolvm unit (SPEC-CONTROL-PLANE, thoughtbox-vdw).
 *
 * v1 boundaries:
 * - Broker-proxied outbound calls (artifact.get input fetch and the pilot
 *   denied probe) happen in the provider BEFORE spawning, so allow/deny trace
 *   events match the mock contract fixture path. In-child broker calls are
 *   out of scope for v1.
 * - Entry scripts resolve from a fixed registry keyed by manifest
 *   runtime.entry, OR — for graduated notebooks — from the immutable code
 *   snapshot captured on the manifest record at graduation
 *   (`runtime.entry: "notebook:<cellFilename>"`). Manifests can never point
 *   at arbitrary filesystem paths.
 * - Notebook entries execute through the notebook execution engine
 *   (src/notebook/execution.ts): the snapshot is materialized into a scratch
 *   directory, the entry cell reads its invocation payload JSON from
 *   TB_PEER_INPUT_PATH and writes `{ result, artifacts }` JSON to
 *   TB_PEER_OUTPUT_PATH.
 * - The manifest budget (budgets.maxDurationMs) is enforced on the child via
 *   SIGTERM, escalating to SIGKILL; cancel() kills the child the same way.
 *   For notebook entries the engine enforces the same budget via its timeout;
 *   cancel() rejects the invocation immediately but the cell process is only
 *   reaped by the engine timeout (v1 gap, acceptable for development-only).
 * - cancel() also covers the pre-spawn window: invocations are tracked from
 *   the moment invoke() is entered, and a cancel arriving while the broker
 *   round trips are still in flight preempts the spawn entirely.
 */
export class LocalProcessRuntimeProvider implements RuntimeProvider {
  private readonly entries: Record<string, string>;
  private readonly children = new Map<string, ChildProcess>();
  private readonly activeInvocations = new Set<string>();
  private readonly cancelledInvocations = new Set<string>();
  private readonly notebookCancels = new Map<string, () => void>();

  constructor(options: LocalProcessRuntimeProviderOptions = {}) {
    this.entries = { ...BUILTIN_ENTRIES, ...options.entries };
  }

  describe(): RuntimeProviderDescription {
    return {
      provider: "local-process",
      isolation: "none",
      developmentOnly: true,
      supportsCancel: true,
      supportsSnapshots: false,
    };
  }

  async invoke(input: RuntimeInvocationInput): Promise<RuntimeInvocationResult> {
    this.activeInvocations.add(input.invocationId);
    try {
      const entryCellFilename = notebookEntryFilename(input.entry);
      const scriptPath = entryCellFilename === null ? this.resolveEntryScript(input) : null;
      const artifactContent = await fetchInputArtifact(input);
      this.throwIfCancelledBeforeSpawn(input.invocationId);

      if (input.tool === "extract_claims" && entryCellFilename === null) {
        // Pilot-parity denied probe: traced as denied_outbound_call exactly as
        // the mock contract fixture path records it.
        await input.brokerProxy.callTool("thoughtbox.knowledge.queryGraph", { query: "denied pilot probe" });
        this.throwIfCancelledBeforeSpawn(input.invocationId);
      }

      const payload = JSON.stringify({
        invocationId: input.invocationId,
        tool: input.tool,
        args: input.args,
        artifactContent,
      });
      if (entryCellFilename !== null) {
        return await this.runNotebookEntry(input, entryCellFilename, payload);
      }
      return await this.runEntryProcess(input, scriptPath as string, payload);
    } finally {
      this.activeInvocations.delete(input.invocationId);
      this.cancelledInvocations.delete(input.invocationId);
      this.notebookCancels.delete(input.invocationId);
    }
  }

  async cancel(input: { invocationId: string }): Promise<void> {
    const child = this.children.get(input.invocationId);
    if (child) {
      this.cancelledInvocations.add(input.invocationId);
      terminate(child);
      return;
    }
    const rejectNotebookRun = this.notebookCancels.get(input.invocationId);
    if (rejectNotebookRun) {
      this.cancelledInvocations.add(input.invocationId);
      rejectNotebookRun();
      return;
    }
    if (this.activeInvocations.has(input.invocationId)) {
      // Pre-spawn window: invoke() is still awaiting broker round trips.
      // Mark for preemption so it rejects as cancelled without spawning.
      this.cancelledInvocations.add(input.invocationId);
    }
  }

  async "snapshot/export"(): Promise<null> {
    return null;
  }

  resolvesEntry(entry: string): boolean {
    // Notebook entries resolve from the manifest's own graduation snapshot,
    // not the fixed registry; the graduation flow validates that the named
    // cell exists in the graduating notebook.
    return notebookEntryFilename(entry) !== null || Object.hasOwn(this.entries, entry);
  }

  async heartbeat(): Promise<void> {}

  private throwIfCancelledBeforeSpawn(invocationId: string): void {
    if (this.cancelledInvocations.has(invocationId)) {
      throw new Error(`Peer process cancelled before spawn for invocation ${invocationId}`);
    }
  }

  private resolveEntryScript(input: RuntimeInvocationInput): string {
    if (!input.entry) {
      throw new PeerNotebookError(
        "invalid_args",
        `Peer ${input.peerId} manifest does not declare the runtime.entry required by local-process`,
      );
    }
    const scriptPath = this.entries[input.entry];
    if (!scriptPath) {
      throw new PeerNotebookError(
        "tool_not_found",
        `No local-process entry script registered for runtime.entry "${input.entry}"`,
      );
    }
    return scriptPath;
  }

  private runEntryProcess(
    input: RuntimeInvocationInput,
    scriptPath: string,
    payload: string,
  ): Promise<RuntimeInvocationResult> {
    const timeoutMs = input.budgets.maxDurationMs;
    const { command, commandArgs } = scriptCommand(scriptPath);

    return new Promise((resolve, reject) => {
      const child = spawn(command, commandArgs, { stdio: ["pipe", "pipe", "pipe"] });
      this.children.set(input.invocationId, child);

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        terminate(child);
      }, timeoutMs);

      child.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      child.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
      // A killed child may never read stdin; the resulting EPIPE is reported
      // through the exit code path below, not as a stream error.
      child.stdin?.on("error", () => {});

      child.on("error", (error: Error) => {
        clearTimeout(timer);
        this.children.delete(input.invocationId);
        this.cancelledInvocations.delete(input.invocationId);
        reject(new Error(`Failed to spawn peer process for invocation ${input.invocationId}: ${error.message}`));
      });

      child.on("close", (code, signal) => {
        clearTimeout(timer);
        this.children.delete(input.invocationId);
        const wasCancelled = this.cancelledInvocations.delete(input.invocationId);

        if (timedOut) {
          reject(new PeerNotebookError(
            "timeout",
            `Peer process exceeded budget maxDurationMs=${timeoutMs} for invocation ${input.invocationId}`,
          ));
          return;
        }
        if (wasCancelled) {
          reject(new Error(`Peer process cancelled for invocation ${input.invocationId}`));
          return;
        }
        if (code !== 0) {
          reject(new Error(
            `Peer process exited with ${code ?? signal ?? "unknown"} for invocation ${input.invocationId}: ${stderr.slice(0, STDERR_LIMIT)}`,
          ));
          return;
        }
        try {
          resolve(parseRuntimeResult(stdout));
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });

      child.stdin?.write(payload);
      child.stdin?.end();
    });
  }

  /**
   * Execute a graduated notebook's entry cell from the manifest's code
   * snapshot: materialize the snapshot into a scratch directory using the
   * notebook execution engine's disk layout (src/<filename>, package.json,
   * tsconfig.json), hand the invocation payload to the cell via
   * TB_PEER_INPUT_PATH, run the cell through executeCodeCell under the
   * manifest budget, and read `{ result, artifacts }` from TB_PEER_OUTPUT_PATH.
   */
  private async runNotebookEntry(
    input: RuntimeInvocationInput,
    entryCellFilename: string,
    payload: string,
  ): Promise<RuntimeInvocationResult> {
    const snapshot = this.requireNotebookSnapshot(input, entryCellFilename);
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "tb-peer-run-"));

    try {
      if (snapshot.tsconfigJson) {
        await writeTsconfigToDisk(workDir, snapshot.tsconfigJson);
      }
      if (snapshot.packageJson) {
        await writePackageJsonToDisk(workDir, snapshot.packageJson);
      }
      for (const cell of snapshot.cells) {
        await writeCodeCellToDisk(workDir, cell.filename, cell.source);
      }

      const inputPath = path.join(workDir, `peer-input-${randomUUID()}.json`);
      const outputPath = path.join(workDir, `peer-output-${randomUUID()}.json`);
      await fs.writeFile(inputPath, payload, "utf8");

      const timeoutMs = input.budgets.maxDurationMs;
      const cancelSignal = new Promise<never>((_, reject) => {
        this.notebookCancels.set(input.invocationId, () => {
          reject(new Error(`Peer process cancelled for invocation ${input.invocationId}`));
        });
      });

      const execution = await Promise.race([
        executeCodeCell(entryCellFilename, snapshot.language, {
          cwd: workDir,
          env: { TB_PEER_INPUT_PATH: inputPath, TB_PEER_OUTPUT_PATH: outputPath },
          timeout: timeoutMs,
        }),
        cancelSignal,
      ]);

      if (this.cancelledInvocations.has(input.invocationId)) {
        throw new Error(`Peer process cancelled for invocation ${input.invocationId}`);
      }
      if (!execution.success) {
        // The engine reports its budget SIGTERM as exitCode -1 plus this
        // stderr marker (src/notebook/execution.ts executeCommand).
        if (/Execution timed out after \d+ms/.test(execution.stderr)) {
          throw new PeerNotebookError(
            "timeout",
            `Peer notebook cell exceeded budget maxDurationMs=${timeoutMs} for invocation ${input.invocationId}`,
          );
        }
        throw new Error(
          `Peer notebook cell ${entryCellFilename} exited with ${execution.exitCode ?? "unknown"} ` +
            `for invocation ${input.invocationId}: ${(execution.stderr || execution.stdout).slice(0, STDERR_LIMIT)}`,
        );
      }

      let resultJson: string;
      try {
        resultJson = await fs.readFile(outputPath, "utf8");
      } catch {
        throw new PeerNotebookError(
          "invalid_result",
          `Peer notebook cell ${entryCellFilename} wrote no result to TB_PEER_OUTPUT_PATH for invocation ${input.invocationId}`,
        );
      }
      return parseRuntimeResult(resultJson);
    } finally {
      this.notebookCancels.delete(input.invocationId);
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private requireNotebookSnapshot(
    input: RuntimeInvocationInput,
    entryCellFilename: string,
  ): PeerNotebookCodeSnapshot {
    const snapshot = input.notebook;
    if (!snapshot) {
      throw new PeerNotebookError(
        "invalid_args",
        `Peer ${input.peerId} runtime.entry "${input.entry}" requires the graduation code snapshot, ` +
          "but the manifest record carries none (compiledFrom.notebook is absent)",
      );
    }
    if (snapshot.entryFilename !== entryCellFilename) {
      throw new PeerNotebookError(
        "invalid_args",
        `Peer ${input.peerId} runtime.entry "${input.entry}" does not match the graduation snapshot ` +
          `entry cell "${snapshot.entryFilename}"`,
      );
    }
    if (!snapshot.cells.some(cell => cell.filename === entryCellFilename)) {
      throw new PeerNotebookError(
        "invalid_args",
        `Peer ${input.peerId} graduation snapshot has no code cell named "${entryCellFilename}"`,
      );
    }
    return snapshot;
  }
}

async function fetchInputArtifact(input: RuntimeInvocationInput): Promise<JsonValue | null> {
  const inputArtifactId = resolveInputArtifactId(input);
  if (input.tool === "extract_claims" && inputArtifactId === null) {
    throw new PeerNotebookError("invalid_args", "extract_claims requires textArtifactId");
  }
  if (inputArtifactId === null) {
    return null;
  }

  const read = await input.brokerProxy.callTool("artifact.get", { artifactId: inputArtifactId });
  if (!read.ok) {
    throw new PeerNotebookError("outbound_denied", read.error.message);
  }
  const body = read.result as { artifact?: { content?: JsonValue } };
  return body.artifact?.content ?? null;
}

/**
 * Input-artifact convention: the invocation's single brokered input is named
 * by an arg ending in "ArtifactId" (textArtifactId for the claim-extractor
 * pilot, claimsArtifactId for contradiction-scan, ...). textArtifactId keeps
 * priority for pilot parity; otherwise the lexicographically first match wins
 * so the fetch is deterministic.
 */
function resolveInputArtifactId(input: RuntimeInvocationInput): string | null {
  const direct = input.args.textArtifactId;
  if (typeof direct === "string") {
    return direct;
  }
  const candidateKeys = Object.keys(input.args)
    .filter(key => key.endsWith("ArtifactId") && typeof input.args[key] === "string")
    .sort();
  const key = candidateKeys[0];
  return key === undefined ? null : (input.args[key] as string);
}

function scriptCommand(scriptPath: string): { command: string; commandArgs: string[] } {
  if (scriptPath.endsWith(".ts")) {
    return { command: process.execPath, commandArgs: ["--import", "tsx", scriptPath] };
  }
  return { command: process.execPath, commandArgs: [scriptPath] };
}

function terminate(child: ChildProcess): void {
  child.kill("SIGTERM");
  const killTimer = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  }, SIGKILL_GRACE_MS);
  killTimer.unref();
}

function parseRuntimeResult(stdout: string): RuntimeInvocationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new PeerNotebookError(
      "invalid_result",
      `Peer process stdout is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !("result" in parsed)) {
    throw new PeerNotebookError("invalid_result", "Peer process output must be a JSON object with a result property");
  }

  const output = parsed as { result: JsonValue; artifacts?: unknown };
  const artifacts = output.artifacts ?? [];
  if (!Array.isArray(artifacts)) {
    throw new PeerNotebookError("invalid_result", "Peer process artifacts must be an array");
  }
  for (const artifact of artifacts) {
    if (
      !artifact || typeof artifact !== "object" ||
      typeof (artifact as { artifactId?: unknown }).artifactId !== "string" ||
      typeof (artifact as { kind?: unknown }).kind !== "string" ||
      typeof (artifact as { name?: unknown }).name !== "string" ||
      typeof (artifact as { mimeType?: unknown }).mimeType !== "string" ||
      !("content" in artifact)
    ) {
      throw new PeerNotebookError(
        "invalid_result",
        "Peer process artifacts must declare artifactId, kind, name, mimeType, and content",
      );
    }
  }

  return {
    result: output.result,
    artifacts: artifacts as RuntimeArtifactOutput[],
  };
}
