import { describe, it, expect, beforeEach } from "vitest";
import { NotebookStateManager } from "../state.js";
import { encode, decode } from "../encoding.js";
import type { Notebook } from "../types.js";

describe("variable-addressed cells", () => {
  let manager: NotebookStateManager;
  let notebookId: string;

  beforeEach(async () => {
    manager = new NotebookStateManager();
    await manager.init();
    const nb = await manager.createNotebook("Test", "javascript");
    notebookId = nb.id;
  });

  it("stores and peeks a variable (round-trip)", () => {
    manager.storeVar(notebookId, "greeting", "hello world");
    const result = manager.peekVar(notebookId, "greeting");
    expect(result.value).toBe("hello world");
    expect(result.size).toBe(11);
  });

  it("updates existing variable in place", () => {
    manager.storeVar(notebookId, "counter", "1");
    manager.storeVar(notebookId, "counter", "42");

    const result = manager.peekVar(notebookId, "counter");
    expect(result.value).toBe("42");
    expect(result.size).toBe(2);

    const nb = manager.getNotebook(notebookId)!;
    const varCells = nb.cells.filter((c) => c.type === "variable");
    expect(varCells).toHaveLength(1);
  });

  it("peeks with start/end slicing", () => {
    manager.storeVar(notebookId, "data", "abcdefghij");
    const result = manager.peekVar(notebookId, "data", 2, 5);
    expect(result.value).toBe("cde");
    expect(result.size).toBe(10);
  });

  it("rejects variable exceeding 100K char limit", () => {
    const bigValue = "x".repeat(100_001);
    expect(() => {
      manager.storeVar(notebookId, "toobig", bigValue);
    }).toThrow("exceeds 100K char limit");
  });

  it("rejects when exceeding 100 variable cell limit", () => {
    for (let i = 0; i < 100; i++) {
      manager.storeVar(notebookId, `var_${i}`, "v");
    }
    expect(() => {
      manager.storeVar(notebookId, "var_overflow", "v");
    }).toThrow("Variable cell limit reached");
  });

  it("throws on peek of nonexistent variable", () => {
    expect(() => {
      manager.peekVar(notebookId, "ghost");
    }).toThrow('Variable "ghost" not found');
  });

  it("round-trips variable cells through .src.md export/import", () => {
    manager.storeVar(notebookId, "config", '{"key":"val"}');
    manager.storeVar(notebookId, "notes", "line1\nline2");

    const nb = manager.getNotebook(notebookId)!;
    const srcmd = encode(nb);
    const restored = decode(srcmd);

    const vars = restored.cells.filter((c) => c.type === "variable");
    expect(vars).toHaveLength(2);

    const config = vars.find(
      (c) => c.type === "variable" && c.name === "config"
    );
    expect(config).toBeDefined();
    if (config && config.type === "variable") {
      expect(config.value).toBe('{"key":"val"}');
      expect(config.size).toBe(13);
    }

    const notes = vars.find(
      (c) => c.type === "variable" && c.name === "notes"
    );
    expect(notes).toBeDefined();
    if (notes && notes.type === "variable") {
      expect(notes.value).toBe("line1\nline2");
      expect(notes.size).toBe(11);
    }
  });
});
