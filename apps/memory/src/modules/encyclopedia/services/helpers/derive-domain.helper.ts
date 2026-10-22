/** Bare hostname of a url, lowercased and www-stripped. */
export function deriveDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}
