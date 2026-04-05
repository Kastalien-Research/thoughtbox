import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { parseTypeScriptProject } from "../parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(
  __dirname,
  "fixtures",
  "simple-project",
);

describe("parseTypeScriptProject", () => {
  it("discovers modules from directories with index.ts", () => {
    const model = parseTypeScriptProject(fixtureDir);
    const names = model.modules.map((m) => m.name);
    expect(names).toContain("root");
    expect(names).toContain("utils");
  });

  it("extracts exports from modules", () => {
    const model = parseTypeScriptProject(fixtureDir);
    const utils = model.modules.find(
      (m) => m.name === "utils",
    );
    expect(utils).toBeDefined();
    expect(utils?.exports).toContain("greet");
    expect(utils?.exports).toContain("add");

    const root = model.modules.find(
      (m) => m.name === "root",
    );
    expect(root).toBeDefined();
    expect(root?.exports).toContain("greet");
    expect(root?.exports).toContain("main");
  });

  it("detects dependency edges", () => {
    const model = parseTypeScriptProject(fixtureDir);
    const rootToUtils = model.edges.find(
      (e) => e.from === "root" && e.to === "utils",
    );
    expect(rootToUtils).toBeDefined();
  });

  it("counts files per module", () => {
    const model = parseTypeScriptProject(fixtureDir);
    const root = model.modules.find(
      (m) => m.name === "root",
    );
    expect(root?.fileCount).toBe(1);

    const utils = model.modules.find(
      (m) => m.name === "utils",
    );
    expect(utils?.fileCount).toBe(1);
  });

  it("throws on missing tsconfig.json", () => {
    expect(() =>
      parseTypeScriptProject("/tmp/nonexistent-dir"),
    ).toThrow(/tsconfig\.json/i);
  });
});
