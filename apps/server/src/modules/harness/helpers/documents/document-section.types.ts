/** One original document's model-facing content, injected into the prompt. */
export interface DocumentSection {
  /** Original filename as the user attached it. */
  name: string;
  /** Extracted text content (truncated to the configured limit). */
  text: string;
  /** MinIO storage url of the original — the encyclopedia persist key. */
  url: string;
  /** Mime type of the original upload (e.g. `application/pdf`). */
  mimeType?: string;
  /** Byte size of the original upload. */
  sizeBytes?: number;
  /** Content hash of the original upload (the MinIO object identity). */
  originalHash?: string;
}
