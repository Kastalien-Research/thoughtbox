# SPEC-SRC-004: Type-Safe Environment

> **Status**: Draft
> **Priority**: P1 (Enhancement)
> **Dependencies**: None
> **Source**: srcbook/packages/api session secrets handling

## Summary

Generate `env.d.ts` declaration files from notebook secrets/environment variables, enabling type-safe `process.env` access in TypeScript cells. This improves developer experience by providing autocomplete and type checking for environment variables.

## Motivation

Notebooks often need environment variables for API keys, database URLs, and other configuration. Without type declarations:

- No autocomplete for `process.env.VAR_NAME`
- No TypeScript errors for typos in variable names
- Runtime failures instead of compile-time catches

Srcbook generates `env.d.ts` files automatically from session secrets. This pattern should be adopted for Thoughtbox notebooks.

## Design

### Secrets Schema

```typescript
// src/notebook/env/types.ts

import { z } from 'zod';

export const SecretSchema = z.object({
  name: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'Must be UPPER_SNAKE_CASE'),
  value: z.string().optional(), // May be redacted for display
  description: z.string().optional(),
  required: z.boolean().default(true),
});

export const SecretsConfigSchema = z.object({
  secrets: z.array(SecretSchema),
  generatedAt: z.string().datetime().optional(),
});

export type Secret = z.infer<typeof SecretSchema>;
export type SecretsConfig = z.infer<typeof SecretsConfigSchema>;
```

### env.d.ts Generator

```typescript
// src/notebook/env/generator.ts

import type { Secret } from './types';

export function generateEnvDts(secrets: Secret[]): string {
  if (secrets.length === 0) {
    return `// No environment variables defined\ndeclare namespace NodeJS {\n  interface ProcessEnv {}\n}\n`;
  }

  const envEntries = secrets
    .map(secret => {
      const comment = secret.description
        ? `    /** ${secret.description} */\n`
        : '';
      const optionalMarker = secret.required ? '' : '?';
      return `${comment}    ${secret.name}${optionalMarker}: string;`;
    })
    .join('\n');

  return `// Generated env.d.ts - do not edit manually
// Generated at: ${new Date().toISOString()}

declare namespace NodeJS {
  interface ProcessEnv {
${envEntries}
  }
}
`;
}
```

### Example Output

Given secrets:

```json
[
  { "name": "API_KEY", "description": "OpenAI API key", "required": true },
  { "name": "DATABASE_URL", "required": true },
  { "name": "DEBUG_MODE", "required": false }
]
```

Generated `env.d.ts`:

```typescript
// Generated env.d.ts - do not edit manually
// Generated at: 2026-01-17T10:00:00.000Z

declare namespace NodeJS {
  interface ProcessEnv {
    /** OpenAI API key */
    API_KEY: string;
    DATABASE_URL: string;
    DEBUG_MODE?: string;
  }
}
```

### Notebook Integration

#### Secrets Cell Type (Optional)

Add a new cell type for declaring secrets:

```typescript
// In src/notebook/types.ts

export const SecretsCell = z.object({
  id: z.string(),
  type: z.literal('secrets'),
  secrets: z.array(SecretSchema),
});
```

#### Automatic Generation

Generate `env.d.ts` when:

1. Notebook is opened/loaded
2. Secrets are modified
3. Execution is requested

```typescript
// src/notebook/env/manager.ts

export class EnvManager {
  private envDtsPath: string;

  constructor(notebookDir: string) {
    this.envDtsPath = path.join(notebookDir, 'env.d.ts');
  }

  async updateEnvDts(secrets: Secret[]): Promise<void> {
    const content = generateEnvDts(secrets);
    await fs.writeFile(this.envDtsPath, content, 'utf-8');
  }

  async loadSecrets(): Promise<Secret[]> {
    // Load from .env file, secrets cell, or external source
  }

  async injectEnvVars(secrets: Secret[]): Promise<void> {
    // Set process.env values before cell execution
  }
}
```

### Tool Operation

Add env management to notebook tool:

```typescript
// In src/notebook/index.ts

const EnvOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('env:get'),
    notebookId: z.string(),
  }),
  z.object({
    type: z.literal('env:set'),
    notebookId: z.string(),
    secrets: z.array(SecretSchema),
  }),
  z.object({
    type: z.literal('env:generate'),
    notebookId: z.string(),
  }),
]);

// Handler returns secrets (values redacted) and generated env.d.ts content
```

### TypeScript Server Integration

Ensure TypeScript language server picks up env.d.ts:

```typescript
// Include in tsconfig.json for notebook
{
  "compilerOptions": {
    // ...
  },
  "include": [
    "**/*.ts",
    "env.d.ts"  // Auto-include generated declarations
  ]
}
```

### .env File Support

Parse standard .env files:

```typescript
// src/notebook/env/dotenv.ts

export function parseDotEnv(content: string): Secret[] {
  const secrets: Secret[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match) {
      secrets.push({
        name: match[1],
        value: match[2],
        required: true,
      });
    }
  }

  return secrets;
}
```

## Files to Create/Modify

| File | Action | Purpose |
| ---- | ------ | ------- |
| `src/notebook/env/types.ts` | Create | Secret schemas |
| `src/notebook/env/generator.ts` | Create | env.d.ts generation |
| `src/notebook/env/manager.ts` | Create | Environment management |
| `src/notebook/env/dotenv.ts` | Create | .env file parsing |
| `src/notebook/types.ts` | Modify | Add SecretsCell type (optional) |
| `src/notebook/index.ts` | Modify | Add env operations to tool |

## Test Scenarios

1. **Generation from Secrets Array**
   - Input: Array of secrets with names, descriptions, required flags
   - Output: Valid env.d.ts with typed ProcessEnv

2. **Empty Secrets**
   - Input: Empty array
   - Output: env.d.ts with empty ProcessEnv interface

3. **Name Validation**
   - Valid: `API_KEY`, `DATABASE_URL`, `MY_VAR_123`
   - Invalid: `apiKey`, `123_VAR`, `my-var`

4. **.env Parsing**
   - Standard .env format
   - Comments ignored
   - Multi-line values (quoted strings)

5. **TypeScript Integration**
   - Generated env.d.ts picked up by tsserver
   - Autocomplete works for `process.env.`
   - Type errors for undefined variables

## Acceptance Criteria

- [ ] env.d.ts generated from secrets array
- [ ] Output includes JSDoc comments from descriptions
- [ ] Optional secrets marked with `?`
- [ ] Name validation enforces UPPER_SNAKE_CASE
- [ ] .env file parsing supported
- [ ] Tool operations for get/set/generate
- [ ] TypeScript server picks up declarations
- [ ] Unit tests for generation and parsing

## Security Considerations

- Never include secret values in env.d.ts (types only)
- Redact values when returning secrets via tool
- Store actual values securely (encrypted, external secrets manager)
- Clear secrets from process.env after execution

## Future Enhancements

- **Secrets from external sources**: Vault, AWS Secrets Manager, etc.
- **Environment profiles**: dev, staging, production configurations
- **Validation**: Runtime validation that required secrets are set
- **UI for secrets management**: Visual editor for secrets

## References

- Srcbook secrets handling: `srcbook/packages/api/srcbook/srcbook.mts`
- TypeScript env declarations: `srcbook/packages/api/srcbook/env.ts`
- dotenv specification: https://dotenv.org/
