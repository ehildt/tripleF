/** Project an uploaded document into the original shape. */
export function mapDocumentToOriginal(doc: {
  name: string;
  hash: string;
  type: string;
}) {
  return { name: doc.name, hash: doc.hash, type: doc.type };
}
