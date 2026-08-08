import { z } from 'zod';

import type { TemplateSnippet } from './snippet.types.js';

/** Article/evaluation hero header: category chip, title, optional subtitle. */
export const headerArticleSnippet: TemplateSnippet = {
  fields: {
    category: z.string().optional(),
    title: z.string().min(1, { message: 'title must not be empty' }),
    subtitle: z.string().optional(),
  },
  instruction: `SNIPPET article header (client hero title block):
- category: a short label such as Research, News, Analysis, Report.
- title: a concise, descriptive headline. REQUIRED, non-empty.
- subtitle: an optional one-line summary; omit when it adds nothing.`,
};
