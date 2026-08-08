import { z } from 'zod';

import { safeUrl } from '../helpers/url-trust/url-schema.helper.js';

/**
 * One entry of a sources array — unified across the snippet-composed
 * templates (news, article, evaluation). url + title are the contract the
 * dashboard's sources list needs; sourceName/date/snippet enrich it when
 * the retrieved article provides them.
 */
export const sourceSchema = z.object(
  {
    url: safeUrl({ message: 'sources entries must have a valid url' }),
    title: z.string().optional(),
    sourceName: z.string().optional(),
    date: z.string().optional(),
    snippet: z.string().optional(),
  },
  { message: 'sources entries must be objects with url' },
);
