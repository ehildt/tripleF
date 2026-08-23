import type { z } from 'zod';

/**
 * Format zod issues as a compact '; '-joined list for the correction
 * prompt the model receives on a validation retry.
 */
export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
