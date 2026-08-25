/** One original document's model-facing content, injected into the prompt. */
export interface DocumentSection {
  /** Original filename as the user attached it. */
  name: string;
  /** Extracted text content (truncated to the configured limit). */
  text: string;
  /** MinIO storage url of the original — the lexicon persist key. */
  url: string;
}
