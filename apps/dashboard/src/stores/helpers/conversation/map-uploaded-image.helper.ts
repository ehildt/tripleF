import type { UploadedImage } from '../../conversation.model';

/** Default an uploaded image to selected when rehydrating. */
export function mapUploadedImage(img: UploadedImage): UploadedImage {
  return { ...img, selected: img.selected ?? true };
}
