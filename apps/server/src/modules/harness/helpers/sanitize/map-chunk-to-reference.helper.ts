/** Project a selected chunk into the reference shape. */
export function mapChunkToReference(chunk: {
  url?: string;
  title?: string;
  content: string;
}) {
  return { url: chunk.url, title: chunk.title, content: chunk.content };
}
