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
  webpageFetch: { enabled: boolean };
}

export interface SourcesConfig {
  preferred: string[];
  blocked: string[];
}

export type ProviderKey = 'serper';

/** Resettable top-level config sections (provider or the sources list). */
export type ConfigSectionKey = ProviderKey | 'sources';

export type ProviderConfig = SerperConfig;

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
  sources: SourcesConfig;
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
