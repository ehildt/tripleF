import { compareSchema } from '@triplef/agent/schemas';
import { formatZodIssues } from '@triplef/agent/schemas';

import type { ValidationResult } from './validation-result.type.js';

export function validateCompareOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = compareSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
