# SPEC-SRC-003: AI Cell Operations

> **Status**: Draft
> **Priority**: P1 (Enhancement)
> **Dependencies**: SPEC-SRC-001
> **Source**: srcbook/packages/api/ai/generate.mts

## Summary

Add AI-assisted cell operations to notebooks: generating new cells from prompts, editing existing cells, and fixing TypeScript diagnostics. These operations integrate with the notebook tool and can optionally stream progress through Observatory.

## Motivation

AI-assisted editing significantly improves notebook authoring:

- **Generate cells**: Create code from natural language descriptions
- **Edit cells**: Refactor or modify existing code with AI assistance
- **Fix diagnostics**: Automatically fix TypeScript errors with context-aware corrections

Srcbook demonstrates these patterns effectively. Bringing them to Thoughtbox notebooks enables intelligent authoring workflows.

## Design

### AI Operations Interface

```typescript
// src/notebook/ai/operations.ts

import { z } from 'zod';
import type { CodeCell, NotebookSchema } from '../types';

export const GenerateCellsRequestSchema = z.object({
  query: z.string().min(1),
  notebookId: z.string(),
  insertIndex: z.number().int().min(0).optional(),
  context: z.object({
    precedingCells: z.array(z.any()).optional(), // Cells before insertion point
    followingCells: z.array(z.any()).optional(), // Cells after insertion point
  }).optional(),
});

export const EditCellRequestSchema = z.object({
  query: z.string().min(1),
  notebookId: z.string(),
  cellId: z.string(),
});

export const FixDiagnosticsRequestSchema = z.object({
  notebookId: z.string(),
  cellId: z.string(),
  diagnostics: z.array(z.object({
    line: z.number(),
    column: z.number(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info']).optional(),
  })),
});

export const AiCellResultSchema = z.object({
  cells: z.array(z.any()), // Generated/modified cells
  explanation: z.string().optional(),
});

export type GenerateCellsRequest = z.infer<typeof GenerateCellsRequestSchema>;
export type EditCellRequest = z.infer<typeof EditCellRequestSchema>;
export type FixDiagnosticsRequest = z.infer<typeof FixDiagnosticsRequestSchema>;
export type AiCellResult = z.infer<typeof AiCellResultSchema>;
```

### AI Service Interface

Abstract AI provider for flexibility:

```typescript
// src/notebook/ai/service.ts

export interface AiService {
  generateCells(request: GenerateCellsRequest): Promise<AiCellResult>;
  editCell(request: EditCellRequest): Promise<AiCellResult>;
  fixDiagnostics(request: FixDiagnosticsRequest): Promise<AiCellResult>;

  // Streaming variants
  streamGenerateCells?(request: GenerateCellsRequest): AsyncIterable<Partial<AiCellResult>>;
  streamEditCell?(request: EditCellRequest): AsyncIterable<Partial<AiCellResult>>;
}
```

### Prompt Construction

Build context-aware prompts for AI:

```typescript
// src/notebook/ai/prompts.ts

export function buildGenerateCellsPrompt(
  request: GenerateCellsRequest,
  notebook: NotebookSchema,
): string {
  const { query, context } = request;

  const parts = [
    `Generate TypeScript code cells for a notebook.`,
    ``,
    `User request: ${query}`,
    ``,
    `Notebook language: ${notebook.language}`,
  ];

  if (context?.precedingCells?.length) {
    parts.push(``, `Preceding cells for context:`, formatCells(context.precedingCells));
  }

  if (context?.followingCells?.length) {
    parts.push(``, `Following cells for context:`, formatCells(context.followingCells));
  }

  parts.push(
    ``,
    `Respond with TypeScript code that can be split into cells.`,
    `Use markdown code fences to separate cells.`,
  );

  return parts.join('\n');
}

export function buildEditCellPrompt(
  request: EditCellRequest,
  cell: CodeCell,
): string {
  return [
    `Edit the following code cell based on the user's request.`,
    ``,
    `User request: ${request.query}`,
    ``,
    `Current code:`,
    '```typescript',
    cell.source,
    '```',
    ``,
    `Provide the edited code.`,
  ].join('\n');
}

export function buildFixDiagnosticsPrompt(
  request: FixDiagnosticsRequest,
  cell: CodeCell,
): string {
  const diagnosticsText = request.diagnostics
    .map(d => `Line ${d.line}: ${d.message}`)
    .join('\n');

  return [
    `Fix the TypeScript errors in the following code.`,
    ``,
    `Diagnostics:`,
    diagnosticsText,
    ``,
    `Current code:`,
    '```typescript',
    cell.source,
    '```',
    ``,
    `Provide the corrected code.`,
  ].join('\n');
}
```

### Tool Integration

Add AI operations to notebook tool:

```typescript
// In src/notebook/index.ts - add to tool operations

const NotebookAiOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ai:generate'),
    ...GenerateCellsRequestSchema.shape,
  }),
  z.object({
    type: z.literal('ai:edit'),
    ...EditCellRequestSchema.shape,
  }),
  z.object({
    type: z.literal('ai:fix'),
    ...FixDiagnosticsRequestSchema.shape,
  }),
]);

// Handler
async function handleAiOperation(op: z.infer<typeof NotebookAiOperationSchema>) {
  switch (op.type) {
    case 'ai:generate':
      return aiService.generateCells(op);
    case 'ai:edit':
      return aiService.editCell(op);
    case 'ai:fix':
      return aiService.fixDiagnostics(op);
  }
}
```

### Observatory Integration (Optional)

Stream AI progress through Observatory:

```typescript
// Event schemas for AI operations
export const AiGenerateStartPayloadSchema = z.object({
  notebookId: z.string(),
  query: z.string(),
  insertIndex: z.number().optional(),
});

export const AiGenerateProgressPayloadSchema = z.object({
  notebookId: z.string(),
  partialResult: z.any(), // Partial cells as they generate
  progress: z.number().min(0).max(1).optional(),
});

export const AiGenerateCompletePayloadSchema = z.object({
  notebookId: z.string(),
  result: AiCellResultSchema,
});

// Events: ai:generate:start, ai:generate:progress, ai:generate:complete
// Channel: notebook:<notebookId>
```

### Response Parsing

Parse AI responses into cells:

```typescript
// src/notebook/ai/parser.ts

const CODE_FENCE_PATTERN = /```(?:typescript|ts|javascript|js)?\n([\s\S]*?)```/g;

export function parseAiResponseToCells(response: string): CodeCell[] {
  const cells: CodeCell[] = [];
  let match: RegExpExecArray | null;

  while ((match = CODE_FENCE_PATTERN.exec(response)) !== null) {
    cells.push({
      id: generateCellId(),
      type: 'code',
      source: match[1].trim(),
      language: 'typescript',
    });
  }

  // If no code fences, treat entire response as single cell
  if (cells.length === 0 && response.trim()) {
    cells.push({
      id: generateCellId(),
      type: 'code',
      source: response.trim(),
      language: 'typescript',
    });
  }

  return cells;
}
```

## Files to Create/Modify

| File | Action | Purpose |
| ---- | ------ | ------- |
| `src/notebook/ai/operations.ts` | Create | Request/response schemas |
| `src/notebook/ai/service.ts` | Create | AI service interface |
| `src/notebook/ai/prompts.ts` | Create | Prompt construction |
| `src/notebook/ai/parser.ts` | Create | Response parsing |
| `src/notebook/index.ts` | Modify | Add AI operations to tool |
| `src/observatory/schemas/notebook-events.ts` | Create | AI streaming events (optional) |

## Test Scenarios

1. **Generate Cells**
   - Request: "Create a function to fetch user data from an API"
   - Context: Preceding cells with API client setup
   - Result: New cells with fetch function and types

2. **Edit Cell**
   - Request: "Add error handling to this function"
   - Existing cell: Simple async function
   - Result: Updated cell with try/catch

3. **Fix Diagnostics**
   - Cell with type errors
   - Diagnostics array from TypeScript
   - Result: Corrected cell with proper types

4. **Streaming (Optional)**
   - Start AI generation
   - Receive progress updates via Observatory
   - Final result delivered

5. **Error Handling**
   - AI service unavailable → graceful error
   - Malformed AI response → parse fallback
   - Empty result → informative message

## Acceptance Criteria

- [ ] All three operations (generate, edit, fix) implemented
- [ ] Context-aware prompt construction
- [ ] Response parsing handles various AI formats
- [ ] Tool integration with typed schemas
- [ ] Streaming support (optional but preferred)
- [ ] Error handling for AI failures
- [ ] Unit tests for prompt construction and parsing

## Security Considerations

- Sanitize user queries before sending to AI
- Rate limit AI operations
- Log AI interactions for audit
- Consider content filtering for AI responses

## Future Enhancements

- **Multi-cell awareness**: Edit multiple related cells together
- **Undo/redo**: Track AI modifications for rollback
- **Provider selection**: Support multiple AI providers
- **Cost tracking**: Monitor AI token usage

## References

- Srcbook AI generation: `srcbook/packages/api/ai/generate.mts`
- Srcbook plan parser: `srcbook/packages/api/ai/plan-parser.mts`
- Thoughtbox notebook types: `src/notebook/types.ts`
