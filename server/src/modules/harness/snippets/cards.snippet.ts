import { z } from 'zod';

import { cardSchema } from '../schemas/card-json.schema.js';

import type { TemplateSnippet } from './snippet.types.js';

/** Article link cards: teaser-links to further reading (client card grid). */
export const cardsSnippet: TemplateSnippet = {
  fields: {
    cardsTitle: z.string().optional(),
    cards: z.array(cardSchema).optional(),
  },
  instruction: `SNIPPET article cards (client link-card grid):
- Needs: distinct worthwhile source URLs left over after the primary content and sources are filled.
- cards: up to 6 cards, each with url plus optional title, description, linkLabel. Every url must be unique across the response and must not repeat any source url.
- cardsTitle: a heading for the card row when cards are present.
- Write fresh teaser copy — never restate the title, summary, or body text.`,
};
