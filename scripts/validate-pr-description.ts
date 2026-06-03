#!/usr/bin/env tsx
/**
 * Deterministic validator for PR description JSON files.
 *
 * Checks (in order):
 * 1. prs/<branch>.json exists
 * 2. Valid JSON conforming to PR description schema (via Zod)
 * 3. Referenced spec claims resolve against .specs/ markdown frontmatter
 * 4. Legacy ADR claim references resolve during migration (deprecated)
 * 5. Behavioral claims require agentic_test or human_attestation evidence
 * 6. human_attestation claims require attestation block
 * 7. agentic_test claims require evidence_path
 *
 * Usage:
 *   pnpm validate:pr --branch feat/my-feature
 */

import { promises as fsp } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { loadSpecClaimIndex, parseSpecClaimRef } from "./lib/spec-claims.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const ClaimSchema = z
  .object({
    id: z.string().min(1),
    spec_claim_id: z.string().min(1).optional(),
    adr_claim_id: z.string().min(1).optional(),
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
  })
  .superRefine((claim, ctx) => {
    if (!claim.spec_claim_id && !claim.adr_claim_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each claim must include spec_claim_id or adr_claim_id (legacy)",
        path: ["spec_claim_id"],
      });
    }
  });

const AttestationSchema = z.object({
  attested_by: z.string().min(1),
  timestamp: z.string().min(1),
  note: z.string().optional(),
});

