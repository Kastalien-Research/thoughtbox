import { describe, it, expect, beforeEach } from "vitest";
import { NotebookStateManager } from "../state.js";

describe("REPL Globals", () => {
  let mgr: NotebookStateManager;
  let notebookId: string;

  beforeEach(async () => {
    mgr = new NotebookStateManager();
    await mgr.init();
    const nb = await mgr.createNotebook("repl-test", "javascript");
    notebookId = nb.id;
  });

  it("store() and peek() work inside executed code", async () => {
    const cellId = await mgr.addCodeCell(
      notebookId,
      "repl-test.mjs",
      `
      await store('result', 'computed value');
      const val = await peek('result');
      console.log(val.value);
    `
    );
    const result = await mgr.runCellWithREPL(notebookId, cellId);
    expect(result.success).toBe(true);
    expect(result.stdout).toContain("computed value");
    const peeked = mgr.peekVar(notebookId, "result");
    expect(peeked.value).toBe("computed value");
  });

  it("vars() lists all variables", async () => {
    mgr.storeVar(notebookId, "a", "1");
    mgr.storeVar(notebookId, "b", "2");
    const cellId = await mgr.addCodeCell(
      notebookId,
      "vars-test.mjs",
      `
      const v = await vars();
      console.log(JSON.stringify(v));
    `
    );
    const result = await mgr.runCellWithREPL(notebookId, cellId);
    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.stdout.trim());
    expect(parsed).toContain("a");
    expect(parsed).toContain("b");
  });

  it("FINAL() sets notebook result", async () => {
    const cellId = await mgr.addCodeCell(
      notebookId,
      "final-test.mjs",
      `
      FINAL('the answer is 42');
    `
    );
    const result = await mgr.runCellWithREPL(notebookId, cellId);
    expect(result.success).toBe(true);
    expect(result.finalResult).toBe("the answer is 42");
  });

  it("print() captures output", async () => {
    const cellId = await mgr.addCodeCell(
      notebookId,
      "print-test.mjs",
      `
      print('hello', 'world');
    `
    );
    const result = await mgr.runCellWithREPL(notebookId, cellId);
    expect(result.success).toBe(true);
    expect(result.stdout).toContain("hello world");
  });
});
