/** Project a past chunk into the encyclopedia-passage shape. */
export function mapChunkToEncyclopediaPassage(chunk: {
  url?: string;
  title?: string;
  content: string;
  sourceType?: 'content' | 'result';
}) {
  return {
    url: chunk.url,
    title: chunk.title,
    content: chunk.content,
    sourceType: chunk.sourceType,
  };
}
