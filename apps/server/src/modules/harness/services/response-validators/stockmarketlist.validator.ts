import { formatZodIssues } from '../../schemas/format-zod-issues.helper.js';
import { stockmarketListSchema } from '../../schemas/stockmarketlist-json.schema.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateStockmarketListOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = stockmarketListSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
