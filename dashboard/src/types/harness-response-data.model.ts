import type { InjectionKey } from 'vue';

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

export interface ReviewSummary {
  text: string;
}

export interface StatHighlight {
  label: string;
  value: string;
}

export interface HarnessResponseData {
  /* Key points for news */
  headline?: string;
  deck?: string;
  lead?: string;
  dateline?: string;
  byline?: string;
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
  priceRange?: string;
  aggregateRating?: number;
  aggregateRatingCount?: number;
  aggregateRatingLabel?: string;
  buyAdvice?: string;
  statHighlights?: StatHighlight[];
  pros?: KeyFinding[];
  cons?: KeyFinding[];
  shopOffers?: ShopOffer[];
  reviewSummary?: ReviewSummary[];

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
