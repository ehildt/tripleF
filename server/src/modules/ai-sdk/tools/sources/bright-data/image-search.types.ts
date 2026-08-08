interface BrightDataImageItem {
  title?: string;
  /** Actual image URL. */
  original_image?: string;
  /** Embedded base64 thumbnail (data URI) — not usable directly. */
  image?: string;
  image_url?: string;
  imageUrl?: string;
  link?: string;
  source_link?: string;
  width?: number;
  height?: number;
  source?: string;
}

export interface BrightDataImageSearchResponse {
  images?: BrightDataImageItem[];
}
