import type { AttachmentItem } from '../composables/use-attachment-list.types';

export interface AttachmentGalleryProps {
  /** The pdf gallery attachment item. Page images ride on `item.pages`. */
  item: AttachmentItem;
  /** Builds the storage preview URL for an uploaded page hash. */
  urlForHash: (hash: string) => string;
}
