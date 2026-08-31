import { limitText } from '@triplef/helpers/limit-text';

import type { EodhdClient } from '../../../../../stock-data/providers/eodhd/eodhd-client.js';

type EodhdNewsArticle = Awaited<ReturnType<EodhdClient['news']>>[number];

/** Publisher label from a link when the API does not provide one. */
function deriveSourceFromLink(link: string): string | undefined {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/** Normalize an EODHD news article into the tool result shape. */
export function mapEodhdNewsToResult(
  a: EodhdNewsArticle,
  snippetChars: number,
) {
  return {
    title: a.title,
    url: a.link,
    source: deriveSourceFromLink(a.link),
    date: a.date,
    snippet: a.content ? limitText(a.content, snippetChars) : undefined,
  };
}
