import type { z } from 'zod';

import { formatZodShape, type FormatZodShapeOptions } from '../../schemas/index.js';

/**
 * Assembles a final structured-output prompt from a Zod schema and a prompt
 * template: the schema's JSON shape is rendered and injected between the
 * template's `before` and `after` prose, so the prompt and the validator
 * share one source of truth.
 */
export interface StructuredPromptTemplate {
  /** Prose emitted before the rendered JSON shape. */
  before: string;
  /** Prose emitted after the rendered JSON shape. */
  after: string;
}

export function buildStructuredPrompt(
  schema: z.ZodType,
  template: StructuredPromptTemplate,
  options?: FormatZodShapeOptions,
): string {
  return `${template.before}\n${formatZodShape(schema, options)}\n${template.after}`;
}
