import { z } from 'zod';

import { safeUrl } from '../helpers/url-schema.helper.js';

const galleryItemSchema = z.object(
  {
    imageUrl: z
      .string()
      .url({ message: 'galleryItems.imageUrl must be a valid URL' }),
    imageAlt: z.string().min(1, {
      message: 'galleryItems.imageAlt must not be empty',
    }),
    title: z.string().min(1, {
      message: 'galleryItems.title must not be empty',
    }),
    caption: z.string().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    source: z.string().optional(),
  },
  { message: 'galleryItems entries must be objects with imageUrl' },
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

export const imagelistSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  galleryItems: z.array(galleryItemSchema),
  sources: z.array(sourceSchema).optional(),
});

export type ImagelistJson = z.infer<typeof imagelistSchema>;

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
