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
}
