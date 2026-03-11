/**
 * ADR-011: Operations catalog tool tests
 *
 * Verifies list, get, and search operations across all 7 modules.
 */

import { describe, it, expect } from 'vitest';
import {
  handleList,
  handleGet,
  handleSearch,
  handleOperationsTool,
} from '../handler.js';

describe('thoughtbox_operations — list', () => {
  it('returns all 7 modules', () => {
    const result = handleList() as any;
    const moduleNames = result.modules.map((m: any) => m.module);

    expect(moduleNames).toContain('gateway');
    expect(moduleNames).toContain('init');
    expect(moduleNames).toContain('session');
    expect(moduleNames).toContain('notebook');
    expect(moduleNames).toContain('hub');
    expect(moduleNames).toContain('knowledge');
    expect(moduleNames).toContain('mental-models');
    expect(result.modules.length).toBe(7);
  });

  it('totalOperations is the sum across all modules', () => {
    const result = handleList() as any;
    const sumFromModules = result.modules.reduce(
      (acc: number, m: any) => acc + m.operations.length, 0
    );
    expect(result.totalOperations).toBe(sumFromModules);
    expect(result.totalOperations).toBeGreaterThan(0);
  });

  it('module filter narrows to one module', () => {
    const result = handleList('gateway') as any;
    expect(result.modules.length).toBe(1);
    expect(result.modules[0].module).toBe('gateway');
  });

  it('list entries do not include inputSchema', () => {
    const result = handleList() as any;
    for (const mod of result.modules) {
      for (const op of mod.operations) {
        expect(op).not.toHaveProperty('inputSchema');
        expect(op).not.toHaveProperty('inputs');
      }
    }
  });
});

describe('thoughtbox_operations — get', () => {
  it('returns full schema for a known operation', () => {
    const result = handleGet('thought') as any;
    expect(result.name).toBe('thought');
    expect(result.module).toBe('gateway');
    expect(result.inputSchema).toBeDefined();
    expect(result.inputSchema.properties).toBeDefined();
  });

  it('returns error for unknown operation', () => {
    const result = handleGet('nonexistent_op') as any;
    expect(result.error).toBeDefined();
    expect(result.error).toContain('not found');
  });

  it('module filter narrows search', () => {
    const result = handleGet('session_list', 'session') as any;
    expect(result.name).toBe('session_list');
    expect(result.module).toBe('session');
  });

  it('returns mental-models operation with inputSchema', () => {
    const result = handleGet('models_get') as any;
    expect(result.name).toBe('models_get');
    expect(result.module).toBe('mental-models');
    expect(result.inputSchema).toBeDefined();
  });
});

describe('thoughtbox_operations — search', () => {
  it('finds operations across modules', () => {
    const result = handleSearch('session') as any;
    const modules = new Set(result.matches.map((m: any) => m.module));
    expect(modules.size).toBeGreaterThanOrEqual(2);
    expect(result.totalMatches).toBeGreaterThan(0);
  });

  it('search is case-insensitive', () => {
    const lower = handleSearch('thought') as any;
    const upper = handleSearch('THOUGHT') as any;
    expect(lower.totalMatches).toBe(upper.totalMatches);
  });

  it('module filter narrows search results', () => {
    const all = handleSearch('list') as any;
    const filtered = handleSearch('list', 'session') as any;
    expect(filtered.totalMatches).toBeLessThanOrEqual(all.totalMatches);
    for (const match of filtered.matches) {
      expect(match.module).toBe('session');
    }
  });
});

describe('thoughtbox_operations — dispatch', () => {
  it('dispatches list operation', () => {
    const result = handleOperationsTool({ operation: 'list' }) as any;
    expect(result.modules).toBeDefined();
  });

  it('dispatches get operation', () => {
    const result = handleOperationsTool({
      operation: 'get',
      args: { name: 'thought' },
    }) as any;
    expect(result.name).toBe('thought');
  });

  it('returns error when get is called without name', () => {
    const result = handleOperationsTool({ operation: 'get' }) as any;
    expect(result.error).toBeDefined();
  });

  it('dispatches search operation', () => {
    const result = handleOperationsTool({
      operation: 'search',
      args: { query: 'session' },
    }) as any;
    expect(result.matches).toBeDefined();
  });

  it('returns error when search is called without query', () => {
    const result = handleOperationsTool({ operation: 'search' }) as any;
    expect(result.error).toBeDefined();
  });
});
