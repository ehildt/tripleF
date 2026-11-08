export type AttachedFileKind = 'image' | 'document';

export interface AttachedFileEntry {
  /** Stable identity for this pending entry, including duplicate documents. */
  id: string;
  /** Original browser file handle submitted when the entry is selected. */
  file: File;
  /** Whether this entry participates in the next prompt submission. */
  isSelected: boolean;
  /** Local preview URL for images; documents use an empty string. */
  objectUrl: string;
  /** Content hash used for object-storage identity and deduplication. */
  hash: string;
  /** Stable/server conversation id that owns this entry. */
  conversationId: string;
  /** Real image or original document; document conversion is server-side. */
  kind: AttachedFileKind;
}
