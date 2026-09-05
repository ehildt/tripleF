import type { LucideIcon } from '@lucide/vue';

export interface IntegrationTileProps {
  icon: LucideIcon;
  /** Provider name, also used as the drawer title. */
  name: string;
  /** One-line summary shown under the name. */
  description: string;
  /**
   * On/off state for the quick-toggle in the top-right corner. `null`
   * hides the toggle (non-toggleable entries like the sources list).
   */
  enabled: boolean | null;
  /** Whether credentials exist — colors the toggle yellow/red when off. */
  configured: boolean;
  /** Tooltip for the quick-toggle (required when `enabled` is set). */
  toggleTitle?: string;
  /** Accessible name of the clickable tile surface. */
  openLabel: string;
}
