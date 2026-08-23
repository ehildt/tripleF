import { formatZodIssues } from '../../schemas/format-zod-issues.helper.js';
import { stockmarketItemSchema } from '../../schemas/stockmarketitem-json.schema.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateStockmarketItemOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = stockmarketItemSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
