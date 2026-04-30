import type { JsonSchemaSubset, JsonValue } from "./types.js";

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateJsonSchemaSubset(
  value: unknown,
  schema: JsonSchemaSubset,
  path = "$",
): SchemaValidationResult {
  const errors: string[] = [];
  validateValue(value, schema, path, errors);
  return { valid: errors.length === 0, errors };
}

function validateValue(
  value: unknown,
  schema: JsonSchemaSubset,
  path: string,
  errors: string[],
): void {
  if (schema.type && !matchesType(value, schema.type)) {
    errors.push(`${path} must be ${schema.type}`);
    return;
  }

  if (schema.type === "object" || schema.properties || schema.required) {
    if (!isRecord(value)) {
      errors.push(`${path} must be object`);
      return;
    }

    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in value)) {
        errors.push(`${path}.${requiredKey} is required`);
      }
    }

    for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (key in value) {
        validateValue(value[key], propertySchema, `${path}.${key}`, errors);
      }
    }

    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) {
          errors.push(`${path}.${key} is not allowed`);
        }
      }
    }
  }

  if (schema.type === "array" || schema.items) {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be array`);
      return;
    }

    if (schema.items) {
      value.forEach((item, index) => validateValue(item, schema.items!, `${path}[${index}]`, errors));
    }
  }
}

function matchesType(value: unknown, type: NonNullable<JsonSchemaSubset["type"]>): boolean {
  switch (type) {
    case "object":
      return isRecord(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
  }
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
