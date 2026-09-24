import type { DocumentPreviewItem } from './composables/use-document-preview';

export interface DocumentPreviewProps {
  /** The document to preview (name + source url). */
  item: DocumentPreviewItem | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  html: string | null;
  text: string | null;
}
