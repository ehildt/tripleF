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
  /**
   * How many web image candidates the pipeline pools for the image-analysis
   * templates (describe/compare/ocr) for the model to verify visually. An
   * explicit count in the user's prompt still wins.
   */
  imageTaskReferenceCount: number;
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

/** Resettable top-level config sections (provider or the sources list). */
export type ConfigSectionKey = ProviderKey | 'sources';

export type ProviderConfig =
  SerperConfig | BrightDataConfig | YouTubeConfig | EodhdConfig;

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
  brightData: BrightDataConfig;
  sources: SourcesConfig;
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
