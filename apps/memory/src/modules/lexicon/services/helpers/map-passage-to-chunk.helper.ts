/** Project a merged passage into the selected-chunk shape. */
export function mapPassageToChunk(passage: {
  url: string;
  title?: string;
  content: string;
  score: number;
}) {
  return {
    url: passage.url,
    title: passage.title,
    content: passage.content,
    score: passage.score,
    sourceType: 'content' as const,
  };
}
