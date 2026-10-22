export interface MediaImageCardProps {
  /** The hero image URL. */
  imageUrl: string;
  /** Alt text for the image (also the lightbox's accessible label). */
  imageAlt?: string;
}

export interface MediaImageCardEmits {
  /** The image was clicked — the parent opens its lightbox. Never fires
   * once the image failed to load. */
  click: [imageUrl: string, imageAlt: string];
}
