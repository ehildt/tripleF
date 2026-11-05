type ToolEndpointConfig = {
  /** Whether this provider endpoint may be offered to the classifier. */
  enabled: boolean;
};

type ToolProviderSettings = {
  /** Whether the provider itself is enabled. */
  enabled: boolean;
  /** Credential required to execute the provider's tools. */
  apiKey?: string;
};

/** Provider settings that determine which grounding tools the classifier may select. */
export type ToolProviderConfig = {
  /** Serper search and scrape endpoint settings. */
  serper: ToolProviderSettings &
    Record<
      | 'web'
      | 'images'
      | 'news'
      | 'places'
      | 'shopping'
      | 'reviews'
      | 'videos'
      | 'scrape',
      ToolEndpointConfig
    >;
  /** YouTube video-search endpoint settings. */
  youtube: ToolProviderSettings & Record<'videos', ToolEndpointConfig>;
  /** Bright Data search and scrape endpoint settings. */
  brightData: ToolProviderSettings &
    Record<
      'web' | 'images' | 'news' | 'places' | 'shopping' | 'videos' | 'scrape',
      ToolEndpointConfig
    >;
  /** EODHD market-data endpoint settings. */
  eodhd: ToolProviderSettings &
    Record<
      | 'search'
      | 'quote'
      | 'history'
      | 'technical'
      | 'intraday'
      | 'news'
      | 'fundamentals',
      ToolEndpointConfig
    >;
};
