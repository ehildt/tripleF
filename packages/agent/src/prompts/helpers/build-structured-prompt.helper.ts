import type { z } from 'zod';

import { formatZodShape } from '../../schemas/helpers/zod/format-zod-shape.helper.js';
import type { FormatZodShapeOptions } from '../../schemas/helpers/zod/format-zod-shape.types.js';

import type { StructuredPromptTemplate } from './build-structured-prompt.types.js';

export function buildStructuredPrompt(
  schema: z.ZodType,
  template: StructuredPromptTemplate,
  options?: FormatZodShapeOptions,
): string {
  return `${template.before}\n${formatZodShape(schema, options)}\n${template.after}`;
}
