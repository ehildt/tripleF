import {
  formatZodIssues,
  videolistSchema,
} from '../../schemas/videolist-json.schema.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateVideolistOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = videolistSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
