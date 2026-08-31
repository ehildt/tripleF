/** Escape a URL for use as a regex replacement source. */
export function mapUrlToReplacement(url: string) {
  return {
    url,
    escaped: url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  };
}
