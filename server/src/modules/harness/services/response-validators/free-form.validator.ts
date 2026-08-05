import type { ValidationResult } from './validation-result.type.js';

/** Free-form templates (text/compact) require no schema validation. */
export function validateFreeFormOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  return { valid: true, content: JSON.stringify(parsed) };
}
