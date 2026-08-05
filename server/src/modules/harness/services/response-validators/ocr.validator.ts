import { formatZodIssues, ocrSchema } from '../../schemas/ocr-json.schema.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateOcrOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = ocrSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
