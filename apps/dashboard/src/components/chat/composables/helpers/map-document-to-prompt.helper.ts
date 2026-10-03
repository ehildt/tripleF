/** The document identity the prompt entry needs. */
type PromptDocumentSource = {
  name: string;
  hash: string;
};

/** Project a document into the prompt shape. */
export function mapDocumentToPrompt(doc: PromptDocumentSource) {
  return { name: doc.name, hash: doc.hash };
}
