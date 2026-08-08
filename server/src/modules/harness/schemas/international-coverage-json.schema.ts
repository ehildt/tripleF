import { z } from 'zod';

import { safeUrl } from '../helpers/url-trust/url-schema.helper.js';

/**
 * internationalCoverage aside entries — noteworthy results found in
 * languages other than the user's. The dashboard renders this section for
 * every structured template, and the per-template instructions ask the model
 * to fill it whenever international pools exist in the tool context, so every
 * structured schema must accept it (unknown keys are stripped on validation).
 */
export const internationalCoverageSchema = z.array(
  z.object(
    {
      title: z.string().optional(),
      url: safeUrl({
        message: 'internationalCoverage entries must have a valid url',
      }),
      sourceName: z.string().optional(),
      language: z.string().optional(),
      summary: z.string().optional(),
    },
    { message: 'internationalCoverage entries must be objects' },
  ),
);
