import type { BrightDataConfig } from '../configs/bright-data-config.adapter.js';
import type { EodhdConfig } from '../configs/eodhd-config.adapter.js';
import type { SerperConfig } from '../configs/serper-config.adapter.js';
import type { SourcesConfig } from '../configs/sources-config.adapter.js';
import type { YoutubeConfig } from '../configs/youtube-config.adapter.js';

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
  brightData: BrightDataConfig;
  sources: SourcesConfig;
  youtube: YoutubeConfig;
  eodhd: EodhdConfig;
}
