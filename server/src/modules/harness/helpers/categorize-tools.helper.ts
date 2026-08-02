/** Categorize tool names into functional groups for classifier prompts. */
export function categorizeTools(
  toolNames: readonly string[],
): Record<string, string[]> {
  const cats: Record<string, string[]> = {
    webSearch: [],
    imageSearch: [],
    newsSearch: [],
    videoSearch: [],
    pageFetch: [],
    browser: [],
    imageVariants: [],
    specialized: [],
  };
  for (const t of toolNames) {
    if (t.startsWith('browser_')) cats.browser.push(t);
    else if (t === 'webSearch' || t.endsWith('WebSearch'))
      cats.webSearch.push(t);
    else if (t.endsWith('ImageSearch')) cats.imageSearch.push(t);
    else if (t.endsWith('NewsSearch')) cats.newsSearch.push(t);
    else if (t.endsWith('VideoSearch')) cats.videoSearch.push(t);
    else if (t.includes('Fetch') || t.includes('fetch') || t.includes('Scrape'))
      cats.pageFetch.push(t);
    else if (t.startsWith('request')) cats.imageVariants.push(t);
    else cats.specialized.push(t);
  }
  return cats;
}
