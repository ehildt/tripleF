/** Project a document into the prompt-tile shape. */
export function mapDocumentToTile(
  doc: { name: string; hash: string },
  url: string,
) {
  return { name: doc.name, url };
}
