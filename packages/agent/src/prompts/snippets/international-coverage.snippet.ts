import { internationalCoverageSchema } from '../../schemas/index.js';
import { INTERNATIONAL_COVERAGE_INSTRUCTIONS } from '../instructions/international-coverage.instruction.js';

import type { TemplateSnippet } from './snippet.types.js';

/**
 * International-coverage aside: other-language finds rendered aside.
 * The instruction text stays shared with the non-snippet templates —
 * resolveVariantInstructions still appends it for those.
 */
export const internationalCoverageSnippet: TemplateSnippet = {
  fields: {
    internationalCoverage: internationalCoverageSchema.optional(),
  },
  instruction: INTERNATIONAL_COVERAGE_INSTRUCTIONS,
};
