import { z } from 'zod';

import { safeUrl } from '../helpers/url-schema.helper.js';

const imageUrlOrPath = z.string();

const galleryItemSchema = z.object(
  {
    imageUrl: imageUrlOrPath,
    imageAlt: z.string().optional(),
    title: z.string().optional(),
    caption: z.string().optional(),
  },
  { message: 'galleryItems entries must be objects with imageUrl' },
);

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
    url: safeUrl({ message: 'sources entries must have a valid url' }),
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
  galleryTitle: z.string().optional(),
  galleryItems: z.array(galleryItemSchema).optional(),
  keyFindings: z.array(keyFindingSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  note: z.string().optional(),
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
