import { z } from 'zod';

/**
 * Derives a template's top-level required/optional key lists from its Zod
 * schema, so the validator's key whitelist and the schema share one source
 * of truth. Required keys are those the schema marks non-optional; every
 * other top-level property is optional.
 */

type JsonSchemaNode = {
  type?: string;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
};

export function deriveSchemaKeys(schema: z.ZodType): {
  required: string[];
  optional: string[];
} {
  const jsonSchema = z.toJSONSchema(schema) as JsonSchemaNode;
  const properties = jsonSchema.properties ?? {};
  const required = new Set(jsonSchema.required ?? []);

  const requiredKeys: string[] = [];
  const optionalKeys: string[] = [];
  for (const key of Object.keys(properties)) {
    if (required.has(key)) requiredKeys.push(key);
    else optionalKeys.push(key);
  }
  return { required: requiredKeys, optional: optionalKeys };
}
