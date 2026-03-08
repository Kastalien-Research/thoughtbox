/**
 * JSON Schema Type Definitions
 *
 * Provides proper typing for JSON Schema objects used throughout the codebase.
 * Replaces usage of 'any' types in operation definitions.
 */

/**
 * Base JSON Schema interface
 */
export interface JsonSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  description?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
}

/**
 * JSON Schema for string types
 */
export interface JsonSchemaString extends JsonSchema {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

/**
 * JSON Schema for number types
 */
export interface JsonSchemaNumber extends JsonSchema {
  type: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

/**
 * JSON Schema for boolean types
 */
export interface JsonSchemaBoolean extends JsonSchema {
  type: 'boolean';
}

/**
 * JSON Schema for array types
 */
export interface JsonSchemaArray extends JsonSchema {
  type: 'array';
  items?: JsonSchemaType;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

/**
 * JSON Schema for object types
 */
export interface JsonSchemaObject extends JsonSchema {
  type: 'object';
  properties?: Record<string, JsonSchemaType>;
  required?: string[];
  additionalProperties?: boolean | JsonSchemaType;
  patternProperties?: Record<string, JsonSchemaType>;
  minProperties?: number;
  maxProperties?: number;
}

/**
 * Union type for all JSON Schema variants
 */
export type JsonSchemaType =
  | JsonSchemaString
  | JsonSchemaNumber
  | JsonSchemaBoolean
  | JsonSchemaArray
  | JsonSchemaObject
  | JsonSchema;

/**
 * Type for operation examples - can be any valid JSON value
 */
export type OperationExample = string | number | boolean | null | OperationExample[] | { [key: string]: OperationExample };