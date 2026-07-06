import { spawn, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import os from "node:os";
import path from "node:path";
import express from "express";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createProtocolHttpSurface } from "../protocol-http.js";
import type {
  ProtocolEnforcementInput,
  ProtocolEnforcementResult,
} from "../../protocol/types.js";

const HOOK_PATH = path.resolve(
  process.cwd(),
  "plugins/thoughtbox-claude-code/scripts/protocol_gate.sh",
);

function buildHookInput(
  toolName: string,
  toolInput: Record<string, unknown>,
): string {
  return JSON.stringify({
    tool_name: toolName,
    tool_input: toolInput,
    tool_response: {},
  });
}

/**
 * Async hook runner for tests where the hook's curl must reach an
 * in-process HTTP server: spawnSync would block the event loop the server
 * runs on and deadlock until curl's timeout.
 */
function runHookAgainstLiveServer(
  input: string,
  env: Record<string, string>,
): Promise<{ status: number | null; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", [HOOK_PATH], {
      env: { ...process.env, ...env },
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ status: code, stderr }));
    child.stdin.write(input);
    child.stdin.end();
  });
}

describe("protocol_gate.sh enforcement", () => {
  let projectDir: string;
  let fakeBinDir: string;
  let curlCapturePath: string;
  let curlHeadersPath: string;

  beforeEach(() => {
    projectDir = mkdtempSync(path.join(os.tmpdir(), "thoughtbox-hook-"));
    fakeBinDir = path.join(projectDir, "bin");
    curlCapturePath = path.join(projectDir, "curl-payload.json");
    curlHeadersPath = path.join(projectDir, "curl-headers.txt");

    mkdirSync(path.join(projectDir, "src"), { recursive: true });
    mkdirSync(fakeBinDir, { recursive: true });

    const fakeCurlPath = path.join(fakeBinDir, "curl");
    writeFileSync(
      fakeCurlPath,
      `#!/usr/bin/env bash
set -euo pipefail
payload=""
headers=""
url=""
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -d)
      payload="$2"
      shift 2
      ;;
    -H)
      headers+="$2"$'\\n'
      shift 2
      ;;
    -X)
      shift 2
      ;;
    http*)
      url="$1"
      shift
      ;;
    *)
      shift
      ;;
  esac
done
if [[ -n "\${FAKE_CURL_CAPTURE:-}" && -n "$payload" ]]; then
  printf '%s' "$payload" > "$FAKE_CURL_CAPTURE"
fi
if [[ -n "\${FAKE_CURL_HEADERS:-}" && -n "$headers" ]]; then
  printf '%s' "$headers" > "$FAKE_CURL_HEADERS"
fi
if [[ -n "\${FAKE_CURL_URL:-}" && -n "$url" ]]; then
  printf '%s' "$url" > "$FAKE_CURL_URL"
fi
printf '%s' "$FAKE_CURL_RESPONSE"
exit "$FAKE_CURL_EXIT_CODE"
`,
      "utf8",
    );
    chmodSync(fakeCurlPath, 0o755);
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  function runHook(
    input: string,
    env: Record<string, string> = {},
  ) {
    return spawnSync("bash", [HOOK_PATH], {
      input,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ""}`,
        THOUGHTBOX_URL: "http://localhost:1731",
        THOUGHTBOX_WORKSPACE_ID: "",
        THOUGHTBOX_API_KEY: "",
        OTEL_EXPORTER_OTLP_ENDPOINT: "",
        OTEL_EXPORTER_OTLP_HEADERS: "",
        CLAUDE_PROJECT_DIR: projectDir,
        FAKE_CURL_CAPTURE: curlCapturePath,
        FAKE_CURL_HEADERS: curlHeadersPath,
        FAKE_CURL_RESPONSE: JSON.stringify({ enforce: false }),
        FAKE_CURL_EXIT_CODE: "0",
        ...env,
      },
    });
  }

  function capturedPayload(): Record<string, unknown> {
    return JSON.parse(readFileSync(curlCapturePath, "utf8"));
  }

  function capturedHeaders(): string {
    return readFileSync(curlHeadersPath, "utf8");
  }

  it("blocks Write when Ulysses requires reflect", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.ts"),
      }),
      {
        FAKE_CURL_RESPONSE: JSON.stringify({
          enforce: true,
          blocked: true,
          protocol: "ulysses",
          reason:
            "REFLECT REQUIRED: Ulysses session is waiting for reflect before further mutation",
          required_action: "reflect",
        }),
      },
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("REFLECT REQUIRED");
    expect(result.stderr).toContain("reflect");
  });

  it("skips enforcement when no file_path is present", () => {
    const result = runHook(
      buildHookInput("Write", {}),
    );

    expect(result.status).toBe(0);
    expect(() => capturedPayload()).toThrow();
  });

  it("blocks Theseus test-file writes", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.test.ts"),
      }),
      {
        FAKE_CURL_RESPONSE: JSON.stringify({
          enforce: true,
          blocked: true,
          protocol: "theseus",
          reason: "TEST LOCK: Cannot modify test files during refactoring",
        }),
      },
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("TEST LOCK");
  });

  it("blocks out-of-scope writes until a visa exists", () => {
    const result = runHook(
      buildHookInput("Edit", {
        file_path: path.join(projectDir, "src", "other.ts"),
      }),
      {
        FAKE_CURL_RESPONSE: JSON.stringify({
          enforce: true,
          blocked: true,
          protocol: "theseus",
          reason: "VISA REQUIRED: File outside declared scope",
          required_action: "visa",
        }),
      },
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("VISA REQUIRED");
  });

  it("allows in-scope writes", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "in-scope.ts"),
      }),
      {
        FAKE_CURL_RESPONSE: JSON.stringify({
          enforce: true,
          blocked: false,
          protocol: "theseus",
        }),
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("sends Authorization Bearer header from THOUGHTBOX_API_KEY", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.ts"),
      }),
      {
        THOUGHTBOX_API_KEY: "tbx_abc123_secret",
      },
    );

    expect(result.status).toBe(0);
    expect(capturedHeaders()).toContain(
      "Authorization: Bearer tbx_abc123_secret",
    );
  });

  it("extracts the API key from OTEL_EXPORTER_OTLP_HEADERS when set", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.ts"),
      }),
      {
        OTEL_EXPORTER_OTLP_HEADERS: "Authorization=Bearer tbx_from_otel_env",
      },
    );

    expect(result.status).toBe(0);
    expect(capturedHeaders()).toContain(
      "Authorization: Bearer tbx_from_otel_env",
    );
  });

  it("resolves endpoint and key from .claude/settings.local.json (thoughtbox init config)", () => {
    const claudeDir = path.join(projectDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      path.join(claudeDir, "settings.local.json"),
      JSON.stringify({
        mcpServers: {
          thoughtbox: {
            type: "http",
            url: "https://hosted.example.com/mcp?key=tbx_cfg_key",
          },
        },
        env: {
          OTEL_EXPORTER_OTLP_ENDPOINT: "https://hosted.example.com",
          OTEL_EXPORTER_OTLP_HEADERS: "Authorization=Bearer tbx_cfg_key",
        },
      }),
      "utf8",
    );
    const urlCapturePath = path.join(projectDir, "curl-url.txt");

    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.ts"),
      }),
      {
        THOUGHTBOX_URL: "",
        FAKE_CURL_URL: urlCapturePath,
      },
    );

    expect(result.status).toBe(0);
    expect(readFileSync(urlCapturePath, "utf8")).toBe(
      "https://hosted.example.com/protocol/enforcement",
    );
    expect(capturedHeaders()).toContain("Authorization: Bearer tbx_cfg_key");
  });

  it("fails open LOUDLY when no endpoint is configured", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.ts"),
      }),
      {
        THOUGHTBOX_URL: "",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("no Thoughtbox endpoint configured");
    expect(result.stderr).toContain("failing open");
    expect(() => capturedPayload()).toThrow();
  });

  it("fails open LOUDLY when curl fails", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.ts"),
      }),
      {
        FAKE_CURL_EXIT_CODE: "7",
      },
    );

    // Exit 1 = non-blocking for Claude Code hooks (tool proceeds), but
    // stderr is surfaced to the user — the gate never fails open silently.
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("enforcement unreachable");
    expect(result.stderr).toContain("failing open");
  });

  it("fails open LOUDLY on an unparseable enforcement response", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.ts"),
      }),
      {
        FAKE_CURL_RESPONSE: "<html>gateway error</html>",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("unparseable enforcement response");
    expect(result.stderr).toContain("failing open");
  });
});

describe("hosted /protocol/enforcement surface", () => {
  const WORKSPACE_A = "11111111-1111-4111-8111-111111111111";
  const VALID_KEY = "tbx_hosted_valid";

  let server: Server;
  let baseUrl: string;
  let seenInputs: ProtocolEnforcementInput[];
  let decision: ProtocolEnforcementResult;

  beforeAll(async () => {
    seenInputs = [];
    decision = { enforce: false };

    const app = express();
    app.use(express.json());

    // Mirrors the multi-tenant wiring in src/index.ts: a storage-backed
    // enforcement handler consulted with the workspace resolved from the
    // request's credentials — never from the request body.
    const surface = createProtocolHttpSurface({
      getHandlers: () => [
        {
          checkEnforcement: async (input: ProtocolEnforcementInput) => {
            seenInputs.push(input);
            if (input.workspaceId === WORKSPACE_A) return decision;
            return { enforce: false };
          },
        },
      ],
      resolveWorkspaceId: async (req) => {
        const auth = req.headers.authorization;
        if (auth === `Bearer ${VALID_KEY}`) return WORKSPACE_A;
        throw new Error("Invalid API key");
      },
    });
    surface.mount(app);

    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    seenInputs = [];
    decision = { enforce: false };
  });

  it("rejects unauthenticated requests with 401 and consults no handler", async () => {
    const res = await fetch(`${baseUrl}/protocol/enforcement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mutation: true, targetPath: "src/x.ts" }),
    });

    expect(res.status).toBe(401);
    expect(seenInputs).toHaveLength(0);
  });

  it("returns a workspace-scoped blocking decision for an authed request", async () => {
    decision = {
      enforce: true,
      blocked: true,
      protocol: "ulysses",
      reason:
        "REFLECT REQUIRED: Ulysses session is waiting for reflect before further mutation",
      required_action: "reflect",
    };

    const res = await fetch(`${baseUrl}/protocol/enforcement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VALID_KEY}`,
      },
      body: JSON.stringify({ mutation: true, targetPath: "src/x.ts" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as ProtocolEnforcementResult;
    expect(body.blocked).toBe(true);
    expect(body.required_action).toBe("reflect");
    expect(seenInputs).toHaveLength(1);
    expect(seenInputs[0]?.workspaceId).toBe(WORKSPACE_A);
  });

  it("ignores a spoofed workspaceId in the body — credentials decide scope", async () => {
    const res = await fetch(`${baseUrl}/protocol/enforcement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VALID_KEY}`,
      },
      body: JSON.stringify({
        mutation: true,
        targetPath: "src/x.ts",
        workspaceId: "attacker-chosen-workspace",
      }),
    });

    expect(res.status).toBe(200);
    expect(seenInputs).toHaveLength(1);
    expect(seenInputs[0]?.workspaceId).toBe(WORKSPACE_A);
  });

  it("blocks a hosted Edit end-to-end through protocol_gate.sh (real curl)", async () => {
    decision = {
      enforce: true,
      blocked: true,
      protocol: "theseus",
      reason: "VISA REQUIRED: File outside declared scope",
      required_action: "visa",
    };

    const result = await runHookAgainstLiveServer(
      buildHookInput("Edit", { file_path: "src/out-of-scope.ts" }),
      {
        THOUGHTBOX_URL: baseUrl,
        THOUGHTBOX_API_KEY: VALID_KEY,
        THOUGHTBOX_WORKSPACE_ID: "",
      },
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("VISA REQUIRED");
    expect(seenInputs).toHaveLength(1);
    expect(seenInputs[0]?.workspaceId).toBe(WORKSPACE_A);
  });

  it("fails open loudly through the hook when the API key is rejected", async () => {
    const result = await runHookAgainstLiveServer(
      buildHookInput("Edit", { file_path: "src/out-of-scope.ts" }),
      {
        THOUGHTBOX_URL: baseUrl,
        THOUGHTBOX_API_KEY: "tbx_wrong_key",
        THOUGHTBOX_WORKSPACE_ID: "",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("failing open");
  });
});

describe("local /protocol/enforcement aggregation", () => {
  it("a block from ANY session handler wins over earlier allows", async () => {
    const allowHandler = {
      checkEnforcement: async (): Promise<ProtocolEnforcementResult> => ({
        enforce: true,
        blocked: false,
        protocol: "theseus" as const,
      }),
    };
    const blockHandler = {
      checkEnforcement: async (): Promise<ProtocolEnforcementResult> => ({
        enforce: true,
        blocked: true,
        protocol: "ulysses" as const,
        reason: "REFLECT REQUIRED",
        required_action: "reflect" as const,
      }),
    };

    const app = express();
    app.use(express.json());
    createProtocolHttpSurface({
      getHandlers: () => [allowHandler, blockHandler],
    }).mount(app);

    const server: Server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    try {
      const { port } = server.address() as AddressInfo;
      const res = await fetch(`http://127.0.0.1:${port}/protocol/enforcement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutation: true, targetPath: "src/x.ts" }),
      });
      const body = (await res.json()) as ProtocolEnforcementResult;
      expect(body.blocked).toBe(true);
      expect(body.protocol).toBe("ulysses");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("returns enforce:false when no session has a protocol handler", async () => {
    const app = express();
    app.use(express.json());
    createProtocolHttpSurface({ getHandlers: () => [] }).mount(app);

    const server: Server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    try {
      const { port } = server.address() as AddressInfo;
      const res = await fetch(`http://127.0.0.1:${port}/protocol/enforcement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutation: true, targetPath: "src/x.ts" }),
      });
      const body = (await res.json()) as ProtocolEnforcementResult;
      expect(body).toEqual({ enforce: false });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
