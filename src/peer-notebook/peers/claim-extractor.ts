import { randomUUID } from "node:crypto";

// Standalone claim-extractor peer entry executed by LocalProcessRuntimeProvider.
// Protocol: reads { invocationId, tool, args, artifactContent } JSON from stdin,
// writes { result, artifacts } JSON to stdout, exits 0 on success / 1 on failure.
// Claim extraction is the deterministic sentence-split logic from the original
// mock contract fixture so both providers produce identical output.

interface ChildInvocationInput {
  invocationId: string;
  tool: string;
  args: Record<string, unknown>;
  artifactContent: unknown;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
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

function extractClaims(text: string): Array<{ id: string; text: string }> {
  return text
    .split(/[.!?\n]+/)
    .map(claim => claim.trim())
    .filter(Boolean)
    .map((claim, index) => ({
      id: `claim_${index + 1}`,
      text: claim,
    }));
}

async function main(): Promise<void> {
  const input = JSON.parse(await readStdin()) as ChildInvocationInput;
  if (input.tool !== "extract_claims") {
    throw new Error(`claim-extractor only supports extract_claims, got ${input.tool}`);
  }

  const claims = extractClaims(extractText(input.artifactContent));
  const claimsArtifactId = randomUUID();
  const claimsJson = { claims };

  process.stdout.write(JSON.stringify({
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
  }));
}

main().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
