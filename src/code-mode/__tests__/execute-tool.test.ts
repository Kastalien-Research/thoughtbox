import { describe, it, expect } from "vitest";
import { ExecuteTool } from "../execute-tool.js";
import { ThoughtTool } from "../../thought/tool.js";
import { SessionTool } from "../../sessions/tool.js";
import { KnowledgeTool } from "../../knowledge/tool.js";
import { NotebookTool } from "../../notebook/tool.js";
import { TheseusTool, UlyssesTool, InMemoryProtocolHandler } from "../../protocol/index.js";
import { ObservabilityGatewayHandler } from "../../observability/index.js";
import { ThoughtHandler } from "../../thought-handler.js";
import { SessionHandler } from "../../sessions/index.js";
import { KnowledgeHandler, FileSystemKnowledgeStorage } from "../../knowledge/index.js";
import { NotebookHandler } from "../../notebook/index.js";
import { InMemoryStorage } from "../../persistence/index.js";

function createExecuteTool(): ExecuteTool {
  const storage = new InMemoryStorage();
  const thoughtHandler = new ThoughtHandler(true, storage);
  const sessionHandler = new SessionHandler({ storage, thoughtHandler });
  const knowledgeHandler = new KnowledgeHandler(new FileSystemKnowledgeStorage({}));
  const notebookHandler = new NotebookHandler();
  const protocolHandler = new InMemoryProtocolHandler();

  return new ExecuteTool({
    thoughtTool: new ThoughtTool(thoughtHandler),
    sessionTool: new SessionTool(sessionHandler),
    knowledgeTool: new KnowledgeTool(knowledgeHandler),
    notebookTool: new NotebookTool(notebookHandler),
    theseusTool: new TheseusTool(protocolHandler),
    ulyssesTool: new UlyssesTool(protocolHandler),
    observabilityHandler: new ObservabilityGatewayHandler({ storage }),
  });
}

describe("thoughtbox_execute", () => {
  it("runs simple code and returns result", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({ code: `async () => 42` });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBe(42);
    expect(output.error).toBeUndefined();
  });

  it("returns durationMs in envelope", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({ code: `async () => "hello"` });
    const output = JSON.parse(result.content[0].text);
    expect(output.durationMs).toBeTypeOf("number");
    expect(output.result).toBe("hello");
  });

  it("captures console.log output", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { console.log("debug info"); return "ok"; }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.logs).toContain("debug info");
    expect(output.result).toBe("ok");
  });

  it("returns error for thrown exceptions", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { throw new Error("boom"); }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBe("boom");
    expect(output.result).toBeNull();
  });

  it("blocks access to require", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { return typeof require; }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBe("undefined");
  });

  it("blocks access to process", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { return typeof process; }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBe("undefined");
  });

  it("blocks access to fetch", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { return typeof fetch; }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBe("undefined");
  });

  it("blocks constructor-chain escape to host process", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => {
        const Fn = [].constructor.constructor;
        return Fn("return typeof process")();
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBe("undefined");
  });

  it("tb.hub is not available", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { return typeof tb.hub; }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBe("undefined");
  });

  it("tb.init is not available", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { return typeof tb.init; }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBe("undefined");
  });

  it("can call tb.session.list()", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { return await tb.session.list(); }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    // InMemoryStorage returns empty sessions by default
    expect(output.result).toBeDefined();
  });

  it("can call tb.thought()", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => {
        return await tb.thought({
          thought: "Testing code mode",
          thoughtType: "reasoning",
          nextThoughtNeeded: false,
        });
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result).toBeDefined();
  });

  it("can chain multiple operations", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => {
        const thought = await tb.thought({
          thought: "First thought",
          thoughtType: "reasoning",
          nextThoughtNeeded: true,
          sessionTitle: "Code Mode Test",
        });
        const sessions = await tb.session.list();
        return { thought, sessions };
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.thought).toBeDefined();
    expect(output.result.sessions).toBeDefined();
  });

  it("can call tb.theseus()", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => {
        const init = await tb.theseus({
          operation: "init",
          scope: ["src/code-mode/execute-tool.ts"],
          description: "Exercise protocol surface",
        });
        const status = await tb.theseus({ operation: "status" });
        return { init, status };
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.init.session_id).toBeDefined();
    expect(output.result.status.session_id).toBe(output.result.init.session_id);
  });

  it("can call tb.ulysses()", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => {
        const init = await tb.ulysses({
          operation: "init",
          problem: "Exercise protocol surface",
          constraints: ["unit-test"],
        });
        const status = await tb.ulysses({ operation: "status" });
        return { init, status };
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.init.session_id).toBeDefined();
    expect(output.result.status.session_id).toBe(output.result.init.session_id);
  });

  it("can call tb.observability()", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => {
        return await tb.observability({
          operation: "health",
          args: { services: ["thoughtbox"] },
        });
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.timestamp).toBeDefined();
    expect(output.result.services).toBeDefined();
  });

  it("returns truncated output for oversized results", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => ({ payload: "x".repeat(30000) })`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.truncated).toBe(true);
    expect(typeof output.result).toBe("string");
    expect(output.result).toContain("[truncated]");
  });

  it("returns syntax error for invalid code", async () => {
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { invalid syntax here }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeDefined();
  });
});
