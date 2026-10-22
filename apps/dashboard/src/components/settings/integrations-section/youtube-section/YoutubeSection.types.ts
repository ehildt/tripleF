import type { YouTubeConfig } from '../../settings-config.model';

export interface YoutubeSectionProps {
  /** The provider's persisted configuration (API key, endpoints, limits). */
  config: YouTubeConfig;
  /** Persist a new API key; resolves whether the save succeeded. */
  updateApiKey: (apiKey: string) => Promise<boolean>;
}

export interface YoutubeSectionEmits {
  /** Toggle one of the provider's endpoints on or off. */
  toggleEndpoint: [name: string];
  /** Update an endpoint's result limit. */
  updateResults: [payload: { name: string; value: string }];
  /** Reset the provider to its default configuration. */
  reset: [];
}
