/** Project a document into the prompt shape. */
export function mapDocumentToPrompt(doc: { name: string; hash: string }) {
  return { name: doc.name, hash: doc.hash };
}
