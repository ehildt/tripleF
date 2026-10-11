import {
  FileText,
  Film,
  Globe,
  Image,
  type LucideIcon,
  MapPin,
  Newspaper,
  ShoppingCart,
  Star,
} from '@lucide/vue';

/** Display metadata for one known search source. */
type SearchSourceMetaEntry = {
  /** Leading icon rendered on the source tag. */
  icon: LucideIcon;
  /** Raw label interpolated into the enabled/disabled title. */
  label: string;
};

/** Known search-source metadata, keyed by source key. */
type SearchSourceMeta = Record<string, SearchSourceMetaEntry>;

/**
 * Icon and label per known search source. Unknown sources fall back to the
 * Search icon and their raw key — that fallback lives in `mapSourceTag`.
 */
export const SEARCH_SOURCE_META: SearchSourceMeta = {
  web: { icon: Globe, label: 'web' },
  images: { icon: Image, label: 'images' },
  news: { icon: Newspaper, label: 'news' },
  shopping: { icon: ShoppingCart, label: 'shopping' },
  webpageFetch: { icon: FileText, label: 'fetch' },
  places: { icon: MapPin, label: 'places' },
  videos: { icon: Film, label: 'videos' },
  reviews: { icon: Star, label: 'reviews' },
};
