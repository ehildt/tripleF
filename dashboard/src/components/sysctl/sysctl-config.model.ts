export interface EndpointConfig {
  enabled: boolean;
  results: number;
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
}

export interface YouTubeConfig {
  enabled: boolean;
  apiKey?: string;
  videos: EndpointConfig;
}

export interface SourcesConfig {
  preferred: string[];
  blocked: string[];
}

/**
 * The Ollama connection (host + API key), served by /api/v1/ollama-overrides
 * with the key masked — same override contract as the Serper provider.
 */
export interface OllamaConnectionConfig {
  host: string;
  apiKey?: string;
}

export type ProviderKey = 'serper' | 'brightData' | 'ollama' | 'youtube';

/** Resettable top-level config sections (provider or the sources list). */
export type ConfigSectionKey = ProviderKey | 'sources';

export type ProviderConfig = SerperConfig | BrightDataConfig | YouTubeConfig;

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
  brightData: BrightDataConfig;
  sources: SourcesConfig;
  ollama: OllamaConnectionConfig;
  youtube: YouTubeConfig;
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
