import type { PeerManifest } from "../types.js";
import { NOTEBOOK_ENTRY_PREFIX } from "../types.js";

/**
 * Contradiction-scan peer, authored as NOTEBOOK CONTENT — not a builtin entry.
 *
 * Unlike claim-extractor (a platform-owned script registered in the
 * local-process BUILTIN_ENTRIES registry), this peer's executable code lives
 * in a notebook code cell. The exports here are the authoring material: cell
 * sources plus a manifest builder. A session authors the notebook through the
 * notebook engine (notebook_create / notebook_add_cell), graduates it with
 * peer_graduate_notebook — which captures the cells into the manifest's
 * immutable code snapshot — and approves it with peer_manifest_approve. From
 * then on any session can invoke `scan_contradictions` and the local-process
 * provider executes the snapshot's entry cell through the notebook execution
 * engine.
 *
 * The peer takes a claims artifact (the claim-extractor output shape,
 * `{ claims: [{ id, text }] }`, or an array, or plain text with one claim per
 * line) and returns contradiction CANDIDATES: deterministic lexical detection
 * of negation pairs, antonym predicates, and numeric mismatches. Candidates
 * feed the merge-evidence flow — they are leads for a human or agent to
 * adjudicate, not verdicts.
 */

export const CONTRADICTION_SCAN_PEER_ID = "contradiction-scan";
export const CONTRADICTION_SCAN_ENTRY_FILENAME = "contradiction-scan.js";
export const CONTRADICTION_SCAN_TOOL_NAME = "scan_contradictions";

export const CONTRADICTION_SCAN_DOC_MARKDOWN = [
  "Scans a set of claims for contradiction candidates: negation pairs,",
  "antonym predicates, and numeric mismatches. Input is a claims artifact",
  "(claim-extractor output shape); output is a contradictions.json artifact",
  "with candidate pairs and the reason each pair was flagged.",
].join("\n");

/**
 * Entry cell source (plain JavaScript, node builtins only — notebook peers
 * are dependency-free in v1). Peer cell protocol: read
 * `{ invocationId, tool, args, artifactContent }` JSON from TB_PEER_INPUT_PATH,
 * write `{ result, artifacts }` JSON to TB_PEER_OUTPUT_PATH, exit non-zero on
 * failure with the message on stderr.
 */
