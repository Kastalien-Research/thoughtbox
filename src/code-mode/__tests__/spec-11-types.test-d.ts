/**
 * TS-FIXTURE validators for Spec 11 — Structured Return Schemas
 *
 * Validates:
 * - V11.5: Discriminant narrowing — if (e.type==='structured_output_error') { e.validationErrors.length }
 * - V11.6: ValidatedOutput<T> carries typed data
 *
 * @see .specs/cognitive-harness-improvements/11-structured-return-schemas.md
 * @see .specs/cognitive-harness-improvements/VALIDATORS.md §V11.5, V11.6
 */

import { expectType } from 'tsd';

// =============================================================================
// V11.5 — Discriminant narrowing for StructuredOutputError
// =============================================================================

/**
 * V11.5: StructuredOutputError is a discriminated union with type discriminant.
 * After narrowing on `type === 'structured_output_error'`, the validationErrors
 * field is accessible without type assertions.
 */
interface ValidationError {
  readonly path: string;
  readonly expected: string;
  readonly received: unknown;
  readonly reason?: string;
}

interface ParsingError {
  readonly message: string;
  readonly offset?: number;
  readonly line?: number;
  readonly column?: number;
}

/**
 * Error type for structured output validation failures.
 * Discriminant: type === 'structured_output_error'
 */
interface StructuredOutputError {
  readonly type: 'structured_output_error';
  readonly message: string;
  readonly rawOutput: string;
  readonly validationErrors: readonly ValidationError[];
  readonly expectedSchema: unknown; // JSONSchema is complex, use unknown
  readonly timestamp: string;
  readonly parsingError?: ParsingError;
}

/**
 * Generic error type for subagent operations
 */
type SubagentError = StructuredOutputError;

// V11.5: Discriminant narrowing enables type-safe error handling
function v11_5_discriminant_narrowing(error: SubagentError) {
  if (error.type === 'structured_output_error') {
    // Inside this block, TypeScript knows error is StructuredOutputError
    expectType<'structured_output_error'>(error.type);
    expectType<string>(error.message);
    expectType<string>(error.rawOutput);

    // V11.5: validationErrors is accessible without 'as' or optional chaining
    const errorCount: number = error.validationErrors.length;
    expectType<number>(errorCount);

    // Can iterate over validationErrors
    for (const ve of error.validationErrors) {
      expectType<string>(ve.path);
      expectType<string>(ve.expected);
      expectType<unknown>(ve.received);
    }

    // parsingError is optional, handle accordingly
    if (error.parsingError) {
      expectType<string>(error.parsingError.message);
      expectType<number | undefined>(error.parsingError.offset);
    }
  }
}

// V11.5: Without narrowing, accessing validationErrors should error
function v11_5_without_narrowing(error: SubagentError) {
  // @ts-expect-error — type narrowing required to access validationErrors
  const errorCount: number = error.validationErrors.length;

  // @ts-expect-error — type narrowing required to access parsingError
  const offset: number | undefined = error.parsingError?.offset;
}

// =============================================================================
// V11.6 — ValidatedOutput<T> carries typed data
// =============================================================================

/**
 * V11.6: ValidatedOutput<T> is a generic success type that carries
 * the parsed and validated data with its proper type T.
 */
interface ValidatedOutput<T> {
  readonly success: true;
  readonly data: T;
  readonly schema: unknown; // JSONSchema
  readonly validatedAt: string;
}

/**
 * Example schema type for testing
 */
interface AnalysisResult {
  rootCause: string;
  severity: 'low' | 'medium' | 'high';
  affectedComponents: string[];
}

// V11.6: ValidatedOutput carries typed data
function v11_6_typed_data_check() {
  // Simulating a validated result
  const result: ValidatedOutput<AnalysisResult> = {
    success: true,
    data: {
      rootCause: 'Missing null check',
      severity: 'high',
      affectedComponents: ['auth', 'api']
    },
    schema: { type: 'object' },
    validatedAt: new Date().toISOString()
  };

  // V11.6: data is typed as AnalysisResult
  expectType<AnalysisResult>(result.data);

  // Can access properties directly with correct types
  const rootCause: string = result.data.rootCause;
  expectType<string>(rootCause);

  const severity: 'low' | 'medium' | 'high' = result.data.severity;
  expectType<'low' | 'medium' | 'high'>(severity);

  const components: string[] = result.data.affectedComponents;
  expectType<string[]>(components);
}

// V11.6: ValidatedOutput works with different generic types
function v11_6_generic_persistence() {
  // Number type
  const numResult: ValidatedOutput<number> = {
    success: true,
    data: 42,
    schema: { type: 'number' },
    validatedAt: new Date().toISOString()
  };
  expectType<number>(numResult.data);

  // String type
  const strResult: ValidatedOutput<string> = {
    success: true,
    data: 'hello',
    schema: { type: 'string' },
    validatedAt: new Date().toISOString()
  };
  expectType<string>(strResult.data);

  // Array type
  const arrResult: ValidatedOutput<string[]> = {
    success: true,
    data: ['a', 'b', 'c'],
    schema: { type: 'array' },
    validatedAt: new Date().toISOString()
  };
  expectType<string[]>(arrResult.data);

  // Complex nested type
  interface Config {
    settings: {
      debug: boolean;
      maxRetries: number;
    };
    endpoints: Array<{ url: string; timeout: number }>;
  }
  const configResult: ValidatedOutput<Config> = {
    success: true,
    data: {
      settings: { debug: true, maxRetries: 3 },
      endpoints: [{ url: 'https://api.example.com', timeout: 5000 }]
    },
    schema: { type: 'object' },
    validatedAt: new Date().toISOString()
  };
  expectType<Config>(configResult.data);
}

// V11.6: ValidatedOutput data can be used directly in function calls
function v11_6_data_usage() {
  const result: ValidatedOutput<{ x: string; y: number }> = {
    success: true,
    data: { x: 'test', y: 123 },
    schema: { type: 'object' },
    validatedAt: new Date().toISOString()
  };

  // Can pass data directly to functions expecting the type
  function processData(data: { x: string; y: number }): string {
    return `${data.x}:${data.y}`;
  }

  const output: string = processData(result.data);
  expectType<string>(output);
}
