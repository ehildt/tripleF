/**
 * Tool-facing provider config shapes. The server's provider-overrides config
 * satisfies these structurally, so the tools stay decoupled from app config.
 */

export interface ProviderEndpointConfig {
  enabled: boolean;
  results: number;
}

export interface SerperConfig {
  enabled: boolean;
  apiKey?: string;
  web: ProviderEndpointConfig;
  images: ProviderEndpointConfig;
  news: ProviderEndpointConfig;
  places: ProviderEndpointConfig;
  shopping: ProviderEndpointConfig;
  reviews: ProviderEndpointConfig;
  videos: ProviderEndpointConfig;
  scrape: { enabled: boolean };
}

export interface BrightDataConfig {
  enabled: boolean;
  apiKey?: string;
  serpZone?: string;
  unlockerZone?: string;
  web: ProviderEndpointConfig;
  images: ProviderEndpointConfig;
  news: ProviderEndpointConfig;
  places: ProviderEndpointConfig;
  shopping: ProviderEndpointConfig;
  videos: ProviderEndpointConfig;
  scrape: { enabled: boolean };
}

export interface EodhdNewsConfig extends ProviderEndpointConfig {
  /** Optional news-body cap (chars); undefined/0 = uncapped. */
  snippetChars?: number;
}

export interface EodhdConfig {
  enabled: boolean;
  apiKey?: string;
  search: ProviderEndpointConfig;
  quote: ProviderEndpointConfig;
  history: ProviderEndpointConfig;
  technical: ProviderEndpointConfig;
  intraday: ProviderEndpointConfig;
  news: EodhdNewsConfig;
  fundamentals: ProviderEndpointConfig;
}

export interface YoutubeConfig {
  enabled: boolean;
  apiKey?: string;
  videos: ProviderEndpointConfig;
}

export interface SourcesConfig {
  preferred: string[];
  blocked: string[];
  imageTaskReferenceCount: number;
}

export interface ToolConfigSnapshot {
  serper: SerperConfig;
  brightData: BrightDataConfig;
  sources: SourcesConfig;
  youtube: YoutubeConfig;
  eodhd: EodhdConfig;
}
