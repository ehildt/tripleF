import {
  evaluationSchema,
  formatZodIssues,
} from '../../schemas/evaluation-json.schema.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateEvaluationOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = evaluationSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
