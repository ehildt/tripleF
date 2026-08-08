import { z } from 'zod';

import { safeUrl } from '../helpers/url-trust/url-schema.helper.js';

/** One entry of an article's cards array — a link-card aside. */
export const cardSchema = z.object(
  {
    url: safeUrl({ message: 'cards entries must have a valid url' }),
    title: z.string().optional(),
    description: z.string().optional(),
    linkLabel: z.string().optional(),
  },
  { message: 'cards entries must be objects with url' },
);
