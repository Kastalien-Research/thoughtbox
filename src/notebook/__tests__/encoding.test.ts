import { describe, expect, it } from "vitest";
import { encode, decode } from "../encoding.js";
import { compileOutcomeContract } from "../contracts.js";
import type { Notebook, CodeCell } from "../types.js";

function baseNotebook(cells: Notebook["cells"]): Notebook {
  return {
    id: "nb_test",
    cells,
    language: "javascript",
    createdAt: 1,
    updatedAt: 1,
  };
}

function codeCell(overrides: Partial<CodeCell> & { id: string; filename: string }): CodeCell {
  return {
    type: "code",
    language: "javascript",
    source: 'console.log("hi");',
    status: "idle",
    ...overrides,
  };
}

const CONTRACT_INPUT = {
  schemaVersion: "outcome-contract.v0",
  expectations: [
    { source: { kind: "exitCode" }, op: "eq", value: 0 },
    { source: { kind: "output", pointer: "/count" }, op: "gte", value: 3 },
  ],
};

describe(".src.md encoding round trip", () => {
  it("round-trips a plain notebook without emitting binding metadata", () => {
    const notebook = baseNotebook([
      { id: "t", type: "title", text: "Plain" },
      codeCell({ id: "c1", filename: "step.js" }),
    ]);

    const srcmd = encode(notebook);
    expect(srcmd).not.toContain("thoughtbox:cell");

    const decoded = decode(srcmd);
    const code = decoded.cells.find((c) => c.type === "code") as CodeCell;
    expect(code.source).toBe('console.log("hi");');
    expect(code.contract).toBeUndefined();
    expect(code.validatorFor).toBeUndefined();
  });

  it("round-trips a tier-1 contract with its hash and the cell id", () => {
    const attached = compileOutcomeContract(CONTRACT_INPUT);
    const notebook = baseNotebook([
      codeCell({ id: "cell_contracted", filename: "step.js", contract: attached }),
    ]);

    const srcmd = encode(notebook);
    expect(srcmd).toContain("<!-- thoughtbox:cell ");

    const decoded = decode(srcmd);
    const code = decoded.cells.find((c) => c.type === "code") as CodeCell;
    expect(code.id).toBe("cell_contracted");
    expect(code.contract).toEqual(attached);
    expect(code.contract!.contractHash).toBe(attached.contractHash);
  });

  it("round-trips a tier-2 validator binding including target cell id", () => {
    const notebook = baseNotebook([
      codeCell({ id: "subject", filename: "step.js" }),
      codeCell({
        id: "checker",
        filename: "check.js",
        validatorFor: "subject",
        validatorSnapshotHash: "deadbeef",
      }),
    ]);

    const decoded = decode(encode(notebook));
    const cells = decoded.cells.filter((c) => c.type === "code") as CodeCell[];
    const subject = cells.find((c) => c.filename === "step.js")!;
    const checker = cells.find((c) => c.filename === "check.js")!;
    // The target's id is persisted so the binding still resolves.
    expect(subject.id).toBe("subject");
    expect(checker.validatorFor).toBe("subject");
    expect(checker.validatorSnapshotHash).toBe("deadbeef");
  });

  it("round-trip is stable: encode(decode(encode(n))) === encode(n)", () => {
    const attached = compileOutcomeContract(CONTRACT_INPUT);
    const notebook = baseNotebook([
      { id: "t", type: "title", text: "Stable" },
      codeCell({ id: "subject", filename: "step.js", contract: attached }),
      codeCell({
        id: "checker",
        filename: "check.js",
        validatorFor: "subject",
        validatorSnapshotHash: "deadbeef",
      }),
    ]);

    const once = encode(notebook);
    expect(encode(decode(once))).toBe(once);
  });

  it("rejects a tampered contract loudly on decode (hash mismatch)", () => {
    const attached = compileOutcomeContract(CONTRACT_INPUT);
    const srcmd = encode(
      baseNotebook([codeCell({ id: "c1", filename: "step.js", contract: attached })]),
    );
    const tampered = srcmd.replace('"value":0', '"value":1');
    expect(tampered).not.toBe(srcmd);
    expect(() => decode(tampered)).toThrow(/contract hash mismatch/);
  });

  it("rejects malformed binding metadata loudly", () => {
    const srcmd = [
      '<!-- srcbook:{"language":"javascript"} -->',
      "",
      "###### step.js",
      "",
      "<!-- thoughtbox:cell {not json} -->",
      "",
      "```javascript",
      "console.log(1);",
      "```",
      "",
    ].join("\n");
    expect(() => decode(srcmd)).toThrow(/not valid JSON/);
  });

  it("rejects a dangling validatorFor reference loudly", () => {
    const srcmd = [
      '<!-- srcbook:{"language":"javascript"} -->',
      "",
      "###### check.js",
      "",
      '<!-- thoughtbox:cell {"id":"checker","validatorFor":"ghost"} -->',
      "",
      "```javascript",
      "console.log(1);",
      "```",
      "",
    ].join("\n");
    expect(() => decode(srcmd)).toThrow(/validatorFor target ghost/);
  });

  it("rejects duplicate persisted cell ids loudly", () => {
    const cellBlock = (filename: string) =>
      [
        `###### ${filename}`,
        "",
        '<!-- thoughtbox:cell {"id":"dup"} -->',
        "",
        "```javascript",
        "console.log(1);",
        "```",
        "",
      ].join("\n");
    const srcmd = [
      '<!-- srcbook:{"language":"javascript"} -->',
      "",
      cellBlock("a.js"),
      cellBlock("b.js"),
    ].join("\n");
    expect(() => decode(srcmd)).toThrow(/Duplicate cell id "dup"/);
  });

  it("rejects metadata declaring both contract and validatorFor", () => {
    const attached = compileOutcomeContract(CONTRACT_INPUT);
    const metadata = JSON.stringify({
      id: "c1",
      contract: attached,
      validatorFor: "c0",
    });
    const srcmd = [
      '<!-- srcbook:{"language":"javascript"} -->',
      "",
      "###### step.js",
      "",
      `<!-- thoughtbox:cell ${metadata} -->`,
      "",
      "```javascript",
      "console.log(1);",
      "```",
      "",
    ].join("\n");
    expect(() => decode(srcmd)).toThrow(/either a tier-1 contract or validatorFor/);
  });

  it("still decodes legacy .src.md content without binding metadata", () => {
    const srcmd = [
      '<!-- srcbook:{"language":"typescript"} -->',
      "",
      "# Legacy",
      "",
      "Some prose.",
      "",
      "###### step.ts",
      "",
      "```typescript",
      'console.log("legacy");',
      "```",
      "",
    ].join("\n");
    const decoded = decode(srcmd);
    expect(decoded.cells.map((c) => c.type)).toEqual(["title", "markdown", "code"]);
  });
});
