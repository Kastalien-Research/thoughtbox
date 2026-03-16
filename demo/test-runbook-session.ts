import { describe, it, expect, beforeEach } from 'vitest';
import { ThoughtHandler } from '../src/thought-handler.js';
import { InMemoryStorage } from '../src/persistence/index.js';
import { ThoughtTool } from '../src/thought/tool.js';
import { SessionHandler } from '../src/sessions/index.js';
import { SessionTool } from '../src/sessions/tool.js';

describe('Thoughts-as-Runbook: 10-thought session', () => {
  let thoughtHandler: ThoughtHandler;
  let storage: InMemoryStorage;
  let thoughtTool: ThoughtTool;
  let sessionTool: SessionTool;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    thoughtHandler = new ThoughtHandler(true, storage);
    await thoughtHandler.initialize();

    thoughtTool = new ThoughtTool(thoughtHandler);
    
    const sessionHandler = new SessionHandler({
      storage,
      thoughtHandler,
    });
    sessionTool = new SessionTool(sessionHandler);
  });

  async function submitThought(args: any) {
    return thoughtTool.handle(args);
  }

  function parseResult(result: any) {
    // If it's a ToolResponse, parse first text content
    if (result.content && Array.isArray(result.content)) {
      return JSON.parse(result.content[0].text);
    }
    return result;
  }

  async function runFullSession() {
    const results = [];

    // Thought 1
    results.push(await submitThought({
      thought: 'I will refactor the weather-mcp-server from Python to TypeScript. Subtasks: 1) Analyze Python handlers, 2) Set up TypeScript project, 3) Convert handlers, 4) Convert types, 5) Write tests, 6) Verify.',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
      sessionTitle: 'Refactor weather-mcp-server: Python to TypeScript',
      sessionTags: ['task:refactor', 'lang:python-to-typescript'],
    }));

    // Thought 2
    results.push(await submitThought({
      thought: 'Choosing TypeScript project structure. Single package matches the simplicity of the Python original.',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'high',
      options: [
        { label: 'Single package with src/', selected: true, reason: 'Matches Python simplicity' },
        { label: 'Turborepo monorepo', selected: false, reason: 'Overkill for 3 handlers' },
      ],
    }));

    // Thought 3
    results.push(await submitThought({
      thought: 'Analyzed all 3 Python handlers. Extracted interface contracts for get_forecast, get_alerts, get_historical.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'code_analysis',
        target: 'weather_mcp/handlers.py',
      },
    }));

    // Thought 4
    results.push(await submitThought({
      thought: 'Created TypeScript project with @modelcontextprotocol/sdk, zod, typescript. ESM output, strict mode.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'shell',
        target: 'weather-mcp-server-ts/',
      },
    }));

    // Thought 5
    results.push(await submitThought({
      thought: 'Converted all 3 handlers to TypeScript. Using native fetch instead of httpx.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'partial',
        tool: 'file_write',
        target: 'src/handlers/',
      },
    }));

    // Thought 6
    results.push(await submitThought({
      thought: 'Python dynamic dispatch (HANDLERS dict) is replaced by MCP SDK native tool routing. No additional work needed.',
      thoughtType: 'reasoning',
      nextThoughtNeeded: true,
    }));

    // Thought 7
    results.push(await submitThought({
      thought: 'Choosing type representation. Zod schemas provide runtime validation and TypeScript types from single source.',
      thoughtType: 'decision_frame',
      nextThoughtNeeded: true,
      confidence: 'high',
      options: [
        { label: 'Zod schemas with inferred types', selected: true, reason: 'Already using zod, consistent approach' },
        { label: 'Plain TypeScript interfaces', selected: false, reason: 'No runtime validation' },
        { label: 'Class hierarchy', selected: false, reason: 'Too heavy for DTOs' },
      ],
    }));

    // Thought 8
    results.push(await submitThought({
      thought: 'Converted shared types to zod schemas: WeatherData, Location, Alert. Updated all handlers.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'file_write',
        target: 'src/types.ts',
      },
    }));

    // Thought 9
    results.push(await submitThought({
      thought: 'Wrote 12 integration tests. All passing. Coverage: 94% line, 88% branch.',
      thoughtType: 'action_report',
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: 'yes',
        tool: 'vitest',
        target: 'src/__tests__/',
      },
    }));

    // Thought 10
    results.push(await submitThought({
      thought: 'Refactoring complete. 3 handlers converted, zod schemas for types, 12 tests passing. Two decisions: single-package (over monorepo), zod (over interfaces).',
      thoughtType: 'reasoning',
      nextThoughtNeeded: false,
    }));

    return results;
  }

  it('accepts all 10 thoughts without error', async () => {
    const results = await runFullSession();
    expect(results).toHaveLength(10);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      expect(result.isError).toBeUndefined();
    }
  });

  it('assigns correct thought numbers 1 through 10', async () => {
    const results = await runFullSession();
    for (let i = 0; i < results.length; i++) {
      const data = parseResult(results[i]);
      expect(data.thoughtNumber).toBe(i + 1);
    }
  });

  it('session_get retrieves thoughts which can be filtered manually', async () => {
    const results = await runFullSession();
    const sessionId = parseResult(results[0]).sessionId;

    const readActions = await sessionTool.handle({ operation: 'session_get', sessionId } as any);
    const sessionData = parseResult(readActions);
    const allThoughts = sessionData.thoughts;

    const actions = allThoughts.filter((t: any) => t.thoughtType === 'action_report');
    expect(actions.length).toBe(5);

    const decisions = allThoughts.filter((t: any) => t.thoughtType === 'decision_frame');
    expect(decisions.length).toBe(2);

    const reasoning = allThoughts.filter((t: any) => t.thoughtType === 'reasoning');
    expect(reasoning.length).toBe(3);
  });

  it('session closes with audit manifest on thought 10', async () => {
    const results = await runFullSession();
    const finalData = parseResult(results[9]);
    expect(finalData.sessionClosed).toBe(true);
    expect(finalData.auditManifest).toBeDefined();
    expect(finalData.auditManifest.thoughtCounts.total).toBe(10);
  });

  it('session_analyze returns correct aggregation', async () => {
    const results = await runFullSession();
    const sessionId = parseResult(results[0]).sessionId;

    const analysisResult = await sessionTool.handle({ operation: 'session_analyze', sessionId } as any);
    const data = parseResult(analysisResult);
    
    // The new response format from session_analyze:
    expect(data.metadata.thoughtCount).toBe(10);
    expect(data.structure.revisionRate).toBe(0);
    expect(data.quality.isComplete).toBe(true);
  });
});
