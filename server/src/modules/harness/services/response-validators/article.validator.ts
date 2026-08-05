import {
  articleSchema,
  formatZodIssues,
} from '../../schemas/article-json.schema.js';

import { computeReadTime } from './read-time.helper.js';
import type { ValidationResult } from './validation-result.type.js';

export function validateArticleOutput(
  parsed: Record<string, unknown>,
): ValidationResult {
  const schemaResult = articleSchema.safeParse(parsed);
  if (!schemaResult.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
    };
  }

  const article = schemaResult.data;
  const textToRead = [
    article.title,
    article.summary,
    article.sectionContent,
    article.conclusion,
  ]
    .filter(Boolean)
    .join(' ');

  const readTime = article.readTime?.trim()
    ? article.readTime
    : computeReadTime(textToRead);

  return { valid: true, content: JSON.stringify({ ...article, readTime }) };
}
