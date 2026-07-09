import { describe, it, expect, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ExecuteTool, type ExecuteToolDeps } from "../execute-tool.js";
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
import { createFileSystemHubStorage } from "../../hub/hub-storage-fs.js";
import { createHubToolHandler } from "../../hub/hub-tool-handler.js";
import { createThoughtStoreAdapter } from "../../hub/thought-store-adapter.js";
import { createHubHandler } from "../../hub/hub-handler.js";

function createHarness(overrides: Partial<ExecuteToolDeps> = {}) {
  const storage = new InMemoryStorage();
  const thoughtHandler = new ThoughtHandler(true, storage);
  const sessionHandler = new SessionHandler({ storage, thoughtHandler });
  const knowledgeHandler = new KnowledgeHandler(new FileSystemKnowledgeStorage({}));
  const notebookHandler = new NotebookHandler();
  const protocolHandler = new InMemoryProtocolHandler();

  const tool = new ExecuteTool({
    thoughtTool: new ThoughtTool(thoughtHandler),
    sessionTool: new SessionTool(sessionHandler),
    knowledgeTool: new KnowledgeTool(knowledgeHandler),
    notebookTool: new NotebookTool(notebookHandler),
    theseusTool: new TheseusTool(protocolHandler),
    ulyssesTool: new UlyssesTool(protocolHandler),
    observabilityHandler: new ObservabilityGatewayHandler({ storage }),
    ...overrides,
  });

  return { tool, storage };
}

function createExecuteTool(overrides: Partial<ExecuteToolDeps> = {}): ExecuteTool {
  return createHarness(overrides).tool;
}

const tempHubDirs: string[] = [];

afterAll(async () => {
  for (const dir of tempHubDirs) {
    await rm(dir, { recursive: true, force: true });
  }
});

