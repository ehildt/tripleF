/**
 * Split a pool of language-tagged items into the main pool (user language
 * or undetermined) and the international pool (reliably detected foreign
 * language). Nothing is ever discarded: undetermined items stay in main so
 * a wrong guess can never exile content the user should see. Order within
 * each bucket is stable.
 */
export function partitionByLanguage<T extends { lang?: string }>(
  items: T[],
  userLang: string | undefined,
): { main: T[]; international: T[] } {
  if (!userLang) return { main: items, international: [] };
  const main: T[] = [];
  const international: T[] = [];
  for (const item of items) {
    if (item.lang && item.lang !== userLang) international.push(item);
    else main.push(item);
  }
  return { main, international };
}
