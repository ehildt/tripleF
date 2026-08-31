import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { isTrustedImageUrl } from '../media/is-trusted-image-url.helper';
import { isVideoUrl } from '../media/is-video-url.helper';
import { mapBodySectionWithCleanedHero } from './helpers/map-body-section-with-cleaned-hero.helper';
import { mapSubjectWithCleanedLists } from './helpers/map-subject-with-cleaned-lists.helper';
import { isMeaningfulString } from './is-meaningful-string.helper';

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
  data.sources = filterArray(
    data.sources,
    (source) => !!(source.title || source.url),
  )?.map(blankUnsafeLink);
  data.videoGalleryItems = filterArray(
    data.videoGalleryItems,
    (item) => isMeaningfulString(item.videoUrl) && isVideoUrl(item.videoUrl),
  );
  // Related-story cards are designed to hold an image — a card without a
  // valid, trusted thumbnail renders as an empty placeholder box. Drop it so
  // the section only ever shows image-backed cards.
  data.relatedStories = filterArray(
    data.relatedStories,
    (story) =>
      isMeaningfulString(story.imageUrl) &&
      isTrustedImageUrl(story.imageUrl) &&
      !!(story.title || story.url),
  )?.map(blankUnsafeLink);
  data.internationalCoverage = filterArray(
    data.internationalCoverage,
    (entry) => !!(entry.title || entry.url || entry.summary),
  )?.map(blankUnsafeLink);
  cleanTextLists(data);
  // Evaluation subject profiles: a profile without a name has no anchor for
  // its header or the comparison matrix column — drop it.
  data.subjects = filterArray(data.subjects, (subject) =>
    isMeaningfulString(subject.name),
  )?.map((subject) => mapSubjectWithCleanedLists(subject, filterArray));
  // Merge topic blocks: each snippet list gets the same empty-text
  // treatment as the top-level assessment lists, and the per-topic hero
  // follows the top-level hero rules (invalid video URL dropped, video hero
  // without title dropped, untrusted image URL dropped). A block left with
  // no content after cleaning drops with the rest.
  data.bodySections = data.bodySections
    ?.map((section) => mapBodySectionWithCleanedHero(section, filterArray))
    .filter(
      (section) =>
        isMeaningfulString(section.topic) ||
        isMeaningfulString(section.content) ||
        isMeaningfulString(section.heroImageUrl) ||
        isMeaningfulString(section.heroVideoUrl) ||
        (section.strengths?.length ?? 0) > 0 ||
        (section.weaknesses?.length ?? 0) > 0 ||
        (section.recommendations?.length ?? 0) > 0,
    );
  if (data.comparison?.criteria) {
    data.comparison = {
      ...data.comparison,
      criteria: filterArray(data.comparison.criteria, (criterion) =>
        isMeaningfulString(criterion.name),
      ),
    };
  }
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

/**
 * The `{ text }` list fields (keyFindings, keyPoints, strengths, weaknesses,
 * recommendations, pros, cons) all carry the same shape and get the same
 * treatment: drop entries without meaningful text.
 */
const TEXT_LIST_FIELDS = [
  'keyFindings',
  'keyPoints',
  'strengths',
  'weaknesses',
  'recommendations',
  'pros',
  'cons',
] as const;

function cleanTextLists(data: HarnessResponseData): void {
  for (const field of TEXT_LIST_FIELDS) {
    data[field] = filterArray(data[field], (item) =>
      isMeaningfulString(item.text),
    );
  }
}
