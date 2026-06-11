import { randomUUID } from "node:crypto";
import type {
  RuntimeInvocationInput,
  RuntimeInvocationResult,
  RuntimeProvider,
  RuntimeProviderDescription,
} from "./runtime-provider.js";
import type { JsonObject } from "./types.js";
import { PeerNotebookError } from "./types.js";

// Test-only contract fixture for the brokered claim-extractor pilot. It is
// intentionally not a production runtime or isolation boundary: production
// wiring registers LocalProcessRuntimeProvider, and this class is imported
// only from tests (it is excluded from the package barrel on purpose).
export class MockPeerRuntimeProvider implements RuntimeProvider {
  readonly invocations: RuntimeInvocationInput[] = [];

  describe(): RuntimeProviderDescription {
    return {
      provider: "mock",
      isolation: "mock",
      developmentOnly: true,
      supportsCancel: true,
      supportsSnapshots: false,
    };
  }

  async invoke(input: RuntimeInvocationInput): Promise<RuntimeInvocationResult> {
    this.invocations.push(input);

    if (input.tool !== "extract_claims") {
      throw new PeerNotebookError("tool_not_found", `Mock provider only supports extract_claims, got ${input.tool}`);
    }

    const textArtifactId = input.args.textArtifactId;
    if (typeof textArtifactId !== "string") {
      throw new PeerNotebookError("invalid_args", "extract_claims requires textArtifactId");
    }

    const read = await input.brokerProxy.callTool("artifact.get", { artifactId: textArtifactId });
    if (!read.ok) {
      throw new PeerNotebookError("outbound_denied", read.error.message);
    }

    await input.brokerProxy.callTool("thoughtbox.knowledge.queryGraph", { query: "denied pilot probe" });

    const artifactContent = read.result as { artifact?: { content?: unknown } };
    const text = extractText(artifactContent.artifact?.content);
    const claims = extractClaims(text);
    const claimsArtifactId = randomUUID();
    const claimsJson: JsonObject = { claims };

    return {
      result: {
        claimsArtifactId,
        claimCount: claims.length,
      },
      artifacts: [
        {
          artifactId: claimsArtifactId,
          kind: "json",
          name: "claims.json",
          mimeType: "application/json",
          content: claimsJson,
          preview: claimsJson,
        },
      ],
    };
  }

  async cancel(): Promise<void> {}

  async "snapshot/export"(): Promise<null> {
    return null;
  }

  async heartbeat(): Promise<void> {}
}

function extractText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (content && typeof content === "object" && "text" in content && typeof content.text === "string") {
    return content.text;
  }
  return "";
}

function extractClaims(text: string): JsonObject[] {
  return text
    .split(/[.!?\n]+/)
    .map(claim => claim.trim())
    .filter(Boolean)
    .map((claim, index) => ({
      id: `claim_${index + 1}`,
      text: claim,
    }));
}
