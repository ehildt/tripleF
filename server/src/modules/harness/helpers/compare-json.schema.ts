import { z } from 'zod';

const keyFindingSchema = z.object(
  {
    text: z.string().min(1, {
      message: 'keyFindings entries must have a non-empty text field',
    }),
  },
  { message: 'keyFindings entries must be objects with text' },
);

const sourceSchema = z.object(
  {
    url: z.string().url({ message: 'sources entries must have a valid url' }),
    title: z.string().optional(),
    sourceName: z.string().optional(),
    date: z.string().optional(),
    snippet: z.string().optional(),
  },
  { message: 'sources entries must be objects with url' },
);

export const compareSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  sectionContent: z.string(),
  keyFindings: z.array(keyFindingSchema).optional(),
  sources: z.array(sourceSchema).optional(),
});

export type CompareJson = z.infer<typeof compareSchema>;

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
