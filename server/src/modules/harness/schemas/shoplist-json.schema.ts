import { z } from 'zod';

import {
  safeMediaUrlOrEmpty,
  safeUrl,
} from '../helpers/url-trust/url-schema.helper.js';

import { internationalCoverageSchema } from './international-coverage-json.schema.js';
import { sourceSchema } from './source-json.schema.js';

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

export const shoplistSchema = z.object({
  category: z.string(),
  title: z.string().min(1, { message: 'title must not be empty' }),
  subtitle: z.string(),
  shortDescription: z.string().optional(),
  shopOffers: z.array(shopOfferSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  internationalCoverage: internationalCoverageSchema.optional(),
});
