import { formatZodIssues } from '../../schemas/format-zod-issues.helper.js';
import { shoplistSchema } from '../../schemas/shoplist-json.schema.js';

import type { ValidationResult } from './validation-result.type.js';

export function validateShoplistOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = shoplistSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  return { valid: true, content: JSON.stringify(schemaResult.data) };
}
