import type { MediaPresentations } from '@/types/assistant-response-data.model';

import { DEFAULT_MEDIA_PRESENTATIONS } from '../assistant-response-settings.constant';

/** Parse image/video presentation preferences over their defaults. */
export function parseMediaPresentations(
  raw: string | null,
): MediaPresentations {
  const presentations = { ...DEFAULT_MEDIA_PRESENTATIONS };
  if (!raw) return presentations;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return presentations;
    }
    const saved = parsed as Record<string, unknown>;
    if (saved.image === 'gallery' || saved.image === 'list') {
      presentations.image = saved.image;
    }
    if (saved.video === 'gallery' || saved.video === 'list') {
      presentations.video = saved.video;
    }
    return presentations;
  } catch {
    return presentations;
  }
}
