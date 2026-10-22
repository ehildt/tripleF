export interface LightboxImage {
  /** The image URL. */
  url: string;
  /** Optional caption/alt for the image. */
  title?: string;
}

export interface LightboxProps {
  /** The gallery images. */
  images: readonly LightboxImage[];
  /** The currently displayed image's index. */
  index: number;
  /** Header title for the active image. */
  activeTitle?: string;
  /** Whether the lightbox is open. */
  isOpen: boolean;
}

export interface LightboxEmits {
  /** Close the lightbox. */
  close: [];
  /** Step to the previous image. */
  prev: [];
  /** Step to the next image. */
  next: [];
  /** Jump to an exact image index (footer thumbnails). */
  selectIndex: [index: number];
}

export interface LightboxHeaderProps {
  /** Header title for the active image. */
  activeTitle?: string;
}

export interface LightboxHeaderEmits {
  /** Close the lightbox. */
  close: [];
}

export interface LightboxFooterProps {
  /** Total number of images. */
  count: number;
  /** The active image's index. */
  activeIndex: number;
}

export interface LightboxFooterEmits {
  /** Jump to an exact image index. */
  selectIndex: [index: number];
}

export interface LightboxViewerProps {
  /** The currently displayed image URL. */
  imageUrl: string;
  /** Whether a previous image exists. */
  hasPrev: boolean;
  /** Whether a next image exists. */
  hasNext: boolean;
}

export interface LightboxViewerEmits {
  /** Step to the previous image. */
  prev: [];
  /** Step to the next image. */
  next: [];
}
