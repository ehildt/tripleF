import {
  compareSchema,
  formatZodIssues,
} from '../../schemas/compare-json.schema.js';

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
