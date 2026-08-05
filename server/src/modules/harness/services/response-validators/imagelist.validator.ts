import {
  formatZodIssues,
  imagelistSchema,
} from '../../schemas/imagelist-json.schema.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateImagelistOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = imagelistSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
