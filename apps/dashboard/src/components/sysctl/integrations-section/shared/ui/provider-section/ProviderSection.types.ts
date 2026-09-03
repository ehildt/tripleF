import type { LucideIcon } from '@lucide/vue';

import type { ProviderConfig } from '../../../../sysctl-config.model';

export interface ProviderSectionProps {
  config: ProviderConfig;
  descriptions: Record<string, string>;
  configured: boolean;
  icons?: Record<string, LucideIcon>;
  endpointMaxResults?: Record<string, number>;
  /** Per-endpoint availability (e.g. from a plan's capabilities). When a
   *  key is explicitly `false` the endpoint toggle is locked off; absent
   *  keys stay enabled so unknown availability never blocks a toggle. */
  endpointAvailability?: Record<string, boolean>;
  /** Override the prepend slot's items-per-row (defaults to half the
   *  prepend field count, capped at 5). */
  prependItemsPerRow?: number;
  /** Override the endpoint fields' items-per-row (defaults to half the
   *  endpoint count, capped at 5). */
  itemsPerRow?: number;
}
