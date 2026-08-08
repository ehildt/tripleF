export interface EndpointConfig {
  enabled: boolean;
  results: number;
}

export interface SerperCapabilities {
  remainingCredits?: number;
  rateLimit?: number;
  checkedAt?: string;
}

export interface SerperConfig {
  enabled: boolean;
  apiKey?: string;
  web: EndpointConfig;
  images: EndpointConfig;
  news: EndpointConfig;
  places: EndpointConfig;
  shopping: EndpointConfig;
  reviews: EndpointConfig;
  videos: EndpointConfig;
  scrape: { enabled: boolean };
  capabilities?: SerperCapabilities;
}

export interface BrightDataCapabilities {
  status?: string;
  customer?: string;
  canMakeRequests?: boolean;
  authFailReason?: string;
  balance?: number;
  credit?: number;
  prepayment?: number;
  pendingCosts?: number;
  balanceError?: string;
  checkedAt?: string;
}

export interface BrightDataConfig {
  enabled: boolean;
  apiKey?: string;
  serpZone?: string;
  unlockerZone?: string;
  web: EndpointConfig;
  images: EndpointConfig;
  news: EndpointConfig;
  places: EndpointConfig;
  shopping: EndpointConfig;
  videos: EndpointConfig;
  scrape: { enabled: boolean };
  capabilities?: BrightDataCapabilities;
}

export interface YouTubeConfig {
  enabled: boolean;
  apiKey?: string;
  videos: EndpointConfig;
}

export interface EodhdCapabilities {
  plan?: string;
  subscriptionType?: string;
  name?: string;
  email?: string;
  /** API calls used on the latest active day. */
  apiRequests?: number;
  apiRequestsDate?: string;
  dailyRateLimit?: number;
  extraLimit?: number;
  endpoints: {
    search: boolean;
    quote: boolean;
    history: boolean;
    technical: boolean;
    intraday: boolean;
    news: boolean;
    fundamentals: boolean;
  };
  checkedAt?: string;
}

export interface EodhdConfig {
  enabled: boolean;
  apiKey?: string;
  search: EndpointConfig;
  quote: EndpointConfig;
  history: EndpointConfig;
  technical: EndpointConfig;
  intraday: EndpointConfig;
  news: EndpointConfig;
  fundamentals: EndpointConfig;
  /** Plan + active-source info discovered from the API key. */
  capabilities?: EodhdCapabilities;
}

export interface SourcesConfig {
  preferred: string[];
  blocked: string[];
}

/**
 * Which art-direction layouts the response model may compose
 * news/article/evaluation answers with. All four default to enabled.
 */
export interface LayoutsConfig {
  classic: boolean;
  editorial: boolean;
  split: boolean;
  mosaic: boolean;
}

/**
 * The Ollama connection (host + API key), served by /api/v1/ollama-overrides
 * with the key masked — same override contract as the Serper provider.
 */
export interface OllamaConnectionConfig {
  host: string;
  apiKey?: string;
}

export type ProviderKey =
  'serper' | 'brightData' | 'ollama' | 'youtube' | 'eodhd';

/** Resettable top-level config sections (provider, the sources list, or the layouts set). */
export type ConfigSectionKey = ProviderKey | 'sources' | 'layouts';

export type ProviderConfig =
  SerperConfig | BrightDataConfig | YouTubeConfig | EodhdConfig;

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
  brightData: BrightDataConfig;
  sources: SourcesConfig;
  layouts: LayoutsConfig;
  ollama: OllamaConnectionConfig;
  youtube: YouTubeConfig;
  eodhd: EodhdConfig;
}

export function hasEndpointResults(
  value: unknown,
): value is { enabled: boolean; results: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'enabled' in value &&
    'results' in value &&
    typeof (value as { results: unknown }).results === 'number'
  );
}
