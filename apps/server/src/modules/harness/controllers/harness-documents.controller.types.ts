interface ConvertedDocumentPageImage {
  /** Rendered page image filename. */
  name: string;
  /** Storage hash of the rendered page image. */
  hash: string;
}

export interface ConvertedDocumentResult {
  /** Original document filename. */
  name: string;
  /** Content hash of the original document. */
  hash: string;
  /** MIME type of the original document. */
  type: string;
  /** Converted document kind. */
  kind: 'pdf' | 'docx' | 'pptx' | 'text';
  /** Rendered PDF page images shown as client-side tiles. */
  pageImages?: ConvertedDocumentPageImage[];
}

export interface ConvertDocumentsResult {
  /** Documents converted and persisted by the request. */
  documents: ConvertedDocumentResult[];
}
