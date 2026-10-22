import type { LucideIcon } from '@lucide/vue';

/** One tab in a MenuTabs row. */
export interface MenuTabItem {
  id: string;
  label: string;
  /**
   * Icon shown as the tab's content. When omitted, the label renders as
   * inline text instead.
   */
  icon?: LucideIcon;
  /**
   * Tooltip text shown on hover. Defaults to the label when omitted — set
   * it only when the tooltip should say something more than the label.
   */
  tooltip?: string;
  /**
   * Renders the tab grayed out (e.g. a feature whose backing engine is
   * disabled). The tab stays clickable — muted is a hint, not a lock.
   */
  muted?: boolean;
}

export interface MenuTabsProps {
  /** One tab per item. */
  items: MenuTabItem[];
  /** The active tab's id (highlighted in the row). */
  active: string;
  /**
   * Where the tab row lives — `header`: inside the settings panel header
   * bar (the top tab menu); `section`: a standalone strip above section
   * content (sub tab menus, the /memory page).
   */
  variant: 'header' | 'section';
}

export interface MenuTabsEmits {
  /** A tab was clicked. */
  select: [id: string];
}
