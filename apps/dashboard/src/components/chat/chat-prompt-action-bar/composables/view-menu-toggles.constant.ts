import {
  Clapperboard,
  Images,
  Key,
  Languages,
  Link,
  type LucideIcon,
} from '@lucide/vue';

import type { CollapsibleSectionKey } from '@/types/harness-response-data.model';

/** One response-section toggle: its section type, icon, and label key. */
type SectionToggleConfig = {
  /** Response-content section this toggle hides or shows. */
  key: CollapsibleSectionKey;
  /** Leading icon rendered in the view menu. */
  icon: LucideIcon;
  /** i18n key for the section name, interpolated into the title. */
  labelKey: string;
};

/** One media presentation toggle: its section, media type, and icon. */
type PresentationToggleConfig = {
  /** Media section this toggle switches between gallery and list. */
  key: 'gallery' | 'videoGallery';
  /** Media kind the section presents. */
  media: 'image' | 'video';
  /** Leading icon rendered in the view menu. */
  icon: LucideIcon;
};

/** Gallery/list title keys for one media type. */
type PresentationSwitchKeyPair = {
  /** i18n key for the title shown when switching to gallery. */
  toGallery: string;
  /** i18n key for the title shown when switching to list. */
  toList: string;
};

/** Gallery/list switch keys per media type. */
type PresentationSwitchKeys = Record<
  'image' | 'video',
  PresentationSwitchKeyPair
>;

/**
 * Response-content section types the blue menu can collapse/expand. The media
 * sections (gallery, videoGallery) are not here — they switch presentations
 * instead of hiding.
 */
export const SECTION_TOGGLES: SectionToggleConfig[] = [
  { key: 'sources', icon: Link, labelKey: 'common.sources' },
  { key: 'keyFindings', icon: Key, labelKey: 'common.keyFindings' },
  {
    key: 'internationalCoverage',
    icon: Languages,
    labelKey: 'common.internationalCoverage',
  },
];

/** Media section types the blue menu switches between gallery/list. */
export const PRESENTATION_TOGGLES: PresentationToggleConfig[] = [
  { key: 'gallery', media: 'image', icon: Images },
  { key: 'videoGallery', media: 'video', icon: Clapperboard },
];

/** Localized switch keys per media type — gallery and list labels. */
export const PRESENTATION_SWITCH_KEYS: PresentationSwitchKeys = {
  image: {
    toGallery: 'common.switchToImageGallery',
    toList: 'common.switchToImageList',
  },
  video: {
    toGallery: 'common.switchToVideoGallery',
    toList: 'common.switchToVideoList',
  },
};
