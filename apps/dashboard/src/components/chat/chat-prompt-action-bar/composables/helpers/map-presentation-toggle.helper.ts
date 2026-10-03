import type { LucideIcon } from '@lucide/vue';

import type {
  MediaPresentation,
  MediaPresentations,
} from '@/types/harness-response-data.model';

/** A media presentation toggle: its section, media type, and leading icon. */
type PresentationToggleConfig = {
  key: 'gallery' | 'videoGallery';
  media: 'image' | 'video';
  icon: LucideIcon;
};

/** Gallery/list switch keys per media type. */
type PresentationSwitchKeys = Record<
  'image' | 'video',
  { toGallery: string; toList: string }
>;

/** A resolved presentation toggle, ready for the caller to translate. */
type PresentationToggleData = {
  key: 'gallery' | 'videoGallery';
  media: 'image' | 'video';
  icon: LucideIcon;
  presentation: MediaPresentation;
  titleKey: string;
};

/** Build one media presentation toggle: resolve the active presentation and
 * pick the gallery/list switch key. Translation happens in the caller. */
export function mapPresentationToggle(
  config: PresentationToggleConfig,
  mediaPresentations: MediaPresentations,
  switchKeys: PresentationSwitchKeys,
): PresentationToggleData {
  const { key, media, icon } = config;
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
    titleKey: switchKey,
  };
}
