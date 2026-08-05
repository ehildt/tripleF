import {
  formatZodIssues,
  summarySchema,
} from '../../schemas/summary-json.schema.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateSummaryOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = summarySchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
