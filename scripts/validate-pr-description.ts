#!/usr/bin/env tsx
/**
 * Deterministic validator for PR description JSON files.
 *
 * Checks (in order):
 * 1. prs/<branch>.json exists
 * 2. Valid JSON conforming to .schemas/pr-description-v1.json (via Zod)
 * 3. All referenced ADR JSON files exist
 * 4. All adr_claim_id values resolve to actual claims in referenced ADRs
 * 5. Any claim with evidence_type "human_attestation" has an attestation block
 * 6. Any claim with evidence_type "agentic_test" has a non-null evidence_path
 *
 * Usage:
 *   pnpm validate:pr --branch feat/my-feature
 *   pnpm validate:pr --branch feat/my-feature --adr-dir .adr/staging
 */

import { promises as fsp } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// ── Schemas ─────────────────────────────────────────────────────────────────

const ClaimSchema = z.object({
  id: z.string().min(1),
  adr_claim_id: z.string().min(1),
  statement: z.string().min(1),
  evidence_type: z.enum([
    "implementation",
    "unit_test",
    "integration_test",
    "agentic_test",
    "human_attestation",
    "deterministic_check",
  ]),
  evidence_path: z.string().nullable(),
  evidence_description: z.string().nullable().optional(),
});

const AttestationSchema = z.object({
  attested_by: z.string().min(1),
  timestamp: z.string().min(1),
  note: z.string().optional(),
});

const PRDescriptionSchema = z.object({
  branch: z.string().min(1),
  adrs: z.array(z.string()),
  summary: z.string().min(1),
  claims: z.array(ClaimSchema).min(1),
  attestation: AttestationSchema.nullable().optional(),
});

const AdrClaimSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  type: z.enum(["implementation", "behavioral", "governance", "performance"]),
  behavioral: z.boolean(),
  required_evidence: z.string().optional(),
});

const AdrSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["proposed", "accepted", "rejected", "superseded"]),
  date: z.string().min(1),
  claims: z.array(AdrClaimSchema).min(1),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function branchToFilename(branch: string): string {
  return branch.replace(/\//g, "-") + ".json";
}

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

interface Failure {
  code: string;
  message: string;
}

async function readJson(filePath: string): Promise<unknown> {
  const content = await fsp.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function findAdrFile(adrId: string): Promise<string | null> {
  const dirs = ["staging", "accepted", "rejected", "superseded"];
  for (const dir of dirs) {
    const candidate = path.join(REPO_ROOT, ".adr", dir, `${adrId}.json`);
    try {
      await fsp.access(candidate);
      return candidate;
    } catch {
      // not in this dir
    }
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const branch = argValue("--branch");
  if (!branch) {
    console.error("Usage: pnpm validate:pr --branch <branch-name>");
    process.exitCode = 1;
    return;
  }

  const failures: Failure[] = [];
  const filename = branchToFilename(branch);
  const prPath = path.join(REPO_ROOT, "prs", filename);

  // 1. File exists
  try {
    await fsp.access(prPath);
  } catch {
    failures.push({
      code: "missing-pr-description",
      message: `PR description not found: prs/${filename}. Every PR targeting main must include a machine-readable PR description.`,
    });
    report(failures);
    return;
  }

  // 2. Valid JSON + schema
  let raw: unknown;
  try {
    raw = await readJson(prPath);
  } catch (err) {
    failures.push({
      code: "invalid-json",
      message: `prs/${filename} is not valid JSON: ${String(err)}`,
    });
    report(failures);
    return;
  }

  const parsed = PRDescriptionSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      failures.push({
        code: "schema-violation",
        message: `prs/${filename}: ${issue.path.join(".")} — ${issue.message}`,
      });
    }
    report(failures);
    return;
  }

  const pr = parsed.data;

  // 3. Branch field matches actual branch
  if (pr.branch !== branch) {
    failures.push({
      code: "branch-mismatch",
      message: `prs/${filename}: branch field "${pr.branch}" does not match actual branch "${branch}"`,
    });
  }

  // 4. Referenced ADR JSON files exist and are valid
  const adrClaims = new Map<string, { id: string; behavioral: boolean }[]>();

  for (const adrId of pr.adrs) {
    const adrPath = await findAdrFile(adrId);
    if (!adrPath) {
      failures.push({
        code: "missing-adr",
        message: `Referenced ADR "${adrId}" has no corresponding JSON file in .adr/staging/, .adr/accepted/, etc. Only JSON ADRs are cross-referenced by this validator.`,
      });
      continue;
    }

    let adrRaw: unknown;
    try {
      adrRaw = await readJson(adrPath);
    } catch (err) {
      failures.push({
        code: "invalid-adr-json",
        message: `${adrPath} is not valid JSON: ${String(err)}`,
      });
      continue;
    }

    const adrParsed = AdrSchema.safeParse(adrRaw);
    if (!adrParsed.success) {
      failures.push({
        code: "invalid-adr-schema",
        message: `${adrPath} does not conform to adr-v1 schema: ${adrParsed.error.issues.map((i) => i.message).join("; ")}`,
      });
      continue;
    }

    adrClaims.set(
      adrId,
      adrParsed.data.claims.map((c) => ({ id: c.id, behavioral: c.behavioral }))
    );
  }

  // 5. All adr_claim_id values resolve
  for (const claim of pr.claims) {
    if (claim.adr_claim_id === "__none__") continue;

    let found = false;
    for (const [, claims] of adrClaims) {
      if (claims.some((c) => c.id === claim.adr_claim_id)) {
        found = true;
        break;
      }
    }

    if (!found) {
      failures.push({
        code: "unresolved-claim-ref",
        message: `Claim "${claim.id}" references adr_claim_id "${claim.adr_claim_id}" which does not exist in any referenced ADR. If this claim has no ADR, use "__none__" as the adr_claim_id.`,
      });
    }

    // 6. Behavioral ADR claims must have agentic_test or human_attestation
    for (const [adrId, claims] of adrClaims) {
      const adrClaim = claims.find((c) => c.id === claim.adr_claim_id);
      if (adrClaim?.behavioral) {
        if (
          claim.evidence_type !== "agentic_test" &&
          claim.evidence_type !== "human_attestation"
        ) {
          failures.push({
            code: "behavioral-claim-insufficient-evidence",
            message: `Claim "${claim.id}" implements ADR ${adrId} claim "${claim.adr_claim_id}" which is behavioral=true, but evidence_type is "${claim.evidence_type}". Behavioral claims require "agentic_test" or "human_attestation".`,
          });
        }
      }
    }
  }

  // 7. human_attestation claims require attestation block
  const hasAttestationClaim = pr.claims.some(
    (c) => c.evidence_type === "human_attestation"
  );
  if (hasAttestationClaim && !pr.attestation) {
    failures.push({
      code: "missing-attestation-block",
      message: `One or more claims use evidence_type "human_attestation" but the PR description has no attestation block`,
    });
  }

  // 8. agentic_test claims require evidence_path
  for (const claim of pr.claims) {
    if (claim.evidence_type === "agentic_test" && !claim.evidence_path) {
      failures.push({
        code: "missing-evidence-path",
        message: `Claim "${claim.id}" has evidence_type "agentic_test" but no evidence_path`,
      });
    }
  }

  report(failures);
}

function report(failures: Failure[]): void {
  if (failures.length === 0) {
    console.log("validate:pr passed");
    return;
  }

  console.log("validate:pr failed");
  for (const f of failures) {
    console.log(`  [${f.code}] ${f.message}`);
  }
  process.exitCode = 1;
}

void main().catch((err) => {
  console.error("validate:pr error:", err);
  process.exitCode = 1;
});
