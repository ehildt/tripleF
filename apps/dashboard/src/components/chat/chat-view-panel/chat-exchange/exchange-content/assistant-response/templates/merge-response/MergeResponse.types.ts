import type {
  GalleryItem,
  HarnessResponseData,
} from '@/types/harness-response-data.model';

export interface MergeResponseProps {
  /** The raw harness response for the template. */
  data: HarnessResponseData;
  /** Opens the owning surface's lightbox for a clicked image. */
  onImageClick?: (item: GalleryItem) => void;
}
