import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  RuntimeArtifactOutput,
  RuntimeInvocationInput,
  RuntimeInvocationResult,
  RuntimeProvider,
  RuntimeProviderDescription,
} from "./runtime-provider.js";
import type { JsonValue } from "./types.js";
import { PeerNotebookError } from "./types.js";

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
 *   runtime.entry; manifests cannot point at arbitrary filesystem paths.
 * - The manifest budget (budgets.maxDurationMs) is enforced on the child via
 *   SIGTERM, escalating to SIGKILL; cancel() kills the child the same way.
 */
export class LocalProcessRuntimeProvider implements RuntimeProvider {
  private readonly entries: Record<string, string>;
  private readonly children = new Map<string, ChildProcess>();
  private readonly cancelledInvocations = new Set<string>();

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
    const scriptPath = this.resolveEntryScript(input);
    const artifactContent = await fetchInputArtifact(input);

    if (input.tool === "extract_claims") {
      // Pilot-parity denied probe: traced as denied_outbound_call exactly as
      // the mock contract fixture path records it.
      await input.brokerProxy.callTool("thoughtbox.knowledge.queryGraph", { query: "denied pilot probe" });
    }

    const payload = JSON.stringify({
      invocationId: input.invocationId,
      tool: input.tool,
      args: input.args,
      artifactContent,
    });
    return this.runEntryProcess(input, scriptPath, payload);
  }

  async cancel(input: { invocationId: string }): Promise<void> {
    const child = this.children.get(input.invocationId);
    if (!child) {
      return;
    }
    this.cancelledInvocations.add(input.invocationId);
    terminate(child);
  }

  async "snapshot/export"(): Promise<null> {
    return null;
  }

  resolvesEntry(entry: string): boolean {
    return Object.hasOwn(this.entries, entry);
  }

  async heartbeat(): Promise<void> {}

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
}

async function fetchInputArtifact(input: RuntimeInvocationInput): Promise<JsonValue | null> {
  const textArtifactId = input.args.textArtifactId;
  if (input.tool === "extract_claims" && typeof textArtifactId !== "string") {
    throw new PeerNotebookError("invalid_args", "extract_claims requires textArtifactId");
  }
  if (typeof textArtifactId !== "string") {
    return null;
  }

  const read = await input.brokerProxy.callTool("artifact.get", { artifactId: textArtifactId });
  if (!read.ok) {
    throw new PeerNotebookError("outbound_denied", read.error.message);
  }
  const body = read.result as { artifact?: { content?: JsonValue } };
  return body.artifact?.content ?? null;
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
