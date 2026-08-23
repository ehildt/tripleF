import type { UploadedImage } from '../../conversation.model';

/**
 * Merge newly uploaded images into the conversation's existing entries.
 * Entries are deduplicated by `hash + conversationId` and the first
 * occurrence (the stored entry) is kept: its selection state always wins,
 * and a cloud source wins over previously stored or default metadata.
 * `conversationId` is the resolved backend conversation id used for
 * entries that don't carry one.
 */
export function mergeUploadedImages(
  existingImages: UploadedImage[],
  incomingImages: UploadedImage[],
  conversationId: string,
): UploadedImage[] {
  const seen = new Set<string>();
  const merged: UploadedImage[] = [];

  for (const img of [...existingImages, ...incomingImages]) {
    const key = `${img.hash}:${img.conversationId ?? conversationId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const existing = existingImages.find(
      (i) =>
        i.hash === img.hash &&
        (i.conversationId ?? conversationId) ===
          (img.conversationId ?? conversationId),
    );
    merged.push({
      ...img,
      conversationId: img.conversationId ?? conversationId,
      selected: existing?.selected ?? img.selected ?? true,
      source:
        img.source === 'cloud'
          ? ('cloud' as const)
          : (existing?.source ?? img.source ?? 'local'),
    });
  }

  return merged;
}
