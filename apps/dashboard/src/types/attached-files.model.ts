export type AttachedFileKind = 'image' | 'document';

export interface AttachedFileEntry {
  file: File;
  isSelected: boolean;
  objectUrl: string;
  hash: string;
  conversationId: string;
  /** What the entry represents: a real image or a document (pdf/docx/pptx/
   * txt/…). Document conversion happens server-side at submit time. */
  kind: AttachedFileKind;
}
