import type { LucideIcon } from '@lucide/vue';

export interface SubMenuItem {
  id: string;
  label: string;
  /** Icon shown inline before the label (optional). */
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
