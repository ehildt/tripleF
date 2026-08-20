import type {
  GalleryItem,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';

export interface MediaGalleriesProps {
  /** Videos before images (or vice versa) — driven by the app-level media
   * priority context via the template's composable. */
  videosFirst: boolean;
  videoGalleryTitle?: string;
  videoGalleryItems?: VideoGalleryItem[];
  galleryTitle?: string;
  galleryItems?: GalleryItem[];
  /** Dense span-grid mosaic for the image gallery (ar4). */
  mosaic?: boolean;
}
