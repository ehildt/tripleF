import { z } from 'zod';

import { safeMediaUrlOrEmpty, safeUrl } from '../helpers/url-schema.helper.js';

const shopOfferSchema = z.object(
  {
    title: z.string().optional(),
    price: z.string().optional(),
    source: z.string().optional(),
    link: safeUrl({ message: 'shopOffers entries must have a valid link' }),
    imageUrl: safeMediaUrlOrEmpty('shopOffers.imageUrl must be a valid URL'),
    delivery: z.string().optional(),
    rating: z.number().optional(),
    ratingCount: z.number().optional(),
  },
  { message: 'shopOffers entries must be objects with a link' },
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

export const shoplistSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  shortDescription: z.string().optional(),
  shopOffers: z.array(shopOfferSchema).optional(),
  sources: z.array(sourceSchema).optional(),
});

export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
