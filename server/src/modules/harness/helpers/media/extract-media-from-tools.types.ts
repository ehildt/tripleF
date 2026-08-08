/** Image candidate passed to the respond step, with display metadata. */
export interface ExtractedImageItem {
  imageUrl: string;
  title?: string;
  width?: number;
  height?: number;
  source?: string;
  /**
   * When true, verification confirms the image is real and reachable but
   * skips the strict 1280×720 dimension requirement. Used for engines (e.g.
   * Bright Data) whose results we trust the Google-side size filter for —
   * Google images are usually og-image size (~1200×630), well below 720p.
   */
  skipDimensionCheck?: boolean;
}

/** Video candidate passed to the respond step, with display metadata. */
export interface ExtractedVideoItem {
  videoUrl: string;
  title?: string;
  duration?: string;
  channel?: string;
  date?: string;
  views?: number;
  thumbnailUrl?: string;
  description?: string;
  lang?: string;
}

/** Video pool buckets, in display priority: web-article videos, then the
 * dedicated YouTube search, then any other video search. */
export type VideoBucket = 'web' | 'youtube' | 'video';

export type VideoCandidate = ExtractedVideoItem & { bucket: VideoBucket };

export type VideoDedupState = {
  seenIds: Set<string>;
  seenUrls: Set<string>;
  seenTitles: Set<string>;
  webVideos: ExtractedVideoItem[];
  videoSearchItems: ExtractedVideoItem[];
};
