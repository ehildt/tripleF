import type { ComputedRef, InjectionKey } from 'vue';

export interface VideoGalleryItem {
  videoUrl: string;
  title?: string;
  caption?: string;
  duration?: string;
  channel?: string;
  date?: string;
  views?: number;
  thumbnailUrl?: string;
  description?: string;
}

export interface GalleryItem {
  imageUrl: string;
  imageAlt?: string;
  title?: string;
  caption?: string;
  width?: number;
  height?: number;
  source?: string;
}

export interface KeyFinding {
  text: string;
}

export interface Source {
  title?: string;
  url?: string;
  sourceName?: string;
  date?: string;
  snippet?: string;
}

export interface RelatedStory {
  title?: string;
  url?: string;
  sourceName?: string;
  date?: string;
  imageUrl?: string;
}

/**
 * internationalCoverage — noteworthy results found in languages other than
 * the user's. Title stays in the original language, summary in the user's.
 */
export interface InternationalCoverageEntry {
  title?: string;
  url?: string;
  sourceName?: string;
  language?: string;
  summary?: string;
}

export interface ArticleCard {
  title?: string;
  description?: string;
  url?: string;
  linkLabel?: string;
}

export interface ShopOffer {
  title?: string;
  price?: string;
  source?: string;
  imageUrl?: string;
  delivery?: string;
  rating?: number;
  ratingCount?: number;
  link?: string;
}

export interface StatHighlight {
  label: string;
  value: string;
}

export interface StockmarketNewsItem {
  title?: string;
  url?: string;
  source?: string;
  date?: string;
  snippet?: string;
}

export interface StockmarketFundamentals {
  name?: string;
  sector?: string;
  industry?: string;
  marketCap?: number | string;
  peRatio?: number | string;
  revenue?: number | string;
  profitMargin?: number | string;
}

export interface StockmarketListItem {
  name?: string;
  ticker?: string;
  price?: number;
  change?: number;
  changeP?: number;
}

/** One evaluated subject profile (evaluation template). */
export interface EvaluationSubject {
  name?: string;
  description?: string;
  strengths?: KeyFinding[];
  weaknesses?: KeyFinding[];
  /** Numeric rating on the fixed 0-10 scale. */
  score?: number;
  scoreLabel?: string;
}

/** A matrix cell: one subject's score for one criterion. */
export interface EvaluationCriterionScore {
  subject?: string;
  score?: number;
}

/** A matrix row: one criterion scored across the evaluated subjects. */
export interface EvaluationCriterion {
  name?: string;
  scores?: EvaluationCriterionScore[];
}

/** The closing comparison block of a multi-subject evaluation. */
export interface EvaluationComparison {
  summary?: string;
  verdict?: string;
  /** Exact name of the leading subject, when one clearly leads. */
  winner?: string;
  criteria?: EvaluationCriterion[];
}

/** A dashed horizontal price line with a right-axis value badge. */
export interface ChartReferenceLine {
  value: number;
  label?: string;
  /** A theme token name, e.g. "accent-primary" or "status-error". */
  color?: string;
}

/** A chart annotation (e.g. a dividend "D" or a buy/sell signal). */
export interface ChartMarker {
  time: string;
  position: 'aboveBar' | 'belowBar';
  /** A theme token name, e.g. "harmony-3" or "status-error". */
  color?: string;
  shape: 'circle' | 'arrowUp' | 'arrowDown' | 'square';
  text?: string;
}

export interface HarnessResponseData {
  /**
   * Art-direction layout the snippet response chose for its sections
   * (first JSON key; the client rearranges its Vue sections to match).
   */
  layout?: ResponseLayout;

  /* News response */
  headline?: string;
  deck?: string;
  lead?: string;
  dateline?: string;
  byline?: string;
  /** Product spec rows / stockmarket stat rows (news uses keyFindings). */
  keyPoints?: KeyFinding[];
  relatedStories?: RelatedStory[];
  internationalCoverage?: InternationalCoverageEntry[];

  /* Summary / evaluation */
  summary?: string;
  subject?: string;
  verdict?: string;
  score?: number;
  scoreLabel?: string;
  reasoning?: string;
  strengths?: KeyFinding[];
  weaknesses?: KeyFinding[];
  recommendations?: KeyFinding[];
  /** Framing paragraph above the subject profiles. */
  introduction?: string;
  /** Per-subject overview blocks (1 for a lone critique, 2+ for a comparison). */
  subjects?: EvaluationSubject[];
  /** Closing comparison block across subjects. */
  comparison?: EvaluationComparison;

  /* Hero */
  category?: string;
  title?: string;
  subtitle?: string;

  /* Text template */
  text?: string;

  /* Shared content */
  sectionTitle?: string;
  sectionContent?: string;

  /* Gallery */
  galleryTitle?: string;
  galleryItems?: GalleryItem[];

  /* Key findings / sources */
  keyFindings?: KeyFinding[];
  sources?: Source[];

  /* Compare note */
  note?: string;

  /* Product template */
  shortDescription?: string;
  aggregateRating?: number;
  aggregateRatingCount?: number;
  aggregateRatingLabel?: string;
  statHighlights?: StatHighlight[];
  pros?: KeyFinding[];
  cons?: KeyFinding[];
  shopOffers?: ShopOffer[];

  /* Stockmarket item template */
  currentPrice?: number;
  change?: number;
  changeP?: number;
  recommendation?: string;
  recommendationReasoning?: string;
  fundamentals?: StockmarketFundamentals;
  news?: StockmarketNewsItem[];

  /* Stockmarket list template */
  items?: StockmarketListItem[];

  /* Stockmarket chart overlays */
  referenceLines?: ChartReferenceLine[];
  markers?: ChartMarker[];

  /* Article-only */
  author?: string;
  publishDate?: string;
  readTime?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroCaption?: string;
  heroVideoUrl?: string;
  heroVideoCaption?: string;
  heroVideoTitle?: string;
  videoGalleryTitle?: string;
  videoGalleryItems?: VideoGalleryItem[];
  quote?: string;
  conclusion?: string;
  cardsTitle?: string;
  cards?: ArticleCard[];
}

export type HarnessImageClickedHandler = (item: GalleryItem) => void;

export const harnessImageClickedKey: InjectionKey<HarnessImageClickedHandler> =
  Symbol('harnessImageClicked');

/**
 * Art-direction layouts for snippet-composed responses (news, article,
 * evaluation): classic stacked flow, editorial pull-quote spread, split
 * hero, or dense mosaic gallery. Kept in sync with the server's
 * RESPONSE_LAYOUTS constant.
 */
export type ResponseLayout = 'classic' | 'editorial' | 'split' | 'mosaic';

/** Which media gallery a news/article-style response prioritizes (renders first). */
export type MediaPriority = 'images' | 'videos';

/** Injected from an ancestor orchestrator into the assistant-response templates so
 * they can order the image vs video galleries without a deep prop thread. */
export const mediaPriorityKey: InjectionKey<ComputedRef<MediaPriority>> =
  Symbol('mediaPriority');
