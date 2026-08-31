/** Project a past chunk into the lexicon-passage shape. */
export function mapChunkToLexiconPassage(chunk: {
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
