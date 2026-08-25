import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';

/**
 * Extract the main article text from a fetched HTML page as structural
 * Markdown. Readability drops the boilerplate (nav/ads/footer) and turndown
 * preserves document structure (headings/lists/tables) — the feed the
 * selection pipeline chunks and embeds. Non-article pages degrade to a
 * turndown of the full body (structure preserved, boilerplate included),
 * never the old lossy regex blob.
 */
export function extractArticleText(html: string): string {
  if (!html.trim()) return '';
  const { document } = parseHTML(html);
  const turndown = new TurndownService();
  const article = document.documentElement ? new Readability(document as unknown as Document).parse() : null;
  const content = article?.content;
  if (typeof content === 'string' && content.trim()) {
    return turndown.turndown(content);
  }
  return turndown.turndown(document.body?.innerHTML ?? '');
}
