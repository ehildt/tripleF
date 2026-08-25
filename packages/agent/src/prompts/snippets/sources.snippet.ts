import { z } from 'zod';

import { sourceSchema } from '../../schemas/index.js';

import type { TemplateSnippet } from './snippet.types.js';

/** Sources: URL attribution for every claim (client sources list). */
export const sourcesSnippet: TemplateSnippet = {
  fields: {
    sources: z.array(sourceSchema).optional(),
  },
  instruction: `SNIPPET sources (client sources list):
- Needs: real URLs from the retrieved results — attribute every claim.
- List every retrieved article the response relies on — not just a selection. When searches returned results, sources typically covers most of them; a thin list while retrieved articles go unused is a failure.
- sources entries: url and title (the minimum the entry needs), plus sourceName, date, and snippet when the retrieved article provides them.
- Omit entirely when nothing was retrieved — never invent sources.`,
};
