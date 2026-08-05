import { formatZodIssues, newsSchema } from '../../schemas/news-json.schema.js';

import { computeReadTime } from './read-time.helper.js';
import type { ValidationResult } from './validation-result.type.js';

export function validateNewsOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = newsSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  const news = schemaResult.data;
  const textToRead = [news.headline, news.deck, news.lead, news.sectionContent]
    .filter(Boolean)
    .join(' ');

  const readTime = news.readTime?.trim()
    ? news.readTime
    : computeReadTime(textToRead);
  return { valid: true, content: JSON.stringify({ ...news, readTime }) };
}
