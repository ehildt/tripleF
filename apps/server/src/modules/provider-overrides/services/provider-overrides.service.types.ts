import type { BrightDataConfig } from '../configs/bright-data-config.adapter.js';
import type { EodhdConfig } from '../configs/eodhd-config.adapter.js';
import type { SerperConfig } from '../configs/serper-config.adapter.js';
import type { SourcesConfig } from '../configs/sources-config.adapter.js';
import type { YoutubeConfig } from '../configs/youtube-config.adapter.js';

import type { BrightDataCapabilities } from './brightdata-discovery.service.types.js';
import type { EodhdCapabilities } from './eodhd-discovery.service.types.js';
import type { SerperCapabilities } from './serper-discovery.service.types.js';

/** The effective provider-overrides configuration the service holds in memory. */
export interface ProviderOverridesSnapshot {
  /** Serper override config. */
  serper: SerperConfig;
  /** BrightData override config. */
  brightData: BrightDataConfig;
  /** Search-source overrides. */
  sources: SourcesConfig;
  /** YouTube override config. */
  youtube: YoutubeConfig;
  /** EODHD override config. */
  eodhd: EodhdConfig;
}

/** The stored snapshot with secrets masked and live-discovered provider capabilities merged in. */
export interface ProviderOverridesMaskedSnapshot extends Omit<
  ProviderOverridesSnapshot,
  'serper' | 'brightData' | 'eodhd'
> {
  /** Serper config with the key masked and discovered capabilities attached. */
  serper: SerperConfig & { capabilities?: SerperCapabilities };
  /** BrightData config with the key masked and discovered capabilities attached. */
  brightData: BrightDataConfig & { capabilities?: BrightDataCapabilities };
  /** EODHD config with the key masked and discovered capabilities attached. */
  eodhd: EodhdConfig & { capabilities?: EodhdCapabilities };
}