const PRDescriptionSchema = z.object({
  branch: z.string().min(1),
  specs: z.array(z.string()).optional().default([]),
  adrs: z.array(z.string()).optional().default([]),
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

interface Warning {
  code: string;
  message: string;
}

async function readJson(filePath: string): Promise<unknown> {
  const content = await fsp.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function findAdrFile(adrId: string): Promise<string | null> {
  const bases = [
    path.join(REPO_ROOT, "docs/decisions/archive/adr"),
    path.join(REPO_ROOT, "docs/decisions/archive"),
    path.join(REPO_ROOT, ".adr"),
  ];
  const dirs = ["staging", "accepted", "rejected", "superseded", "retired"];

  for (const base of bases) {
    for (const dir of dirs) {
      const candidate = path.join(base, dir, `${adrId}.json`);
      try {
        await fsp.access(candidate);
        return candidate;
      } catch {
        // not in this dir
      }
    }
    const flatCandidate = path.join(base, `${adrId}.json`);
    try {
      await fsp.access(flatCandidate);
      return flatCandidate;
    } catch {
      // not found
    }
  }
  return null;
}

function claimRef(claim: z.infer<typeof ClaimSchema>): string {
  return claim.spec_claim_id ?? claim.adr_claim_id ?? "__none__";
}

function isBehavioralClaim(
  claim: z.infer<typeof ClaimSchema>,
  specIndex: Map<string, { behavioral: boolean }>,
  adrClaims: Map<string, { id: string; behavioral: boolean }[]>
): boolean {
  if (claim.spec_claim_id && claim.spec_claim_id !== "__none__") {
    return specIndex.get(claim.spec_claim_id)?.behavioral ?? false;
  }
  if (claim.adr_claim_id && claim.adr_claim_id !== "__none__") {
    for (const claims of adrClaims.values()) {
      const adrClaim = claims.find((c) => c.id === claim.adr_claim_id);
      if (adrClaim?.behavioral) return true;
    }
  }
  return false;
}

export async function validatePrDescription(
  branch: string,
  repoRoot: string = REPO_ROOT
): Promise<{ failures: Failure[]; warnings: Warning[] }> {
  const failures: Failure[] = [];
  const warnings: Warning[] = [];
  const filename = branchToFilename(branch);
  const prPath = path.join(repoRoot, "prs", filename);

  try {
    await fsp.access(prPath);
  } catch {
    failures.push({
      code: "missing-pr-description",
      message: `PR description not found: prs/${filename}. Every PR targeting main must include a machine-readable PR description.`,
    });
    return { failures, warnings };
  }

  let raw: unknown;
  try {
    raw = await readJson(prPath);
  } catch (err) {
    failures.push({
      code: "invalid-json",
      message: `prs/${filename} is not valid JSON: ${String(err)}`,
    });
    return { failures, warnings };
  }

  const parsed = PRDescriptionSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      failures.push({
        code: "schema-violation",
        message: `prs/${filename}: ${issue.path.join(".")} — ${issue.message}`,
      });
    }
    return { failures, warnings };
  }

  const pr = parsed.data;

  if (pr.branch !== branch) {
    failures.push({
      code: "branch-mismatch",
      message: `prs/${filename}: branch field "${pr.branch}" does not match actual branch "${branch}"`,
    });
  }

  if (pr.adrs.length > 0) {
    warnings.push({
      code: "deprecated-adrs-field",
      message: `prs/${filename} uses deprecated "adrs" field. Migrate to "specs" and spec_claim_id references.`,
    });
  }

  const specClaimIndex = await loadSpecClaimIndex(path.join(repoRoot, ".specs"));
  const specBehavioralIndex = new Map<string, { behavioral: boolean }>();
  for (const [ref, entry] of specClaimIndex) {
    specBehavioralIndex.set(ref, { behavioral: entry.behavioral });
  }

  const adrClaims = new Map<string, { id: string; behavioral: boolean }[]>();
  for (const adrId of pr.adrs) {
    const adrPath = await findAdrFile(adrId);
    if (!adrPath) {
      failures.push({
        code: "missing-adr",
        message: `Referenced ADR "${adrId}" has no corresponding JSON file in docs/decisions/archive/ or legacy .adr/. Migrate to spec_claim_id references.`,
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

  for (const claim of pr.claims) {
    const ref = claimRef(claim);

    if (claim.adr_claim_id && !claim.spec_claim_id) {
      warnings.push({
        code: "deprecated-adr-claim-id",
        message: `Claim "${claim.id}" uses deprecated adr_claim_id "${claim.adr_claim_id}". Migrate to spec_claim_id (spec_id:claim_id).`,
      });
    }

    if (ref === "__none__") continue;

    if (claim.spec_claim_id) {
      if (claim.spec_claim_id !== "__none__") {
        const parsedRef = parseSpecClaimRef(claim.spec_claim_id);
        if (!parsedRef) {
          failures.push({
            code: "invalid-spec-claim-ref",
            message: `Claim "${claim.id}" spec_claim_id "${claim.spec_claim_id}" must be spec_id:claim_id (e.g. SPEC-CONTROL-PLANE:c1) or "__none__".`,
          });
          continue;
        }

        if (!specClaimIndex.has(claim.spec_claim_id)) {
          failures.push({
            code: "unresolved-spec-claim-ref",
            message: `Claim "${claim.id}" references spec_claim_id "${claim.spec_claim_id}" which does not exist in any .specs/ markdown frontmatter.`,
          });
        }
      }
    } else if (claim.adr_claim_id) {
      let found = false;
      for (const claims of adrClaims.values()) {
        if (claims.some((c) => c.id === claim.adr_claim_id)) {
          found = true;
          break;
        }
      }
      if (!found) {
        failures.push({
          code: "unresolved-claim-ref",
          message: `Claim "${claim.id}" references adr_claim_id "${claim.adr_claim_id}" which does not exist in any referenced ADR. Migrate to spec_claim_id or use "__none__".`,
        });
      }
    }

    if (isBehavioralClaim(claim, specBehavioralIndex, adrClaims)) {
      if (
        claim.evidence_type !== "agentic_test" &&
        claim.evidence_type !== "human_attestation"
      ) {
        failures.push({
          code: "behavioral-claim-insufficient-evidence",
          message: `Claim "${claim.id}" implements behavioral spec/ADR claim "${ref}" but evidence_type is "${claim.evidence_type}". Behavioral claims require "agentic_test" or "human_attestation".`,
        });
      }
    }
  }

  const hasAttestationClaim = pr.claims.some(
    (c) => c.evidence_type === "human_attestation"
  );
  if (hasAttestationClaim && !pr.attestation) {
    failures.push({
      code: "missing-attestation-block",
      message: `One or more claims use evidence_type "human_attestation" but the PR description has no attestation block`,
    });
  }

  for (const claim of pr.claims) {
    if (claim.evidence_type === "agentic_test" && !claim.evidence_path) {
      failures.push({
        code: "missing-evidence-path",
        message: `Claim "${claim.id}" has evidence_type "agentic_test" but no evidence_path`,
      });
    }
  }

  return { failures, warnings };
}

function report(failures: Failure[], warnings: Warning[]): void {
  for (const w of warnings) {
    console.log(`  [warn:${w.code}] ${w.message}`);
  }

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

async function main(): Promise<void> {
  const branch = argValue("--branch");
  if (!branch) {
    console.error("Usage: pnpm validate:pr --branch <branch-name>");
    process.exitCode = 1;
    return;
  }

  const { failures, warnings } = await validatePrDescription(branch);
  report(failures, warnings);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("validate-pr-description.ts") ||
    process.argv[1].endsWith("validate-pr-description.js"));

if (isMain) {
  void main().catch((err) => {
    console.error("validate:pr error:", err);
    process.exitCode = 1;
  });
}
