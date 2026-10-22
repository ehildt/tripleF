/**
 * Split a pool of language-tagged items into the main pool (user language,
 * an explicitly requested content language, or undetermined) and the
 * international pool (reliably detected foreign language). Nothing is ever
 * discarded: undetermined items stay in main so a wrong guess can never
 * exile content the user should see, and `contentLanguages` keeps on-topic
 * foreign-language items in main — a request for "japanese dark trap" wants
 * the Japanese results as primary content, not as an aside. Order within
 * each bucket is stable.
 */
export function partitionByLanguage<T extends { lang?: string }>(
  items: T[],
  userLang: string | undefined,
  contentLanguages: readonly string[] = [],
): { main: T[]; international: T[] } {
  if (!userLang) return { main: items, international: [] };
  const allowed = new Set([userLang, ...contentLanguages]);
  const main: T[] = [];
  const international: T[] = [];
  for (const item of items) {
    if (item.lang && !allowed.has(item.lang)) international.push(item);
    else main.push(item);
  }
  return { main, international };
}
