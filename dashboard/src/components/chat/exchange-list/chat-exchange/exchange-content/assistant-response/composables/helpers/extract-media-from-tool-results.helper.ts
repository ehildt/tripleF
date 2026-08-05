import type {
  GalleryItem,
  HarnessResponseData,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';

import { isTrustedImageUrl } from './is-trusted-image-url.helper';
import { isVideoUrl } from './is-video-url.helper';

interface ToolResult {
  toolName: string;
  result?: {
    results?: Array<Record<string, unknown>>;
  };
}

function isToolResult(value: unknown): value is ToolResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toolName' in value &&
    typeof (value as ToolResult).toolName === 'string'
  );
}

function extractImageUrl(item: Record<string, unknown>): string {
  const candidates = [item.imageUrl, item.image, item.url];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

function extractVideoUrl(item: Record<string, unknown>): string {
  const candidates = [item.videoUrl, item.link, item.url];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

function toImageTitle(raw?: Record<string, unknown>): string {
  const title = raw?.title;
  return typeof title === 'string' && title.trim() ? title.trim() : '';
}

function toVideoTitle(raw?: Record<string, unknown>): string {
  const title = raw?.title;
  return typeof title === 'string' && title.trim() ? title.trim() : '';
}

function collectImages(
  toolResults: ToolResult[],
): Array<{ url: string; title: string }> {
  const images: Array<{ url: string; title: string }> = [];
  for (const tr of toolResults) {
    if (!tr.toolName.endsWith('ImageSearch')) continue;
    for (const item of tr.result?.results ?? []) {
      const url = extractImageUrl(item);
      if (url && isTrustedImageUrl(url)) {
        images.push({ url, title: toImageTitle(item) });
      }
    }
  }
  return images;
}

function collectVideos(
  toolResults: ToolResult[],
): Array<{ url: string; title: string }> {
  const videos: Array<{ url: string; title: string }> = [];
  for (const tr of toolResults) {
    if (!tr.toolName.endsWith('VideoSearch')) continue;
    for (const item of tr.result?.results ?? []) {
      const url = extractVideoUrl(item);
      if (url && isVideoUrl(url))
        videos.push({ url, title: toVideoTitle(item) });
    }
  }
  return videos;
}

function collectMediaUrls(toolResults: ToolResult[]): {
  images: Array<{ url: string; title: string }>;
  videos: Array<{ url: string; title: string }>;
} {
  return {
    images: collectImages(toolResults),
    videos: collectVideos(toolResults),
  };
}

function buildGalleryItems(
  imageItems: Array<{ url: string; title: string }>,
  existingHeroImage?: string,
  existingGallery?: GalleryItem[],
): GalleryItem[] {
  const seen = new Set<string>();
  const items: GalleryItem[] = [];

  if (existingHeroImage) seen.add(existingHeroImage);
  for (const item of existingGallery ?? []) {
    if (item.imageUrl) seen.add(item.imageUrl);
  }

  for (const { url, title } of imageItems) {
    if (seen.has(url)) continue;
    // Synthesized entries must satisfy the schema (non-empty title/caption)
    // — a nameless candidate cannot go into a captioned gallery.
    if (!title) continue;
    seen.add(url);
    items.push({
      imageUrl: url,
      imageAlt: title,
      title,
      caption: title,
    });
  }

  return items;
}

function buildVideoGalleryItems(
  videoItems: Array<{ url: string; title: string }>,
  existingHeroVideo?: string,
  existingVideos?: VideoGalleryItem[],
): VideoGalleryItem[] {
  const seen = new Set<string>();
  const items: VideoGalleryItem[] = [];

  if (existingHeroVideo) seen.add(existingHeroVideo);
  for (const item of existingVideos ?? []) {
    if (item.videoUrl) seen.add(item.videoUrl);
  }

  for (const { url, title } of videoItems) {
    if (seen.has(url)) continue;
    if (!title) continue;
    seen.add(url);
    items.push({
      videoUrl: url,
      title,
      // Caption is left unset — it is optional and never fabricated from the
      // title. The caption strip only renders when a real one is present.
    });
  }

  return items;
}

/**
 * Templates whose layout has no hero media. Synthesizing a hero from the
 * first tool-result URL would silently consume that URL (the dedupe pass
 * marks hero imagery as spent) while the component never renders a hero —
 * the first imagelist/videolist item would vanish from the grid.
 */
const NO_HERO_TEMPLATES = new Set(['imagelist', 'videolist', 'shoplist']);

export function extractMediaFromToolResults(
  toolResults: unknown[],
  data: HarnessResponseData,
  template?: string,
  availableImages?: Array<{ url: string; title?: string }>,
  availableVideos?: Array<{ url: string; title?: string }>,
): void {
  const results = (toolResults ?? []).filter(isToolResult);

  // Prefer the server's model-visible (deduped) media pool when the server
  // provides one: cross-request repeats are already removed server-side, so
  // we never re-display media the model deliberately excluded (e.g.
  // previously-shown videos). The pool may be empty (nothing new) — that is
  // authoritative. Only fall back to scraping raw tool results when the
  // server sent no pool at all.
  const serverProvided =
    availableImages !== undefined || availableVideos !== undefined;

  const { images, videos } = serverProvided
    ? {
        images: (availableImages ?? []).map((i) => ({
          url: i.url,
          title: i.title,
        })),
        videos: (availableVideos ?? []).map((v) => ({
          url: v.url,
          title: v.title,
        })),
      }
    : collectMediaUrls(results);

  if (images.length === 0 && videos.length === 0) return;

  const heroAllowed = !template || !NO_HERO_TEMPLATES.has(template);
  const existingHeroImage = data.heroImageUrl?.trim();
  const existingHeroVideo = data.heroVideoUrl?.trim();

  // Prefer video hero when available, mirroring the server instructions.
  // Contract: a hero video must carry a title (popout title bar, now-playing
  // marquee) — only promote a candidate whose title is known. The caption is
  // kept as-is (never synthesized from the title); the figcaption only shows
  // it when it is actually present.
  if (
    heroAllowed &&
    !existingHeroVideo &&
    videos.length > 0 &&
    videos[0].title
  ) {
    data.heroVideoUrl = videos[0].url;
    data.heroVideoTitle = data.heroVideoTitle || videos[0].title;
  }

  if (
    heroAllowed &&
    !existingHeroImage &&
    !data.heroVideoUrl &&
    images.length > 0
  ) {
    data.heroImageUrl = images[0].url;
  }

  const newGallery = buildGalleryItems(
    images,
    data.heroImageUrl,
    data.galleryItems,
  );
  if (newGallery.length > 0) {
    data.galleryItems = [...(data.galleryItems ?? []), ...newGallery];
  }

  const newVideos = buildVideoGalleryItems(
    videos,
    data.heroVideoUrl,
    data.videoGalleryItems,
  );
  if (newVideos.length > 0) {
    data.videoGalleryItems = [...(data.videoGalleryItems ?? []), ...newVideos];
  }
}
