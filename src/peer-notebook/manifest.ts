import { createHash } from "node:crypto";
import { z } from "zod";
import type {
  CompiledPeerManifest,
  JsonSchemaSubset,
  JsonValue,
  ManifestDraftSource,
  PeerManifest,
} from "./types.js";
import { PeerNotebookError } from "./types.js";

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ]),
);

const JsonSchemaSubsetSchema: z.ZodType<JsonSchemaSubset> = z.lazy(() =>
  z.object({
    type: z.enum(["object", "array", "string", "number", "boolean", "null"]).optional(),
    properties: z.record(JsonSchemaSubsetSchema).optional(),
    required: z.array(z.string()).optional(),
    items: JsonSchemaSubsetSchema.optional(),
    additionalProperties: z.boolean().optional(),
  }) as z.ZodType<JsonSchemaSubset>,
);

const PeerManifestSchema: z.ZodType<PeerManifest> = z.object({
  schemaVersion: z.literal("peer-notebook.v0"),
  peerId: z.string().min(1),
  notebookId: z.string().min(1),
  runtime: z.object({
    provider: z.enum(["mock", "local-process", "smolvm"]),
    image: z.string().optional(),
    cpus: z.number().positive().optional(),
    memoryMiB: z.number().positive().optional(),
    timeoutMs: z.number().positive().optional(),
  }),
  exposes: z.object({
    tools: z.array(z.object({
      name: z.string().min(1),
      description: z.string(),
      inputSchema: JsonSchemaSubsetSchema,
      outputSchema: JsonSchemaSubsetSchema,
    })),
    resources: z.array(JsonValueSchema),
    prompts: z.array(JsonValueSchema),
  }),
  mayCall: z.object({
    mcpTools: z.array(z.string()),
  }),
  network: z.object({
    enabled: z.boolean(),
    allowHosts: z.array(z.string()),
  }),
  filesystem: z.object({
    mounts: z.array(z.object({
      name: z.string(),
      mode: z.enum(["ro", "rw"]),
      target: z.string(),
    })),
  }),
  secrets: z.object({
    bindings: z.array(JsonValueSchema),
  }),
  persistence: z.object({
    snapshot: z.enum(["manual", "never", "onInvoke"]).optional(),
    exportNotebookOnInvoke: z.boolean().optional(),
    retainArtifactsDays: z.number().nonnegative().optional(),
  }),
  budgets: z.object({
    maxDurationMs: z.number().positive(),
    maxToolCalls: z.number().nonnegative(),
    maxArtifactBytes: z.number().nonnegative(),
  }),
});

export function compilePeerManifestDraft(sources: ManifestDraftSource[]): CompiledPeerManifest {
  const manifestSources = sources.filter(source => source.name === "peer.manifest.json");
  if (manifestSources.length !== 1) {
    throw new PeerNotebookError(
      "manifest_compile_error",
      `Expected exactly one peer.manifest.json draft source, found ${manifestSources.length}`,
    );
  }

  const [source] = manifestSources;
  let parsed: unknown;
  try {
    parsed = JSON.parse(source.content);
  } catch (error) {
    throw new PeerNotebookError(
      "manifest_compile_error",
      "peer.manifest.json is not valid JSON",
      { message: error instanceof Error ? error.message : String(error) },
    );
  }

  const result = PeerManifestSchema.safeParse(parsed);
  if (!result.success) {
    throw new PeerNotebookError(
      "manifest_compile_error",
      "peer.manifest.json failed manifest validation",
      { issues: result.error.issues as unknown as JsonValue },
    );
  }

  const canonicalJson = canonicalizeJson(result.data);
  return {
    manifest: result.data,
    canonicalJson,
    manifestHash: `sha256:${createHash("sha256").update(canonicalJson, "utf8").digest("hex")}`,
    status: "draft",
    compiledFrom: {
      sourceName: source.name,
      sourceType: source.sourceType ?? "file",
    },
  };
}

export function canonicalizeJson(value: unknown): string {
  const canonical = JSON.stringify(sortJson(value));
  if (canonical === undefined) {
    throw new TypeError("Cannot canonicalize top-level undefined or non-JSON value");
  }
  return canonical;
}

export function hashJson(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value), "utf8").digest("hex")}`;
}

function sortJson(value: unknown, inArray = false): JsonValue | undefined {
  if (Array.isArray(value)) {
    return value.map(item => sortJson(item, true) ?? null);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .flatMap(([key, nested]) => {
          const sorted = sortJson(nested);
          return sorted === undefined ? [] : [[key, sorted]];
        }),
    );
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  return inArray ? null : undefined;
}
