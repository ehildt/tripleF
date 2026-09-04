import type { IntegrationMeta } from '../integrations.model';

/** View model for one tile in the integrations grid (i18n resolved). */
export interface IntegrationTileView {
  meta: IntegrationMeta;
  name: string;
  description: string;
  /** Toggle state; null for non-toggleable entries (sources). */
  enabled: boolean | null;
  /** Whether credentials exist — drives the toggle's off-state color. */
  configured: boolean;
  toggleTitle?: string;
  /** Accessible name of the tile body button ("Open X configuration"). */
  openLabel: string;
}