export const CONTRADICTION_SCAN_CELL_SOURCE = `// Contradiction-scan peer entry cell (graduated notebook peer).
// Reads { invocationId, tool, args, artifactContent } from TB_PEER_INPUT_PATH,
// writes { result, artifacts } to TB_PEER_OUTPUT_PATH.
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const NEGATORS = new Set([
  "not", "no", "never", "cannot", "dont", "doesnt", "didnt",
  "wont", "isnt", "arent", "wasnt", "werent",
]);

const ANTONYM_PAIRS = [
  ["increased", "decreased"], ["increases", "decreases"],
  ["enabled", "disabled"], ["enables", "disables"],
  ["passes", "fails"], ["passed", "failed"],
  ["allows", "denies"], ["allowed", "denied"],
  ["active", "inactive"], ["always", "never"],
  ["faster", "slower"], ["higher", "lower"],
  ["before", "after"], ["up", "down"],
];
const ANTONYMS = new Map();
for (const [a, b] of ANTONYM_PAIRS) {
  ANTONYMS.set(a, b);
  ANTONYMS.set(b, a);
}

const NUMBER = /^\\d+(\\.\\d+)?$/;

function claimTokens(text) {
  return text
    .toLowerCase()
    .replace(/n't\\b/g, " not")
    .replace(/[^a-z0-9.\\s]/g, " ")
    .split(/\\s+/)
    .map(token => token.replace(/\\.+$/, ""))
    .filter(Boolean);
}

function negationCandidate(left, right) {
  const hasNegator = tokens => tokens.some(token => NEGATORS.has(token));
  if (hasNegator(left) === hasNegator(right)) return false;
  const strip = tokens => tokens.filter(token => !NEGATORS.has(token)).join(" ");
  return strip(left) === strip(right) && strip(left).length > 0;
}

function alignedDiffs(left, right) {
  if (left.length !== right.length) return null;
  const diffs = [];
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) diffs.push([left[i], right[i]]);
  }
  return diffs;
}

function antonymCandidate(left, right) {
  const diffs = alignedDiffs(left, right);
  if (!diffs || diffs.length !== 1) return false;
  const [a, b] = diffs[0];
  return ANTONYMS.get(a) === b;
}

function numericCandidate(left, right) {
  const diffs = alignedDiffs(left, right);
  if (!diffs || diffs.length === 0) return false;
  return diffs.every(([a, b]) => NUMBER.test(a) && NUMBER.test(b) && a !== b);
}

function parseClaims(content) {
  let value = content;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      // Plain text fallback: one claim per line.
      return value
        .split(/\\n+/)
        .map(line => line.trim())
        .filter(Boolean)
        .map((text, index) => ({ id: "claim_" + (index + 1), text }));
    }
  }
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray(value.claims)
      ? value.claims
      : null;
  if (!list) {
    throw new Error("claims artifact must be {claims:[{id,text}]}, an array, or plain text");
  }
  return list.map((claim, index) =>
    typeof claim === "string"
      ? { id: "claim_" + (index + 1), text: claim }
      : { id: String(claim.id ?? "claim_" + (index + 1)), text: String(claim.text ?? "") },
  );
}

function scan(claims) {
  const tokenized = claims.map(claim => ({ ...claim, tokens: claimTokens(claim.text) }));
  const candidates = [];
  for (let i = 0; i < tokenized.length; i++) {
    for (let j = i + 1; j < tokenized.length; j++) {
      const left = tokenized[i];
      const right = tokenized[j];
      let kind = null;
      if (negationCandidate(left.tokens, right.tokens)) kind = "negation";
      else if (antonymCandidate(left.tokens, right.tokens)) kind = "antonym";
      else if (numericCandidate(left.tokens, right.tokens)) kind = "numeric_mismatch";
      if (kind) {
        candidates.push({
          leftId: left.id,
          leftText: left.text,
          rightId: right.id,
          rightText: right.text,
          kind,
        });
      }
    }
  }
  return candidates;
}

function main() {
  const input = JSON.parse(readFileSync(process.env.TB_PEER_INPUT_PATH, "utf8"));
  if (input.tool !== "scan_contradictions") {
    throw new Error("contradiction-scan only supports scan_contradictions, got " + input.tool);
  }
  if (input.artifactContent === null || input.artifactContent === undefined) {
    throw new Error("scan_contradictions requires a claims artifact (claimsArtifactId)");
  }
  const claims = parseClaims(input.artifactContent);
  const candidates = scan(claims);
  const contradictionsArtifactId = randomUUID();
  const body = { candidates };
  writeFileSync(process.env.TB_PEER_OUTPUT_PATH, JSON.stringify({
    result: {
      contradictionsArtifactId,
      candidateCount: candidates.length,
      claimCount: claims.length,
    },
    artifacts: [
      {
        artifactId: contradictionsArtifactId,
        kind: "json",
        name: "contradictions.json",
        mimeType: "application/json",
        content: body,
        preview: body,
      },
    ],
  }));
}

try {
  main();
} catch (error) {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
`;

/**
 * peer.manifest.json cell content for the contradiction-scan notebook. The
 * notebookId must be the ACTUAL id of the graduating notebook (graduation
 * rejects mismatches), so the author fills it in at authoring time.
 */
export function contradictionScanManifest(notebookId: string): PeerManifest {
  return {
    schemaVersion: "peer-notebook.v0",
    peerId: CONTRADICTION_SCAN_PEER_ID,
    notebookId,
    runtime: {
      provider: "local-process",
      entry: `${NOTEBOOK_ENTRY_PREFIX}${CONTRADICTION_SCAN_ENTRY_FILENAME}`,
      timeoutMs: 60_000,
    },
    exposes: {
      tools: [
        {
          name: CONTRADICTION_SCAN_TOOL_NAME,
          description:
            "Scan a claims artifact for contradiction candidates (negation, antonym, numeric mismatch)",
          inputSchema: {
            type: "object",
            properties: {
              claimsArtifactId: { type: "string" },
            },
            required: ["claimsArtifactId"],
            additionalProperties: false,
          },
          outputSchema: {
            type: "object",
            properties: {
              contradictionsArtifactId: { type: "string" },
              candidateCount: { type: "number" },
              claimCount: { type: "number" },
            },
            required: ["contradictionsArtifactId", "candidateCount", "claimCount"],
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
      exportNotebookOnInvoke: false,
      retainArtifactsDays: 30,
    },
    budgets: {
      maxDurationMs: 60_000,
      maxToolCalls: 4,
      maxArtifactBytes: 10_000_000,
    },
  };
}
