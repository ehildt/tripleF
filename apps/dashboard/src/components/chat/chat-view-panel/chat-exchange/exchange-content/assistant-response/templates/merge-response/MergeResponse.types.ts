import type {
  AssistantResponseData,
  GalleryItem,
} from '@/types/assistant-response-data.model';

export interface MergeResponseProps {
  /** The raw harness response for the template. */
  data: AssistantResponseData;
  /** Opens the owning surface's lightbox for a clicked image. */
  onImageClick?: (item: GalleryItem) => void;
}
