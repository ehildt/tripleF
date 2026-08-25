import { z } from 'zod';

/**
 * Renders a Zod schema as a compact, model-facing JSON shape for prompt
 * inclusion. Field names, types, enum values, nesting, and optional markers
 * are all derived from the schema, so the prompt and the validator share a
 * single source of truth — no hand-written JSON structure to drift.
 */

type JsonSchemaNode = {
  type?: string;
  enum?: unknown[];
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode;
  anyOf?: JsonSchemaNode[];
  additionalProperties?: JsonSchemaNode;
};

export interface FormatZodShapeOptions {
  /**
   * Top-level field overrides: replace a field's derived type hint with a
   * custom one. Used for vocabularies the prompt supplies elsewhere (e.g.
   * the enabled tool catalog), so the shape stays a placeholder instead of
   * repeating the full enum.
   */
  overrides?: Record<string, string>;
}

const INDENT = '  ';

export function formatZodShape(schema: z.ZodType, options: FormatZodShapeOptions = {}): string {
  const jsonSchema = z.toJSONSchema(schema) as JsonSchemaNode;
  return renderNode(jsonSchema, 0, options);
}

function renderNode(node: JsonSchemaNode, depth: number, options: FormatZodShapeOptions): string {
  if (node.type === 'object' && node.properties) return renderObject(node, depth, options);
  if (node.type === 'object' && node.additionalProperties) {
    return `{ [key]: ${renderNode(node.additionalProperties, depth, options)} }`;
  }
  if (node.type === 'array' && node.items) return `[${renderNode(node.items, depth, options)}]`;

  // Nullable fields render as their non-null type; the `?` marker already
  // conveys optionality and the prompt rules say to omit, never null.
  const anyOfBranches = node.anyOf?.filter((branch) => branch.type !== 'null');
  if (anyOfBranches?.length) return anyOfBranches.map((branch) => renderNode(branch, depth, options)).join(' | ');

  if (node.enum) return node.enum.map((value) => JSON.stringify(value)).join(' | ');
  if (node.type === 'integer' || node.type === 'number') return 'number';
  if (node.type === 'boolean') return 'boolean';
  if (node.type === 'string') return 'string';
  if (node.type === 'null') return 'null';
  return 'unknown';
}

function renderObject(node: JsonSchemaNode, depth: number, options: FormatZodShapeOptions): string {
  const properties = node.properties ?? {};
  const required = new Set(node.required ?? []);
  const entries = Object.entries(properties);

  if (entries.length === 0) return '{}';

  const pad = INDENT.repeat(depth);
  const innerPad = INDENT.repeat(depth + 1);
  const lines = entries.map(([key, value]) => {
    const optional = required.has(key) ? '' : '?';
    const hint = options.overrides?.[key] ?? renderNode(value, depth + 1, options);
    return `${innerPad}${JSON.stringify(key)}${optional}: ${hint}`;
  });

  return `{\n${lines.join(',\n')}\n${pad}}`;
}
