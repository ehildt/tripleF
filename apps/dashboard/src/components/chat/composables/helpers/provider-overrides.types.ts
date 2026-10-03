/** One toggleable source/endpoint inside a provider override. */
export interface ProviderSourceEndpoint {
  enabled?: boolean;
  [key: string]: unknown;
}

/**
 * One provider's override entry: the `enabled` kill switch, the masked
 * `apiKey`, and any toggleable sources. The index signature keeps source
 * discovery generic so engines added server-side surface automatically.
 */
export interface ProviderOverrideEntry {
  enabled?: boolean;
  apiKey?: string;
  [source: string]: unknown;
}

/**
 * The masked provider-overrides snapshot served by
 * `/api/v1/provider-overrides`; also holds the non-provider `sources` section.
 */
export type ProviderOverrides = Record<string, ProviderOverrideEntry>;

/** Session-persisted per-provider overrides patch; providers may be absent. */
export type ProviderSessionOverrides = Record<
  string,
  Partial<ProviderOverrideEntry> | undefined
>;

/** One accumulated source tag: its key and effective enabled state. */
export interface SearchSourceToggle {
  key: string;
  enabled: boolean;
}