async function createHubHarness() {
  const hubDir = await mkdtemp(join(tmpdir(), "tb-hub-execute-"));
  tempHubDirs.push(hubDir);

  const storage = new InMemoryStorage();
  const thoughtHandler = new ThoughtHandler(true, storage);
  const sessionHandler = new SessionHandler({ storage, thoughtHandler });
  const knowledgeHandler = new KnowledgeHandler(new FileSystemKnowledgeStorage({}));
  const notebookHandler = new NotebookHandler();
  const protocolHandler = new InMemoryProtocolHandler();

  const hubStorage = createFileSystemHubStorage(hubDir);
  const hubToolHandler = createHubToolHandler({
    hubStorage,
    thoughtStore: createThoughtStoreAdapter(storage),
  });

  const tool = new ExecuteTool({
    thoughtTool: new ThoughtTool(thoughtHandler),
    sessionTool: new SessionTool(sessionHandler),
    knowledgeTool: new KnowledgeTool(knowledgeHandler),
    notebookTool: new NotebookTool(notebookHandler),
    theseusTool: new TheseusTool(protocolHandler),
    ulyssesTool: new UlyssesTool(protocolHandler),
    observabilityHandler: new ObservabilityGatewayHandler({ storage }),
    hubDispatcher: {
      handle: (input) => hubToolHandler.handle(input, "execute-test-session"),
    },
  });

  return { tool, storage };
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

  it("tb.hub.* errors cleanly when no hub dispatcher is wired", async () => {
    // createExecuteTool() omits hubDispatcher (defensive: server started
    // without hub storage).
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { return await tb.hub.listWorkspaces(); }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBeNull();
    expect(output.error).toContain("Hub operations are unavailable");
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

  it("tb.branch.* returns a hosted-mode error when no branchHandler is wired", async () => {
    // createExecuteTool() omits branchHandler, mirroring local/self-hosted mode.
    const tool = createExecuteTool();
    const result = await tool.handle({
      code: `async () => { return await tb.branch.list({ sessionId: "s1" }); }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBeNull();
    expect(output.error).toContain("hosted mode");
  });

  it("tb.knowledge.* returns a clean error when knowledge init failed", async () => {
    // Mirrors server-factory behavior: knowledge storage init threw, so
    // knowledgeTool is undefined and the captured failure reason is threaded in.
    const tool = createExecuteTool({
      knowledgeTool: undefined,
      knowledgeUnavailableReason: "EACCES: permission denied, mkdir '/data/knowledge'",
    });
    const result = await tool.handle({
      code: `async () => { return await tb.knowledge.stats(); }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBeNull();
    expect(output.error).toBe(
      "knowledge unavailable: EACCES: permission denied, mkdir '/data/knowledge'",
    );
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

describe("thoughtbox_execute named-vs-positional coercion (feedback A3)", () => {
  // Exact failing shape from .specs/agent-user-feedback/claude-code-001.md §A3:
  // tb.session.export({ sessionId, format, includeMetadata }) was coerced to
  // the positional sessionId slot and hit Postgres as "[object Object]".
  it("tb.session.export accepts the named-object form", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => {
        const t = await tb.thought({
          thought: "seed session",
          thoughtType: "reasoning",
          nextThoughtNeeded: false,
          sessionTitle: "Coercion Regression",
        });
        return await tb.session.export({
          sessionId: t.sessionId ?? t.closedSessionId,
          format: "markdown",
          includeMetadata: true,
        });
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(JSON.stringify(output)).not.toContain("[object Object]");
  });

  it("tb.session.export still accepts the positional form", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => {
        const t = await tb.thought({
          thought: "seed session",
          thoughtType: "reasoning",
          nextThoughtNeeded: false,
        });
        return await tb.session.export(t.sessionId ?? t.closedSessionId, "markdown");
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
  });

  it("tb.session.get and tb.session.analyze accept both forms", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => {
        const t = await tb.thought({
          thought: "seed session",
          thoughtType: "reasoning",
          nextThoughtNeeded: false,
        });
        const id = t.sessionId ?? t.closedSessionId;
        const positional = await tb.session.get(id);
        const named = await tb.session.get({ sessionId: id });
        const analyzed = await tb.session.analyze({ sessionId: id });
        const idOf = (r) => r?.session?.id ?? r?.id;
        return { positionalId: idOf(positional), namedId: idOf(named), analyzed };
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.namedId).toBeDefined();
    expect(output.result.namedId).toBe(output.result.positionalId);
    expect(output.result.analyzed).toBeDefined();
  });

  it("tb.session.search accepts named form with limit", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => tb.session.search({ query: "anything", limit: 5 })`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
  });

  it("throws a clear error when the named object is missing the required field", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => tb.session.export({ format: "markdown" })`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toContain("tb.session.export");
    expect(output.error).toContain("missing required 'sessionId'");
    expect(output.error).toContain("positional (sessionId, format)");
    expect(output.error).toContain("named ({ sessionId, format })");
  });

  it("throws a clear error on ambiguous object-plus-positional calls", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => tb.session.export({ sessionId: "abc" }, "markdown")`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toContain("ambiguous");
    expect(output.error).toContain("tb.session.export");
  });

  it("tb.knowledge.getEntity accepts positional, camelCase, and snake_case named forms", async () => {
    const knowledgeDir = await mkdtemp(join(tmpdir(), "tb-knowledge-coercion-"));
    tempHubDirs.push(knowledgeDir);
    const knowledgeStorage = new FileSystemKnowledgeStorage({ basePath: knowledgeDir });
    await knowledgeStorage.setProject("coercion-test");
    const { tool } = createHarness({
      knowledgeTool: new KnowledgeTool(new KnowledgeHandler(knowledgeStorage)),
    });
    const result = await tool.handle({
      code: `async () => {
        const e = await tb.knowledge.createEntity({
          name: "coercion-test-entity",
          type: "Concept",
          label: "Coercion Test",
        });
        const positional = await tb.knowledge.getEntity(e.id);
        const camel = await tb.knowledge.getEntity({ entityId: e.id });
        const snake = await tb.knowledge.getEntity({ entity_id: e.id });
        return { positional, camel, snake };
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.camel.id).toBe(output.result.positional.id);
    expect(output.result.snake.id).toBe(output.result.positional.id);
  });
});

describe("thoughtbox_execute tb.vars (RLM-lite session variables)", () => {
  it("a value set in one execute call is readable in a later call on the same session", async () => {
    const { tool } = createHarness();

    const setResult = await tool.handle({
      code: `async () => tb.vars.set("survey", { models: ["a", "b"], scores: [0.9, 0.4] })`,
    });
    const setOutput = JSON.parse(setResult.content[0].text);
    expect(setOutput.error).toBeUndefined();
    expect(setOutput.result.name).toBe("survey");
    expect(setOutput.result.bytes).toBeGreaterThan(0);

    // Separate handle() call = separate vm context; the variable must survive.
    const getResult = await tool.handle({
      code: `async () => tb.vars.get("survey")`,
    });
    const getOutput = JSON.parse(getResult.content[0].text);
    expect(getOutput.error).toBeUndefined();
    expect(getOutput.result).toEqual({ models: ["a", "b"], scores: [0.9, 0.4] });
  });

  it("variables are isolated between ExecuteTool instances (sessions)", async () => {
    const { tool: sessionA } = createHarness();
    const { tool: sessionB } = createHarness();

    await sessionA.handle({ code: `async () => tb.vars.set("secret", 42)` });
    const result = await sessionB.handle({ code: `async () => tb.vars.get("secret")` });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBeNull();
    expect(output.error).toContain("no such variable in this MCP session");
  });

  it("get of an unset name throws a clear error pointing at tb.vars.list()", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({ code: `async () => tb.vars.get("nope")` });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toContain("tb.vars.get('nope')");
    expect(output.error).toContain("tb.vars.list()");
  });

  it("rejects non-JSON-serialisable values with a clear error", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => tb.vars.set("fn", () => 1)`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toContain("tb.vars.set('fn')");
    expect(output.error).toContain("JSON-serialisable");
  });

  it("supports named-args form, list, and delete", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => {
        await tb.vars.set({ name: "x", value: [1, 2, 3] });
        await tb.vars.set("y", "hello");
        const listed = await tb.vars.list();
        const deleted = await tb.vars.delete("x");
        const deletedAgain = await tb.vars.delete("x");
        const after = await tb.vars.list();
        return { listed, deleted, deletedAgain, after };
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.listed.count).toBe(2);
    expect(output.result.listed.vars.map((v: { name: string }) => v.name).sort()).toEqual(["x", "y"]);
    expect(output.result.deleted).toEqual({ deleted: true });
    expect(output.result.deletedAgain).toEqual({ deleted: false });
    expect(output.result.after.count).toBe(1);
  });

  it("stored values are deep copies — later mutation of the source does not leak", async () => {
    const { tool } = createHarness();
    const result = await tool.handle({
      code: `async () => {
        const obj = { n: 1 };
        await tb.vars.set("snapshot", obj);
        obj.n = 999;
        return await tb.vars.get("snapshot");
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result).toEqual({ n: 1 });
  });
});

describe("thoughtbox_execute tb.hub", () => {
  it("register makes the agentId implicit for subsequent calls", async () => {
    const { tool } = await createHubHarness();
    const result = await tool.handle({
      code: `async () => {
        const reg = await tb.hub.register({ name: "Coordinator", profile: "MANAGER" });
        const who = await tb.hub.whoami();
        return { reg, who };
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.reg.agentId).toBeDefined();
    expect(output.result.who.agentId).toBe(output.result.reg.agentId);
    expect(output.result.who.name).toBe("Coordinator");
  });

  it("runs the workspace/problem/channel flow against FS hub storage", async () => {
    const { tool } = await createHubHarness();
    const result = await tool.handle({
      code: `async () => {
        await tb.hub.register({ name: "Coordinator" });
        const ws = await tb.hub.createWorkspace({
          name: "Phase 4 Workspace",
          description: "tb.hub namespace test",
        });
        const prob = await tb.hub.createProblem({
          workspaceId: ws.workspaceId,
          title: "Expose hub over Code Mode",
          description: "Map operations under tb.hub",
        });
        await tb.hub.postMessage({
          workspaceId: ws.workspaceId,
          problemId: prob.problemId,
          content: "starting work",
        });
        const channel = await tb.hub.readChannel({
          workspaceId: ws.workspaceId,
          problemId: prob.problemId,
        });
        const workspaces = await tb.hub.listWorkspaces();
        return { ws, prob, channel, workspaces };
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.ws.workspaceId).toBeDefined();
    expect(output.result.prob.problemId).toBeDefined();
    const messages = output.result.channel.messages;
    expect(messages.some((m: { content: string }) => m.content === "starting work")).toBe(true);
    expect(
      output.result.workspaces.workspaces.some(
        (w: { id: string }) => w.id === output.result.ws.workspaceId,
      ),
    ).toBe(true);
  });

  it("merge_proposal persists the synthesis thought to real thought storage", async () => {
    const { tool, storage } = await createHubHarness();

    const setup = await tool.handle({
      code: `async () => {
        await tb.hub.register({ name: "Coordinator" });
        const ws = await tb.hub.createWorkspace({
          name: "Merge Workspace",
          description: "merge_proposal persistence test",
        });
        const reviewer = await tb.hub.register({ name: "Reviewer" });
        await tb.hub.joinWorkspace({ workspaceId: ws.workspaceId, agentId: reviewer.agentId });
        const prop = await tb.hub.createProposal({
          workspaceId: ws.workspaceId,
          title: "Real delegation",
          description: "Replace the stub with a facade",
          sourceBranch: "coordinator/real-delegation",
        });
        await tb.hub.reviewProposal({
          workspaceId: ws.workspaceId,
          proposalId: prop.proposalId,
          verdict: "approve",
          reasoning: "delegation verified",
          agentId: reviewer.agentId,
        });
        const merged = await tb.hub.mergeProposal({
          workspaceId: ws.workspaceId,
          proposalId: prop.proposalId,
          mergeMessage: "Merged: stub replaced with real facade",
        });
        return { ws, merged };
      }`,
    });
    const output = JSON.parse(setup.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result.merged.mergeThoughtNumber).toBe(1);
    expect(output.result.merged.proposal.status).toBe("merged");

    // The synthesis thought must land in the REAL per-session thought
    // storage (the same InMemoryStorage the session's ThoughtHandler uses),
    // not a throwaway stub.
    const mainSessionId = output.result.ws.mainSessionId;
    const thoughts = await storage.getThoughts(mainSessionId);
    expect(
      thoughts.some((t) => t.thought === "Merged: stub replaced with real facade"),
    ).toBe(true);
  });

  it("rejects agentId values not registered in this session", async () => {
    const { tool } = await createHubHarness();
    const result = await tool.handle({
      code: `async () => {
        await tb.hub.register({ name: "Coordinator" });
        return await tb.hub.whoami({ agentId: "not-a-registered-agent" });
      }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toBeNull();
    expect(output.error).toContain("not registered in this session");
  });

  it("merges across surfaces when the hub thought store is shared", async () => {
    // A workspace's mainSession is created through the hub thought store.
    // The /hub/api surface and every MCP session each hold their own
    // ThoughtboxStorage instance; only a SHARED hub thought store
    // (server-factory's hubThoughtStore) lets a merge initiated on one
    // surface find a mainSession created on another. Coordinator identity
    // is session-bound in tb.hub, so the cross-surface merge goes through
    // the registry-less hub handler (the /hub/api path) with an explicit
    // coordinator agentId.
    const hubDir = await mkdtemp(join(tmpdir(), "tb-hub-xsurface-"));
    tempHubDirs.push(hubDir);
    const hubStorage = createFileSystemHubStorage(hubDir);
    const sharedHubThoughtStorage = new InMemoryStorage();
    const sharedThoughtStore = createThoughtStoreAdapter(sharedHubThoughtStorage);

    const sessionHandler = createHubToolHandler({
      hubStorage,
      thoughtStore: sharedThoughtStore,
    });
    const sessionTool = createExecuteTool({
      hubDispatcher: { handle: (input) => sessionHandler.handle(input, "session-a") },
    });

    const setup = await sessionTool.handle({
      code: `async () => {
        const coordinator = await tb.hub.register({ name: "Coordinator" });
        const ws = await tb.hub.createWorkspace({
          name: "Cross-surface Workspace",
          description: "created via tb.hub",
        });
        const reviewer = await tb.hub.register({ name: "Reviewer" });
        await tb.hub.joinWorkspace({ workspaceId: ws.workspaceId, agentId: reviewer.agentId });
        const prop = await tb.hub.createProposal({
          workspaceId: ws.workspaceId,
          title: "Cross-surface merge",
          description: "merge from a different surface",
          sourceBranch: "coordinator/cross-surface",
        });
        await tb.hub.reviewProposal({
          workspaceId: ws.workspaceId,
          proposalId: prop.proposalId,
          verdict: "approve",
          reasoning: "ok",
          agentId: reviewer.agentId,
        });
        return { coordinator, ws, prop };
      }`,
    });
    const setupOut = JSON.parse(setup.content[0].text);
    expect(setupOut.error).toBeUndefined();
    const { coordinator, ws, prop } = setupOut.result;

    // Second surface sharing the thought store (post-fix /hub/api wiring):
    const sharedSurface = createHubHandler(hubStorage, sharedThoughtStore, () => {});
    const merged = await sharedSurface.handle(coordinator.agentId, "merge_proposal", {
      workspaceId: ws.workspaceId,
      proposalId: prop.proposalId,
      mergeMessage: "Merged from the hub API surface",
    });
    expect((merged as { proposal: { status: string } }).proposal.status).toBe("merged");
    const thoughts = await sharedHubThoughtStorage.getThoughts(ws.mainSessionId);
    expect(thoughts.some((t) => t.thought === "Merged from the hub API surface")).toBe(true);

    // Control (pre-fix wiring): a surface with its own thought storage has
    // never seen the workspace mainSession, so the same merge fails on a
    // fresh approved proposal.
    const isolatedSurface = createHubHandler(
      hubStorage,
      createThoughtStoreAdapter(new InMemoryStorage()),
      () => {},
    );
    const propB = await sessionTool.handle({
      code: `async () => {
        const prop = await tb.hub.createProposal({
          workspaceId: "${ws.workspaceId}",
          title: "Doomed merge",
          description: "isolated thought store cannot see mainSession",
          sourceBranch: "coordinator/doomed",
        });
        const reviewer = await tb.hub.register({ name: "Reviewer3" });
        await tb.hub.joinWorkspace({ workspaceId: "${ws.workspaceId}", agentId: reviewer.agentId });
        await tb.hub.reviewProposal({
          workspaceId: "${ws.workspaceId}",
          proposalId: prop.proposalId,
          verdict: "approve",
          reasoning: "ok",
          agentId: reviewer.agentId,
        });
        return prop;
      }`,
    });
    const propBOut = JSON.parse(propB.content[0].text);
    expect(propBOut.error).toBeUndefined();
    await expect(
      isolatedSurface.handle(coordinator.agentId, "merge_proposal", {
        workspaceId: ws.workspaceId,
        proposalId: propBOut.result.proposalId,
        mergeMessage: "should not persist",
      }),
    ).rejects.toThrow(/not found/);
  });
});
