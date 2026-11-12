import type { ExtractedArticle } from '../helpers/media/extract-articles-from-tools.types.js';
import type {
  ExtractedImageItem,
  ExtractedVideoItem,
} from '../helpers/media/extract-media-from-tools.types.js';
import type { ExtractedPlace } from '../helpers/media/extract-places.types.js';
import type { ExtractedReview } from '../helpers/media/extract-reviews.types.js';
import type { ExtractedShopOffer } from '../helpers/media/extract-shop-offers.types.js';

/** Accounting for the encyclopedia's current-turn passage selection. */
interface ReferenceSelectionSummary {
  /** Number of candidate chunks considered by the selector. */
  considered: number;
  /** Number of passages selected for the response context. */
  selected: number;
}

/** One verbatim passage recalled from a previously indexed source. */
interface EncyclopediaPassage {
  /** Source URL when the indexed document provided one. */
  url?: string;
  /** Source title when known. */
  title?: string;
  /** Verbatim selected passage. */
  content: string;
  /** Whether the passage came from a fetched document or a search-result snippet. */
  sourceType?: 'content' | 'result';
}

/** Source-policy-approved media, citations, and supplemental context for final message assembly. */
export interface SourceContextResult {
  /** Image candidates remaining after preferred/blocked source policy is applied. */
  images: ExtractedImageItem[];
  /** Primary-language videos remaining after source policy and language partitioning. */
  videos: ExtractedVideoItem[];
  /** Primary-language articles used as current-turn factual context. */
  articles: ExtractedArticle[];
  /** Budget-normalized or encyclopedia-selected current-turn references. */
  references: Array<Record<string, unknown>>;
  /** Selection accounting when the encyclopedia selector completed successfully. */
  referencesSelection?: ReferenceSelectionSummary;
  /** Previously indexed passages recalled for the current query. */
  encyclopediaPassages?: EncyclopediaPassage[];
  /** Structured shopping offers extracted from shopping tools. */
  shopOffers: ExtractedShopOffer[];
  /** Structured reviews extracted from review tools. */
  reviews: ExtractedReview[];
  /** Structured local places extracted from place tools. */
  places: ExtractedPlace[];
  /** Foreign-language articles reserved for the international-coverage aside. */
  internationalArticles: ExtractedArticle[];
  /** Foreign-language videos reserved for the international-coverage aside. */
  internationalVideos: ExtractedVideoItem[];
}
