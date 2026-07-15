import { z } from 'zod';

const keyFindingSchema = z.object(
  {
    text: z.string().min(1, {
      message: 'keyFindings entries must have a non-empty text field',
    }),
  },
  { message: 'keyFindings entries must be objects with text' },
);

export const ocrSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  sectionContent: z.string(),
  keyFindings: z.array(keyFindingSchema).optional(),
});

export type OcrJson = z.infer<typeof ocrSchema>;

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
