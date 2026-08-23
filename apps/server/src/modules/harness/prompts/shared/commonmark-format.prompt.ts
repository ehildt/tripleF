/**
 * Strict CommonMark formatting contract for the free-form "text" template.
 *
 * Two problems it solves:
 *
 * 1. Syntax validity — the model tends to emit non-standard emphasis
 *    (spaces inside markers `** bold **`, or unicode asterisks `＊`/`∗`)
 *    which CommonMark parsers correctly render as literal text.
 * 2. Presentation quality — the model over-uses bold (bolding whole
 *    sentences and lead-in clauses), which renders as a wall of emphasis.
 *    Emphasis must be reserved for the single key term, with headings and
 *    short paragraphs providing the structure instead.
 */
export const COMMONMARK_FORMAT = `MARKDOWN FORMAT (strict CommonMark):
- Use ASCII asterisks only: *italic* and **bold**.
- Never put spaces inside the markers: write **bold**, never ** bold **.
- Never use fullwidth or unicode asterisk characters (＊ or ∗).
- Separate paragraphs with a blank line; keep paragraphs short.
- Use Markdown links for URLs: [label](https://...). Never paste bare URLs.
- Use emphasis sparingly. Bold only the single most important term in a paragraph — never a whole sentence or a lead-in clause.
- Prefer ## or ### headings to introduce sections instead of bolding the lead-in.
- Use - bullets for parallel items and 1. numbers for ordered steps.`;
