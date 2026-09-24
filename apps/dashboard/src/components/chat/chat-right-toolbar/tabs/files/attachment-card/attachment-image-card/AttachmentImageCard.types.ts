import type { AttachmentItem } from '../../../../composables/use-attachment-list.types';

export interface AttachmentImageCardProps {
  item: AttachmentItem;
  /** Resolved preview URL for the image. */
  imageSrc: string;
}
