export interface EndpointConfig {
  enabled: boolean;
  results: number;
}

export interface FetchEndpointConfig {
  enabled: boolean;
  format: 'raw' | 'markdown' | 'json';
  proxies: boolean;
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

export interface BraveConfig {
  enabled: boolean;
  apiKey?: string;
  web: EndpointConfig;
  images: EndpointConfig;
  news: EndpointConfig;
  video: EndpointConfig;
}

export interface SearXNGConfig {
  url?: string;
  enabled: boolean;
  results: number;
}

export interface BrowserBaseConfig {
  enabled: boolean;
  apiKey?: string;
  projectId?: string;
  search: EndpointConfig;
  fetch: FetchEndpointConfig;
}

export type ProviderKey = 'serper' | 'brave' | 'searxng' | 'browserBase';

export type ProviderConfig = SerperConfig | BraveConfig | BrowserBaseConfig;

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
  brave: BraveConfig;
  searxng: SearXNGConfig;
  browserBase: BrowserBaseConfig;
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
