import type { LucideIcon } from '@lucide/vue';

import type { MediaPresentations } from '@/types/harness-response-data.model';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** Build one media presentation toggle from its config. */
export function mapPresentationToggle(
  {
    key,
    media,
    icon,
  }: {
    key: 'gallery' | 'videoGallery';
    media: 'image' | 'video';
    icon: LucideIcon;
  },
  mediaPresentations: MediaPresentations,
  switchKeys: Record<'image' | 'video', { toGallery: string; toList: string }>,
  t: Translate,
) {
  const presentation = mediaPresentations[media];
  const switchKey =
    presentation === 'gallery'
      ? switchKeys[media].toList
      : switchKeys[media].toGallery;
  return {
    key,
    media,
    icon,
    presentation,
    title: t(switchKey),
  };
}
