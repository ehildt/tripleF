export interface TextPreviewProps {
  /** Filename used to pick the renderer (markdown vs plain text). */
  name: string;
  /** Sanitized HTML (docx conversion or markdown). */
  html?: string;
  /** Plain text (pptx slides, txt/csv/json). */
  text?: string;
}
