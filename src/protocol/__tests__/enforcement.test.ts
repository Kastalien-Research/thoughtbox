import { describe, expect, it } from "vitest";
import { InMemoryProtocolHandler } from "../index.js";

describe("InMemoryProtocolHandler enforcement", () => {
  it("blocks mutating work when Ulysses reaches S=2", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("Investigate failing health check");
    const sessionId = init.session_id as string;

    await handler.ulyssesPlan(sessionId, {
      primary: "Run the first diagnostic",
      recovery: "Revert the change",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sessionId, {
      assessment: "unexpected-unfavorable",
      severity: 1,
      details: "First surprise",
    });

    await handler.ulyssesPlan(sessionId, {
      primary: "Run the second diagnostic",
      recovery: "Undo the second change",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sessionId, {
      assessment: "unexpected-unfavorable",
      severity: 1,
      details: "Second surprise",
    });

    await expect(
      handler.checkEnforcement({ mutation: false, targetPath: "src/app.ts" }),
    ).resolves.toEqual({ enforce: false });

    await expect(
      handler.checkEnforcement({ mutation: true }),
    ).resolves.toMatchObject({
      enforce: true,
      blocked: true,
      protocol: "ulysses",
      required_action: "reflect",
    });
  });

  it("blocks test-file writes during Theseus", async () => {
    const handler = new InMemoryProtocolHandler();
    await handler.theseusInit(["src/refactor/"], "Extract shared helpers");

    await expect(
      handler.checkEnforcement({
        mutation: true,
        targetPath: "src/refactor/widget.test.ts",
      }),
    ).resolves.toMatchObject({
      enforce: true,
      blocked: true,
      protocol: "theseus",
      reason: "TEST LOCK: Cannot modify test files during refactoring",
    });
  });

  it("blocks out-of-scope writes until a visa exists", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.theseusInit(
      ["src/refactor/"],
      "Extract shared helpers",
    );
    const sessionId = init.session_id as string;

    await expect(
      handler.checkEnforcement({
        mutation: true,
        targetPath: "src/other/file.ts",
      }),
    ).resolves.toMatchObject({
      enforce: true,
      blocked: true,
      protocol: "theseus",
      required_action: "visa",
    });

    await handler.theseusVisa(sessionId, {
      filePath: "src/other/file.ts",
      justification: "Compiler breakage in dependent module",
      antiPatternAcknowledged: true,
    });

    await expect(
      handler.checkEnforcement({
        mutation: true,
        targetPath: "src/other/file.ts",
      }),
    ).resolves.toMatchObject({
      enforce: true,
      blocked: false,
      protocol: "theseus",
    });
  });

  it("keeps enforcement scoped to the active workspace", async () => {
    const handler = new InMemoryProtocolHandler();
    handler.setProject("repo-a");
    await handler.theseusInit(["src/refactor/"], "Workspace-specific refactor");

    await expect(
      handler.checkEnforcement({
        mutation: true,
        targetPath: "src/refactor/file.ts",
        workspaceId: "repo-b",
      }),
    ).resolves.toEqual({ enforce: false });
  });
});
