/**
 * Manifest object for notebook graduation tests: local-process provider bound
 * to the registered claim-extractor entry script. Returned as an object so
 * tests can mutate fields before stringifying into the manifest cell.
 */
export function graduationPeerManifest(
  peerId: string,
  notebookId: string,
  overrides: { entry?: string; timeoutMs?: number } = {},
): Record<string, unknown> {
  const manifest = JSON.parse(lifecyclePeerManifestJson(peerId, {
    timeoutMs: overrides.timeoutMs,
  })) as Record<string, unknown>;
  manifest.notebookId = notebookId;
  manifest.runtime = {
    provider: "local-process",
    entry: overrides.entry ?? "claim-extractor",
    timeoutMs: overrides.timeoutMs ?? 120_000,
  };
  return manifest;
}

export function lifecyclePeerManifestJson(
  peerId: string,
  overrides: { timeoutMs?: number } = {},
): string {
  return JSON.stringify({
    schemaVersion: "peer-notebook.v0",
    peerId,
    notebookId: `nb_${peerId.replaceAll("-", "_")}`,
    runtime: {
      provider: "mock",
      timeoutMs: overrides.timeoutMs ?? 120_000,
    },
    exposes: {
      tools: [
        {
          name: "extract_claims",
          description: "Extract atomic claims from a text artifact",
          inputSchema: {
            type: "object",
            properties: {
              textArtifactId: { type: "string" },
            },
            required: ["textArtifactId"],
            additionalProperties: false,
          },
          outputSchema: {
            type: "object",
            properties: {
              claimsArtifactId: { type: "string" },
              claimCount: { type: "number" },
            },
            required: ["claimsArtifactId", "claimCount"],
            additionalProperties: false,
          },
        },
      ],
      resources: [],
      prompts: [],
    },
    mayCall: {
      mcpTools: ["artifact.get"],
    },
    network: {
      enabled: false,
      allowHosts: [],
    },
    filesystem: {
      mounts: [],
    },
    secrets: {
      bindings: [],
    },
    persistence: {
      snapshot: "manual",
      exportNotebookOnInvoke: true,
      retainArtifactsDays: 30,
    },
    budgets: {
      maxDurationMs: 120_000,
      maxToolCalls: 10,
      maxArtifactBytes: 10_000_000,
    },
  });
}
