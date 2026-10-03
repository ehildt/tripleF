/** The document identity the tile needs. */
type DocumentTileSource = {
  name: string;
  hash: string;
};

/** Project a document into the prompt-tile shape. */
export function mapDocumentToTile(doc: DocumentTileSource, url: string) {
  return { name: doc.name, url };
}
