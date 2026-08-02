import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { isMeaningfulString } from './is-meaningful-string.helper';
import { isTrustedImageUrl } from './is-trusted-image-url.helper';
import { isVideoUrl } from './is-video-url.helper';

/**
 * Link targets the dashboard renders as <a :href> must never carry
 * javascript:/data: schemes — streamed deltas render before the server's
 * schema validation runs, so the client enforces http(s) itself. A falsy
 * or absent URL passes through unchanged (title-only entries stay text).
 */
function isSafeLinkUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Blank dangerous link URLs in place; safe or absent URLs pass through. */
function blankUnsafeLink<T extends { url?: string }>(item: T): T {
  return item.url && !isSafeLinkUrl(item.url)
    ? { ...item, url: undefined }
    : item;
}

export function cleanHarnessResponseArrays(data: HarnessResponseData): void {
  if (data.heroVideoUrl && !isVideoUrl(data.heroVideoUrl)) {
    data.heroVideoUrl = undefined;
  }
  // A hero video without a title has no name in the popout title bar or the
  // now-playing marquee — drop it like the server-side schema does.
  if (data.heroVideoUrl && !data.heroVideoTitle?.trim()) {
    data.heroVideoUrl = undefined;
  }
  if (!data.heroVideoUrl) {
    data.heroVideoTitle = undefined;
    data.heroVideoCaption = undefined;
  }
  data.galleryItems = filterArray(
    data.galleryItems,
    (item) =>
      isMeaningfulString(item.imageUrl) && isTrustedImageUrl(item.imageUrl),
  );
  data.cards = filterArray(
    data.cards,
    (card) => !!(card.title || card.description || card.url),
  )?.map(blankUnsafeLink);
  data.keyFindings = filterArray(data.keyFindings, (finding) =>
    isMeaningfulString(finding.text),
  );
  data.keyPoints = filterArray(data.keyPoints, (point) =>
    isMeaningfulString(point.text),
  );
  data.sources = filterArray(
    data.sources,
    (source) => !!(source.title || source.url),
  )?.map(blankUnsafeLink);
  data.videoGalleryItems = filterArray(
    data.videoGalleryItems,
    (item) => isMeaningfulString(item.videoUrl) && isVideoUrl(item.videoUrl),
  );
  data.relatedStories = filterArray(
    data.relatedStories,
    (story) =>
      !!(story.title || story.url) ||
      (isMeaningfulString(story.imageUrl) && isTrustedImageUrl(story.imageUrl)),
  )?.map(blankUnsafeLink);
  data.internationalCoverage = filterArray(
    data.internationalCoverage,
    (entry) => !!(entry.title || entry.url || entry.summary),
  )?.map(blankUnsafeLink);
  data.strengths = filterArray(data.strengths, (item) =>
    isMeaningfulString(item.text),
  );
  data.weaknesses = filterArray(data.weaknesses, (item) =>
    isMeaningfulString(item.text),
  );
  data.recommendations = filterArray(data.recommendations, (item) =>
    isMeaningfulString(item.text),
  );
  data.pros = filterArray(data.pros, (item) => isMeaningfulString(item.text));
  data.cons = filterArray(data.cons, (item) => isMeaningfulString(item.text));
  data.reviewSummary = filterArray(data.reviewSummary, (item) =>
    isMeaningfulString(item.text),
  );
  data.shopOffers = filterArray(
    data.shopOffers,
    (offer) => isMeaningfulString(offer.link) && isSafeLinkUrl(offer.link!),
  );
  data.statHighlights = filterArray(
    data.statHighlights,
    (stat) => isMeaningfulString(stat.label) && isMeaningfulString(stat.value),
  );
}

function filterArray<T>(
  value: T[] | undefined,
  predicate: (item: T) => boolean,
): T[] | undefined {
  if (!Array.isArray(value)) return value;
  return value.filter(predicate);
}
