/**
 * Per-provider tool enablement and credentials shape consumed by the
 * server-side tool registry — which providers exist, whether each is
 * enabled, and which capability lanes (search, images, …) are on.
 */
export type ProviderConfig = {
  serper: {
    enabled: boolean;
    apiKey?: string;
    web: { enabled: boolean };
    images: { enabled: boolean };
    news: { enabled: boolean };
    places: { enabled: boolean };
    shopping: { enabled: boolean };
    reviews: { enabled: boolean };
    videos: { enabled: boolean };
    scrape: { enabled: boolean };
  };
  youtube: {
    enabled: boolean;
    apiKey?: string;
    videos: { enabled: boolean };
  };
  brightData: {
    enabled: boolean;
    apiKey?: string;
    web: { enabled: boolean };
    images: { enabled: boolean };
    news: { enabled: boolean };
    places: { enabled: boolean };
    shopping: { enabled: boolean };
    videos: { enabled: boolean };
    scrape: { enabled: boolean };
  };
  eodhd: {
    enabled: boolean;
    apiKey?: string;
    search: { enabled: boolean };
    quote: { enabled: boolean };
    history: { enabled: boolean };
    technical: { enabled: boolean };
    intraday: { enabled: boolean };
    news: { enabled: boolean };
    fundamentals: { enabled: boolean };
  };
  playwright: {
    enabled: boolean;
  };
};
