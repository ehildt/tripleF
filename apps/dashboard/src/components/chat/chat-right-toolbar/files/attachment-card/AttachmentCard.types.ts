import type { AttachmentItem } from '../../composables/use-attachment-list.types';

export interface AttachmentCardProps {
  item: AttachmentItem;
  imageSrc: string;
  /** Builds the storage preview URL for an uploaded page hash (pdf galleries). */
  urlForHash: (hash: string) => string;
}
