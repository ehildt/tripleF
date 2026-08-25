import { formatZodIssues } from '@triplef/agent/schemas';
import { stockmarketItemSchema } from '@triplef/agent/schemas';

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
