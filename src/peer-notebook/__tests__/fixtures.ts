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
