export interface NodeDetailsContentProps {
  /** Sanitized Markdown-rendered node content. */
  contentHtml: string;
  /** Optional stored-original document href. */
  downloadUrl?: string;
}
