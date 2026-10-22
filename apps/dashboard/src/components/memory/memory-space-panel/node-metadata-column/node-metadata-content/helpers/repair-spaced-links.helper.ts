/**
 * Repair markdown links whose destination was mangled upstream: sentence-
 * based chunking splits urls at their dots and re-joins them with spaces
 * (`[text](https://en. wikipedia. org/wiki/X)`), and markdown parsers then
 * leave the whole construct as literal text. Collapse the whitespace inside
 * the destination (the optional quoted title is preserved).
 *
 * Non-URL parentheses are left untouched — `](see above)` never becomes a
 * fake link — and angle-bracket destinations (which may legitimately
 * contain spaces) pass through unchanged.
 */
export function repairSpacedLinks(content: string): string {
  return content.replace(
    /\]\(((?:\\.|[^)])*)\)/g,
    (match: string, rawGroup: string) => {
      const head = rawGroup.trimStart();
      if (head.startsWith('<')) return match;
      const splitAt = head.search(/["']/);
      const destination = (
        splitAt === -1 ? head : head.slice(0, splitAt)
      ).replace(/\s+/g, '');
      if (!/^(https?:\/\/|#|\/)/i.test(destination)) return match;
      const title = splitAt === -1 ? '' : head.slice(splitAt);
      return title ? `](${destination} ${title})` : `](${destination})`;
    },
  );
}
