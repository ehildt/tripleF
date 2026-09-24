import type { UploadedImage } from '@/stores/conversation';

export interface UploadedImageGroup {
  /** Hash of the source pdf the pages were rendered from. */
  parentHash: string;
  /** Display name of the source pdf. */
  parentName: string;
  /** Page images of the pdf, ordered by page number. */
  pages: UploadedImage[];
  /** True when every page is selected (included in the query). */
  isSelected: boolean;
}

export type GroupedUploadedImageItem =
  | { kind: 'standalone'; image: UploadedImage }
  | { kind: 'gallery'; group: UploadedImageGroup };

/**
 * Partition uploaded images into pdf page groups (images sharing a parent
 * hash) and standalone images, preserving the original insertion order: a
 * gallery appears where its first page was added. Pages within a group are
 * ordered by their 1-based page number.
 */
export function groupUploadedImages(
  images: UploadedImage[],
): GroupedUploadedImageItem[] {
  const galleries = new Map<string, UploadedImageGroup>();
  const items: GroupedUploadedImageItem[] = [];

  for (const image of images) {
    if (!image.parentHash) {
      items.push({ kind: 'standalone', image });
      continue;
    }
    let group = galleries.get(image.parentHash);
    if (!group) {
      group = {
        parentHash: image.parentHash,
        parentName: image.parentName ?? image.name,
        pages: [],
        isSelected: true,
      };
      galleries.set(image.parentHash, group);
      items.push({ kind: 'gallery', group });
    }
    group.pages.push(image);
  }

  for (const item of items) {
    if (item.kind !== 'gallery') continue;
    item.group.pages.sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
    item.group.isSelected = item.group.pages.every((p) => p.selected !== false);
  }

  return items;
}
