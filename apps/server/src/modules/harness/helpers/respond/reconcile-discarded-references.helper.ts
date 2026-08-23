/** An entry from the model's `discardedReferences` output field. */
type DiscardedReferenceEntry = {
  type?: unknown;
  imageUrl?: unknown;
  url?: unknown;
  title?: unknown;
  reason?: unknown;
};

/** A cloud reference candidate the pipeline actually surfaced to the model. */
interface CloudCandidateRef {
  imageUrl: string;
  title?: string;
}

type ReconcileDiscardsResult = {
  data: Record<string, unknown> | undefined;
  removedGalleryCount: number;
  removedSourceCount: number;
  droppedDiscardCount: number;
  complementedCount: number;
};

function isDiscardableImage(
  entry: DiscardedReferenceEntry,
  cloudUrlSet: Set<string>,
): boolean {
  return (
    entry.type === 'image' &&
    typeof entry.imageUrl === 'string' &&
    cloudUrlSet.has(entry.imageUrl)
  );
}

function isDiscardableLink(entry: DiscardedReferenceEntry): boolean {
  return (
    entry.type === 'link' &&
    typeof entry.url === 'string' &&
    /^https?:\/\//.test(entry.url)
  );
}

function imageUrlOf(item: unknown): string {
  return ((item ?? {}) as { imageUrl?: string }).imageUrl ?? '';
}

function urlOf(item: unknown): string {
  return ((item ?? {}) as { url?: string }).url ?? '';
}

function keepValidDiscards(
  discards: unknown,
  cloudUrlSet: Set<string>,
  keptDiscards: DiscardedReferenceEntry[],
  discardedImageUrls: Set<string>,
  discardedLinkUrls: Set<string>,
): number {
  if (!Array.isArray(discards)) return 0;
  let dropped = 0;
  for (const rawEntry of discards) {
    const entry = (rawEntry ?? {}) as DiscardedReferenceEntry;
    if (isDiscardableImage(entry, cloudUrlSet)) {
      keptDiscards.push(entry);
      discardedImageUrls.add(entry.imageUrl as string);
    } else if (isDiscardableLink(entry)) {
      keptDiscards.push(entry);
      discardedLinkUrls.add(entry.url as string);
    } else {
      dropped++;
    }
  }
  return dropped;
}

/**
 * Append candidates the model neither used nor explicitly discarded as
 * reason-less complement entries — deterministic bookkeeping so the UI
 * numbers add up (gallery + aside = the offered pool), labelled client-side.
 */
function complementUnaccountedCandidates(
  cloudByUrl: Map<string, CloudCandidateRef>,
  galleryUrls: Set<string>,
  discardedImageUrls: Set<string>,
  keptDiscards: DiscardedReferenceEntry[],
): number {
  let complemented = 0;
  for (const [url, candidate] of cloudByUrl) {
    if (galleryUrls.has(url) || discardedImageUrls.has(url)) continue;
    keptDiscards.push({
      type: 'image',
      imageUrl: url,
      title: candidate.title ?? url,
    });
    discardedImageUrls.add(url);
    complemented++;
  }
  return complemented;
}

/** Strip discard-verdict URLs from the used-media fields of the output. */
function applyDiscardVerdicts(
  next: Record<string, unknown>,
  originalGallery: unknown[] | undefined,
  discardedImageUrls: Set<string>,
  discardedLinkUrls: Set<string>,
): { removedGalleryCount: number; removedSourceCount: number } {
  let removedGalleryCount = 0;
  let removedSourceCount = 0;

  if (originalGallery) {
    const galleryItems = originalGallery.filter(
      (item) => !discardedImageUrls.has(imageUrlOf(item)),
    );
    next.galleryItems = galleryItems;
    removedGalleryCount = originalGallery.length - galleryItems.length;
  }

  const originalSources = Array.isArray(next.sources)
    ? (next.sources as unknown[])
    : undefined;
  if (originalSources) {
    const sources = originalSources.filter(
      (item) => !discardedLinkUrls.has(urlOf(item)),
    );
    next.sources = sources;
    removedSourceCount = originalSources.length - sources.length;
  }

  return { removedGalleryCount, removedSourceCount };
}

/**
 * Reconcile the model's discardedReferences verdict with the rest of the
 * output:
 * - only references the pipeline actually provided may be discarded — image
 *   entries must name an available cloud candidate (uploaded user images can
 *   never be discarded), link entries must be absolute URLs;
 * - a reference must not appear as both used and discarded — the discard
 *   verdict wins and the URL leaves galleryItems/sources;
 * - with `enforceFullCoverage` (image tasks), every cloud candidate must be
 *   accounted for exactly once: candidates missing from both galleryItems
 *   and discardedReferences are appended as complement discards, carrying no
 *   model-authored reason.
 * Entries failing the membership checks are fabrications and are dropped.
 */
export function reconcileDiscardedReferences(
  data: Record<string, unknown> | undefined,
  cloudCandidates: CloudCandidateRef[],
  enforceFullCoverage = false,
): ReconcileDiscardsResult {
  const base = {
    data,
    removedGalleryCount: 0,
    removedSourceCount: 0,
    droppedDiscardCount: 0,
    complementedCount: 0,
  };

  const cloudByUrl = new Map(cloudCandidates.map((c) => [c.imageUrl, c]));
  const cloudUrlSet = new Set(cloudByUrl.keys());
  const originalGallery = Array.isArray(data?.galleryItems)
    ? (data.galleryItems as unknown[])
    : undefined;
  const galleryUrls = new Set((originalGallery ?? []).map(imageUrlOf));

  const keptDiscards: DiscardedReferenceEntry[] = [];
  const discardedImageUrls = new Set<string>();
  const discardedLinkUrls = new Set<string>();
  const droppedDiscardCount = keepValidDiscards(
    data?.discardedReferences,
    cloudUrlSet,
    keptDiscards,
    discardedImageUrls,
    discardedLinkUrls,
  );
  const complementedCount = enforceFullCoverage
    ? complementUnaccountedCandidates(
        cloudByUrl,
        galleryUrls,
        discardedImageUrls,
        keptDiscards,
      )
    : 0;

  const untouched =
    droppedDiscardCount === 0 &&
    discardedImageUrls.size === 0 &&
    discardedLinkUrls.size === 0 &&
    complementedCount === 0;
  if (!data || untouched) return base;

  const next: Record<string, unknown> = { ...data };
  const { removedGalleryCount, removedSourceCount } = applyDiscardVerdicts(
    next,
    originalGallery,
    discardedImageUrls,
    discardedLinkUrls,
  );
  if (keptDiscards.length > 0) next.discardedReferences = keptDiscards;
  else delete next.discardedReferences;

  return {
    data: next,
    removedGalleryCount,
    removedSourceCount,
    droppedDiscardCount,
    complementedCount,
  };
}
