/** An uploaded document, before it is converted for the prompt. */
type OriginalDocumentSource = {
  name: string;
  hash: string;
  type: string;
};

/** Project an uploaded document into the original shape. */
export function mapDocumentToOriginal(doc: OriginalDocumentSource) {
  return { name: doc.name, hash: doc.hash, type: doc.type };
}
