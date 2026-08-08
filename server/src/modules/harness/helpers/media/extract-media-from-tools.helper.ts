import { canonicalVideoId } from '../url-trust/canonical-video-id.helper.js';
import { categorizeUrl } from '../url-trust/categorize-url.helper.js';
import { isEmbeddableVideoUrl } from '../url-trust/is-embeddable-video-url.helper.js';
import { isTrustedImageUrl } from '../url-trust/is-trusted-image-url.helper.js';

import type {
  ExtractedImageItem,
  ExtractedVideoItem,
  VideoBucket,
  VideoCandidate,
  VideoDedupState,
} from './extract-media-from-tools.types.js';
import type { ToolEntry } from './tool-entry.types.js';

/**
 * Extract image URLs from ImageSearch results with deduplication. Keeps the
 * dimensions and source site so media-list templates can display them.
 */
export function extractImageSearchItems(
  toolResults: ToolEntry[],
): ExtractedImageItem[] {
  const items: ExtractedImageItem[] = [];
  const seen = new Set<string>();

  for (const tr of toolResults) {
    if (!tr.toolName.endsWith('ImageSearch')) continue;

    const data = tr.result as
      | {
          results?: Array<{
            imageUrl?: string;
            title?: string;
            width?: number;
            height?: number;
            source?: string;
            domain?: string;
          }>;
        }
      | undefined;
    if (!data?.results) continue;

    for (const r of data.results) {
      const url = r.imageUrl;
      if (!url || !isTrustedImageUrl(url) || seen.has(url)) continue;
      seen.add(url);
      items.push({
        imageUrl: url,
        title: r.title,
        width: r.width,
        height: r.height,
        source: r.source || r.domain || undefined,
        // Bright Data returns no pixel dimensions and we trust its Google-side
        // `tbs` size filter, so it must not be dropped by the 720p gate.
        skipDimensionCheck: tr.toolName.startsWith('brightData'),
      });
    }
  }

  return items;
}

/** Video pool buckets, in display priority: web-article videos, then the
 * dedicated YouTube search, then any other video search. */
const VIDEO_BUCKET_PRIORITY: Record<VideoBucket, number> = {
  web: 0,
  youtube: 1,
  video: 2,
};

/**
 * Determine which bucket a video URL belongs to based on tool name.
 */
function videoUrlBucket(toolName: string): VideoBucket | null {
  if (toolName === 'youtubeVideoSearch') return 'youtube';
  if (toolName.endsWith('VideoSearch')) return 'video';
  if (toolName.endsWith('WebSearch') || toolName.endsWith('NewsSearch'))
    return 'web';
  return null;
}

/**
 * Extract video candidates from a single tool result.
 */
function extractCandidates(
  tr: ToolEntry,
): Array<ExtractedVideoItem & { bucket: VideoBucket }> {
  const bucket = videoUrlBucket(tr.toolName);
  if (!bucket) return [];

  const data = tr.result as
    | {
        results?: Array<{
          videoUrl?: string;
          url?: string;
          link?: string;
          title?: string;
          duration?: string;
          channel?: string;
          date?: string;
          views?: number;
          thumbnailUrl?: string;
          snippet?: string;
          lang?: string;
        }>;
      }
    | undefined;
  if (!data?.results) return [];

  const items: ExtractedVideoItem[] = [];
  for (const r of data.results) {
    const rawUrl = r.videoUrl || r.url || r.link;
    if (!rawUrl) continue;
    const category = categorizeUrl(rawUrl);
    if (!category.trusted || category.kind !== 'video') continue;
    if (!isEmbeddableVideoUrl(rawUrl)) continue;
    items.push({
      videoUrl: rawUrl,
      title: r.title,
      duration: r.duration || undefined,
      channel: r.channel || undefined,
      date: r.date || undefined,
      views: typeof r.views === 'number' && r.views > 0 ? r.views : undefined,
      thumbnailUrl: r.thumbnailUrl || undefined,
      description: r.snippet || undefined,
      lang: r.lang || undefined,
    });
  }

  return items.map((item) => ({
    ...item,
    bucket,
  }));
}

/**
 * Normalize a video title for fuzzy deduplication.
 * Lowercases, removes non-alphanumeric tokens, and collapses whitespace.
 */
function normalizeVideoTitle(title?: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createVideoDedupState(): VideoDedupState {
  return {
    seenIds: new Set<string>(),
    seenUrls: new Set<string>(),
    seenTitles: new Set<string>(),
    webVideos: [],
    videoSearchItems: [],
  };
}

function isDuplicateCandidate(
  candidate: VideoCandidate,
  state: VideoDedupState,
): boolean {
  const canonicalId = canonicalVideoId(candidate.videoUrl);
  const normalizedTitle = normalizeVideoTitle(candidate.title);

  if (canonicalId && state.seenIds.has(canonicalId)) return true;
  if (state.seenUrls.has(candidate.videoUrl)) return true;
  if (normalizedTitle && state.seenTitles.has(normalizedTitle)) return true;

  return false;
}

function registerCandidate(
  candidate: VideoCandidate,
  state: VideoDedupState,
): void {
  const canonicalId = canonicalVideoId(candidate.videoUrl);
  const normalizedTitle = normalizeVideoTitle(candidate.title);

  if (canonicalId) state.seenIds.add(canonicalId);
  state.seenUrls.add(candidate.videoUrl);
  if (normalizedTitle) state.seenTitles.add(normalizedTitle);

  const item: ExtractedVideoItem & { bucket?: VideoBucket } = {
    ...candidate,
  };
  delete item.bucket;
  if (candidate.bucket === 'web') state.webVideos.push(item);
  else state.videoSearchItems.push(item);
}

/**
 * Extract video URLs from both VideoSearch and web search results.
 * Web-search videos take precedence; within video searches the dedicated
 * YouTube search wins over other providers (e.g. on identical videos).
 * Deduplicates by canonical provider ID, then falls back to URL exact
 * match, then to normalized title similarity.
 */
export function extractVideoSearchItems(
  toolResults: ToolEntry[],
): ExtractedVideoItem[] {
  const state = createVideoDedupState();

  const candidates = toolResults
    .flatMap((tr) => extractCandidates(tr))
    .sort(
      (a, b) =>
        VIDEO_BUCKET_PRIORITY[a.bucket] - VIDEO_BUCKET_PRIORITY[b.bucket],
    );

  for (const candidate of candidates) {
    if (isDuplicateCandidate(candidate, state)) continue;
    registerCandidate(candidate, state);
  }

  return [...state.webVideos, ...state.videoSearchItems];
}
