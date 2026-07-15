import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { formatViewCount } from './format-view-count.helper';

/**
 * Join the available video metadata into one muted meta line, e.g.
 * "SoundGuys · 9:55 · 1.2M views · Dec 23, 2025". Missing fields are skipped.
 */
export function buildVideoMetaLine(item: VideoGalleryItem): string {
  const parts: string[] = [];

  if (item.channel) parts.push(item.channel);
  if (item.duration) parts.push(item.duration);
  if (item.views) parts.push(`${formatViewCount(item.views)} views`);
  if (item.date) parts.push(item.date);

  return parts.join(' · ');
}
