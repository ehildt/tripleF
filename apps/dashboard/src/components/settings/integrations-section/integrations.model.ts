import {
  Clapperboard,
  Globe,
  ListFilter,
  type LucideIcon,
  Search,
  TrendingUp,
} from '@lucide/vue';

import type { ProviderOverridesSnapshot } from '../settings-config.model';

/**
 * The IntegrationId identifies one tile in the integrations grid. Provider
 * ids match their ProviderOverridesSnapshot section so the tile can read
 * `enabled`/credentials straight from the config snapshot.
 */
export type IntegrationId =
  'serper' | 'brightData' | 'youtube' | 'eodhd' | 'sources';

export interface IntegrationMeta {
  id: IntegrationId;
  /** i18n key for the tile name and the drawer title. */
  nameKey: string;
  /** i18n key for the one-line tile description. */
  descriptionKey: string;
  /** i18n key for the quick-toggle tooltip (toggleable tiles only). */
  toggleTitleKey?: string;
  icon: LucideIcon;
  /** Whether the integration can be switched on/off (sources cannot). */
  toggleable: boolean;
  /** Whether usable credentials exist — drives the quick-toggle gating. */
  isConfigured: (config: ProviderOverridesSnapshot) => boolean;
}

/**
 * The integration registry. Adding a provider means one entry here plus a
 * section component mounted in the IntegrationsSection drawer.
 */
export const INTEGRATIONS: readonly IntegrationMeta[] = [
  {
    id: 'serper',
    nameKey: 'common.serperApi',
    descriptionKey: 'common.integrationSerperDesc',
    toggleTitleKey: 'common.enableSerper',
    icon: Search,
    toggleable: true,
    isConfigured: (config) => !!config.serper?.apiKey,
  },
  {
    id: 'brightData',
    nameKey: 'common.brightData',
    descriptionKey: 'common.integrationBrightDataDesc',
    toggleTitleKey: 'common.enableBrightData',
    icon: Globe,
    toggleable: true,
    isConfigured: (config) => !!config.brightData?.apiKey,
  },
  {
    id: 'youtube',
    nameKey: 'common.youtubeApi',
    descriptionKey: 'common.integrationYoutubeDesc',
    toggleTitleKey: 'common.enableYouTube',
    icon: Clapperboard,
    toggleable: true,
    isConfigured: (config) => !!config.youtube?.apiKey,
  },
  {
    id: 'eodhd',
    nameKey: 'common.eodhdApi',
    descriptionKey: 'common.integrationEodhdDesc',
    toggleTitleKey: 'common.enableEodhd',
    icon: TrendingUp,
    toggleable: true,
    isConfigured: (config) => !!config.eodhd?.apiKey,
  },
  {
    id: 'sources',
    nameKey: 'common.sources',
    descriptionKey: 'common.integrationSourcesDesc',
    icon: ListFilter,
    toggleable: false,
    isConfigured: () => true,
  },
];
