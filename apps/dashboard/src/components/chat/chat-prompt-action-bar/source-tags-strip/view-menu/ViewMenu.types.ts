import type { LucideIcon } from '@lucide/vue';

import type { ScrollMode } from '@/types/app.model';
import type {
  CollapsibleSectionKey,
  MediaPresentation,
} from '@/types/harness-response-data.model';

/** One response-section hide/show toggle rendered in the view menu. */
export interface SectionToggleData {
  key: CollapsibleSectionKey;
  icon: LucideIcon;
  /** True when the section is hidden from responses. */
  hidden: boolean;
  /** Localized hide/show tooltip, e.g. "Hide Sources". */
  title: string;
}

/** One media presentation-switch toggle rendered in the view menu. */
export interface PresentationToggleData {
  /** Response media section the toggle drives. */
  key: 'gallery' | 'videoGallery';
  /** Media type whose presentation the toggle flips. */
  media: 'image' | 'video';
  icon: LucideIcon;
  /** Active presentation; the button's pressed state (gallery = pressed). */
  presentation: MediaPresentation;
  /** Localized switch tooltip, e.g. "Switch to image list". */
  title: string;
}

export interface ViewMenuProps {
  scrollMode: ScrollMode;
  /** Tooltip for the scroll-mode toggle. */
  scrollModeTitle: string;
  /** One hide/show toggle per collapsible response section type. */
  sectionToggles: readonly SectionToggleData[];
  /** One presentation-switch toggle per media section type. */
  presentationToggles: readonly PresentationToggleData[];
  /** Collapsed to its expand arrow (only relevant when not always show). */
  collapsed: boolean;
  /** Pinned open — no collapse arrow, icons always visible. */
  alwaysShow: boolean;
  /** Tooltip/aria-label for the collapse arrow button. */
  toggleTitle: string;
}
