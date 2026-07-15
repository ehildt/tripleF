export const SEARCH_POLICY = `SEARCH:
Extract semantic signals only from provided images when relevant.

FOLLOW-UP SEARCHES MAY USE ONLY:
- user-provided content
- explicitly extracted visible entities
- tool-returned factual entities

Never derive searches from speculation or invented context.
If no valid signal exists, do not search.`;
