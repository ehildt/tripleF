import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { isMeaningfulString } from './is-meaningful-string.helper';
import { isTrustedImageUrl } from './is-trusted-image-url.helper';
import { isVideoUrl } from './is-video-url.helper';

export function cleanHarnessResponseArrays(data: HarnessResponseData): void {
  data.galleryItems = filterArray(
    data.galleryItems,
    (item) =>
      isMeaningfulString(item.imageUrl) && isTrustedImageUrl(item.imageUrl),
  );
  data.cards = filterArray(
    data.cards,
    (card) => !!(card.title || card.description || card.url),
  );
  data.keyFindings = filterArray(data.keyFindings, (finding) =>
    isMeaningfulString(finding.text),
  );
  data.keyPoints = filterArray(data.keyPoints, (point) =>
    isMeaningfulString(point.text),
  );
  data.sources = filterArray(
    data.sources,
    (source) => !!(source.title || source.url),
  );
  data.videoGalleryItems = filterArray(
    data.videoGalleryItems,
    (item) => isMeaningfulString(item.videoUrl) && isVideoUrl(item.videoUrl),
  );
  data.relatedStories = filterArray(
    data.relatedStories,
    (story) =>
      !!(story.title || story.url) ||
      (isMeaningfulString(story.imageUrl) && isTrustedImageUrl(story.imageUrl)),
  );
  data.strengths = filterArray(data.strengths, (item) =>
    isMeaningfulString(item.text),
  );
  data.weaknesses = filterArray(data.weaknesses, (item) =>
    isMeaningfulString(item.text),
  );
  data.recommendations = filterArray(data.recommendations, (item) =>
    isMeaningfulString(item.text),
  );
}

function filterArray<T>(
  value: T[] | undefined,
  predicate: (item: T) => boolean,
): T[] | undefined {
  if (!Array.isArray(value)) return value;
  return value.filter(predicate);
}
