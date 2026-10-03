import type { AttachmentItem } from '../composables/use-attachment-list.types';

export interface FilesProps {
  /** Merged attachment entries to render. */
  attachments: readonly AttachmentItem[];
  /** Builds the preview URL for one attachment. */
  previewUrl: (item: AttachmentItem) => string;
  /** Builds the storage preview URL for an uploaded page hash (pdf galleries). */
  urlForHash: (hash: string) => string;
}
