/**
 * ADR-011: Verify thoughtbox_operations is registered at Stage 0
 *
 * Reads the server-factory source to confirm the tool is registered
 * with DisclosureStage.STAGE_0_ENTRY.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('thoughtbox_operations — Stage 0 registration', () => {
  it('is registered at STAGE_0_ENTRY in server-factory', () => {
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const serverFactoryPath = resolve(thisDir, '../../server-factory.ts');
    const source = readFileSync(serverFactoryPath, 'utf-8');

    expect(source).toContain('"thoughtbox_operations"');
    expect(source).toContain('operationsToolInputSchema');

    const registrationPattern =
      /toolRegistry\.register\(\s*"thoughtbox_operations"[\s\S]*?STAGE_0_ENTRY/;
    expect(source).toMatch(registrationPattern);
  });
});
