import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validatePrDescription } from "../validate-pr-description.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

describe("validatePrDescription (spec claims)", () => {
  it("passes for a valid spec_claim_id reference", async () => {
    const { failures } = await validatePrDescription(
      "test/spec-fixture-valid",
      REPO_ROOT
    );
    expect(failures).toEqual([]);
  });

  it("fails when spec_claim_id does not exist in spec frontmatter", async () => {
    const { failures } = await validatePrDescription(
      "test/spec-fixture-missing-claim",
      REPO_ROOT
    );
    expect(
      failures.some((f) => f.code === "unresolved-spec-claim-ref")
    ).toBe(true);
  });

  it("fails when behavioral spec claim uses insufficient evidence_type", async () => {
    const { failures } = await validatePrDescription(
      "test/spec-fixture-behavioral-evidence",
      REPO_ROOT
    );
    expect(
      failures.some((f) => f.code === "behavioral-claim-insufficient-evidence")
    ).toBe(true);
  });
});
