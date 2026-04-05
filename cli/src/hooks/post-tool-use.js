#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MAX_ATTR_BYTES = 4096;

function truncate(value, maxBytes) {
  if (typeof value !== "string") {
    value = JSON.stringify(value) ?? "";
  }
  if (Buffer.byteLength(value, "utf8") <= maxBytes) {
    return value;
  }
  const buf = Buffer.from(value, "utf8");
  return buf.subarray(0, maxBytes).toString("utf8") + "...[truncated]";
}

function extractFilePath(toolName, toolInput) {
  if (!toolInput || typeof toolInput !== "object") return null;
  if (
    toolName === "Read" ||
    toolName === "Edit" ||
    toolName === "Write"
  ) {
    return toolInput.file_path ?? null;
  }
  if (toolName === "Grep" || toolName === "Glob") {
    return toolInput.path ?? null;
  }
  return null;
}

function getConnectionId() {
  const ppid = process.ppid;
  const connDir = join(tmpdir(), "thoughtbox");
  const connFile = join(connDir, `conn-${ppid}`);

  try {
    if (existsSync(connFile)) {
      return readFileSync(connFile, "utf8").trim();
    }
  } catch {
    // Fall through to generate new ID
  }

  const id = `${ppid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    mkdirSync(connDir, { recursive: true });
    writeFileSync(connFile, id, "utf8");
  } catch {
    // Non-fatal: use the generated ID even if we can't persist it
  }

  return id;
}

function buildOtlpLogRecord(event) {
  const toolName = event.tool_name ?? "unknown";
  const toolInput = event.tool_input ?? {};
  const toolResponse = event.tool_response ?? "";
  const filePath = extractFilePath(toolName, toolInput);
  const connectionId = getConnectionId();
  const nowNanos = BigInt(Date.now()) * 1_000_000n;

  const attributes = [
    {
      key: "event.name",
      value: { stringValue: "tool.use" },
    },
    {
      key: "tool.name",
      value: { stringValue: toolName },
    },
    {
      key: "tool.input",
      value: {
        stringValue: truncate(toolInput, MAX_ATTR_BYTES),
      },
    },
    {
      key: "tool.response",
      value: {
        stringValue: truncate(toolResponse, MAX_ATTR_BYTES),
      },
    },
    {
      key: "connection.id",
      value: { stringValue: connectionId },
    },
  ];

  if (filePath) {
    attributes.push({
      key: "file.path",
      value: { stringValue: filePath },
    });
  }

  return {
    resourceLogs: [
      {
        resource: {
          attributes: [
            {
              key: "service.name",
              value: { stringValue: "claude-code-hook" },
            },
          ],
        },
        scopeLogs: [
          {
            scope: { name: "thoughtbox.hook.post-tool-use" },
            logRecords: [
              {
                timeUnixNano: nowNanos.toString(),
                severityNumber: 9,
                severityText: "INFO",
                body: {
                  stringValue: `tool.use: ${toolName}`,
                },
                attributes,
              },
            ],
          },
        ],
      },
    ],
  };
}

function main() {
  try {
    const apiKey = process.env.THOUGHTBOX_API_KEY;
    if (!apiKey) {
      process.exit(0);
    }

    const url = process.env.THOUGHTBOX_URL;
    if (!url) {
      process.exit(0);
    }

    let input;
    try {
      input = readFileSync(0, "utf8");
    } catch {
      process.exit(0);
    }

    if (!input || input.trim().length === 0) {
      process.exit(0);
    }

    let event;
    try {
      event = JSON.parse(input);
    } catch {
      process.exit(0);
    }

    const record = buildOtlpLogRecord(event);
    const body = JSON.stringify(record);

    const child = spawn("curl", [
      "-s",
      "-o", "/dev/null",
      "-X", "POST",
      `${url}/v1/logs`,
      "--config", "-",
      "-d", body,
    ], {
      detached: true,
      stdio: ["pipe", "ignore", "ignore"],
    });
    child.stdin.end(
      `header = "Authorization: Bearer ${apiKey}"\nheader = "Content-Type: application/json"\n`
    );
    child.unref();
  } catch {
    // Never throw from hook scripts
  }
}

main();
