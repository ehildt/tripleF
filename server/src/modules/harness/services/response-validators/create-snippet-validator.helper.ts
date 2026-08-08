import { formatZodIssues } from '../../schemas/format-zod-issues.helper.js';
import type { SnippetTemplatePreset } from '../../snippets/snippet.types.js';
import { getSnippetTemplateSchema } from '../../snippets/snippet-presets.constant.js';

import { coerceLayout } from './helpers/coerce-layout.helper.js';
import { computeReadTime } from './read-time.helper.js';
import type {
  ValidationContext,
  ValidationResult,
} from './validation-result.type.js';

/**
 * Build the response validator for a snippet-composed template: zod schema
 * check, then layout coercion (allowed set + preconditions), then the
 * server-side read-time estimate for presets that carry one.
 */
export function createSnippetValidator(preset: SnippetTemplatePreset) {
  const schema = getSnippetTemplateSchema(preset.template);

  return (
    parsed: Record<string, unknown>,
    context?: ValidationContext,
  ): ValidationResult => {
    const result = schema.safeParse(parsed);
    if (!result.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatZodIssues(result.error.issues)}`,
      };
    }

    let data: Record<string, unknown> = {
      ...(result.data as Record<string, unknown>),
    };
    const layout = coerceLayout(
      data,
      context?.allowedLayouts?.length
        ? context.allowedLayouts
        : preset.supportedLayouts,
    );
    data.layout = layout;

    if (preset.readTimeKeys) {
      const existing =
        typeof data.readTime === 'string' ? data.readTime.trim() : '';
      const textToRead = preset.readTimeKeys
        .map((key) => data[key])
        .filter((value): value is string => typeof value === 'string')
        .join(' ');
      if (!existing) {
        data = { ...data, readTime: computeReadTime(textToRead) };
      }
    }

    return { valid: true, content: JSON.stringify(data) };
  };
}
