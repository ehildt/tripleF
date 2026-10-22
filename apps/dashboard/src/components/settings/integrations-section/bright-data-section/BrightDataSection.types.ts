import type { BrightDataConfig } from '../../settings-config.model';

export interface BrightDataSectionProps {
  /** The provider's persisted configuration (API key, zones, endpoints). */
  config: BrightDataConfig;
  /** Persist a new API key; resolves whether the save succeeded. */
  updateApiKey: (apiKey: string) => Promise<boolean>;
  /** Per-endpoint result cap wired onto each number field (top-3 ranked
   *  endpoints, wider media caps). */
  endpointMaxResults: Record<string, number>;
}

export interface BrightDataSectionEmits {
  /** Toggle one of the provider's endpoints on or off. */
  toggleEndpoint: [name: string];
  /** Update an endpoint's result limit. */
  updateResults: [payload: { name: string; value: string }];
  /** Reset the provider to its default configuration. */
  reset: [];
  /** Change one of the provider's zone names. */
  zoneChange: [payload: { zone: 'serpZone' | 'unlockerZone'; value: string }];
}
