import { describeSchema } from '../../schemas/describe-json.schema.js';
import { formatZodIssues } from '../../schemas/format-zod-issues.helper.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateDescribeOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = describeSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
