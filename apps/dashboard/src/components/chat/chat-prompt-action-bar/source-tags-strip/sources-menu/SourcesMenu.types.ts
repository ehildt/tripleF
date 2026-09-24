import type { LucideIcon } from '@lucide/vue';

/** One search-source toggle rendered in the sources menu. */
export interface SourceTagData {
  key: string;
  enabled: boolean;
  icon: LucideIcon;
  title: string;
}

export interface SourcesMenuProps {
  /** Every toggleable search source (web, images, news, …) + its state. */
  sourceTags: readonly SourceTagData[];
  /** EODHD stock-market engine state: available + enabled. */
  eodhdState?: { available: boolean; enabled: boolean };
  /** Tooltip for the EODHD Landmark toggle. */
  eodhdToggleTitle: string;
  /** Collapsed to its expand arrow (only relevant when not always show). */
  collapsed: boolean;
  /** Pinned open — no collapse arrow, icons always visible. */
  alwaysShow: boolean;
  /** Tooltip/aria-label for the collapse arrow button. */
  toggleTitle: string;
}
