/** Estimate a human-friendly read time from the word count of a body of text. */
export function computeReadTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}
