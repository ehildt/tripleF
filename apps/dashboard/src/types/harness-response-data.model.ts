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
 * A retrieved reference the model discarded on an image task (describe,
 * compare, ocr) after verifying it visually against the uploaded image(s).
 * Image entries carry the cloud reference's storage URL; link entries carry
 * the corroborating page URL. `reason` is the model's one-line rationale —
 * absent on harness-complement entries (candidates the model neither used
 * nor explicitly discarded), which the UI labels with a localized fallback.
 */
export interface DiscardedImageReference {
  type: 'image';
  imageUrl: string;
  title?: string;
  reason?: string;
}

export interface DiscardedLinkReference {
  type: 'link';
  url: string;
  title?: string;
  reason?: string;
}

export type DiscardedReference =
  DiscardedImageReference | DiscardedLinkReference;

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

/**
 * One merged comparison or critique block (merge template): its own subject
 * profiles, closing comparison, reasoning, and recommendations — rendered
 * through the evaluation template's components, one block per match-up.
 */
export interface MergedEvaluationGroup {
  /** The match-up name, e.g. "Wuthering Waves vs Neverness to Everness". */
  title?: string;
  /** Explicit note when this match-up is unrelated to the other topics. */
  relationNote?: string;
  introduction?: string;
  subjects?: EvaluationSubject[];
  comparison?: EvaluationComparison;
  reasoning?: string;
  recommendations?: KeyFinding[];
}

/**
 * One topic block of a merged narrative (merge template): the topic heading,
 * its own hero media (a merge has no single hero — each topic shows its
 * related visual), and the structured snippet content rendered below it —
 * pros, cons, and actions as proper lists, with plain text only as a
 * fallback.
 */
export interface BodySection {
  /** The topic heading rendered above its content. */
  topic?: string;
  /** Plain-text narrative for material that isn't list-shaped. */
  content?: string;
  /** The topic's pros. */
  strengths?: KeyFinding[];
  /** The topic's cons. */
  weaknesses?: KeyFinding[];
  /** Actionable points for this topic. */
  recommendations?: KeyFinding[];
  /** Hero image for this topic. */
  heroImageUrl?: string;
  /** Descriptive label required when heroImageUrl is set. */
  heroImageAlt?: string;
  heroCaption?: string;
  /** Hero video for this topic. */
  heroVideoUrl?: string;
  /** Required when heroVideoUrl is set. */
  heroVideoTitle?: string;
  heroVideoCaption?: string;
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

  /* Merge */
  /** Per-comparison evaluation blocks, one per merged match-up. */
  mergedEvaluations?: MergedEvaluationGroup[];
  /** Per-topic narrative blocks: topic header + snippet content. */
  bodySections?: BodySection[];

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
  /*
   * Image tasks (describe/compare/ocr): online references the model examined
   * but did not pick as corroborating evidence for the uploaded image(s).
   */
  discardedReferences?: DiscardedReference[];

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

/** Response content section types the user can hide/show from the prompt bar.
 * The media sections (gallery, videoGallery) are no longer hidden — they
 * switch presentations instead — so only the text sections remain. */
export type CollapsibleSectionKey =
  'sources' | 'keyFindings' | 'internationalCoverage';

/** Collapse state of every response section type (`true` = hidden). */
export type CollapsedSections = Record<CollapsibleSectionKey, boolean>;

/** Injected from the orchestrator so response sections hide when their type is
 * collapsed from the prompt bar, without a deep prop thread. */
export const sectionCollapsedKey: InjectionKey<ComputedRef<CollapsedSections>> =
  Symbol('sectionCollapsed');

/** How a media section renders: as a gallery (carousel/mosaic) or as a list (grid). */
export type MediaPresentation = 'gallery' | 'list';

/** Presentation preference per media type, switched from the prompt bar's view menu. */
export type MediaPresentations = Record<'image' | 'video', MediaPresentation>;

/** Injected from the orchestrator so the media sections read their presentation
 * from the prompt bar without a deep prop thread. */
export const mediaPresentationsKey: InjectionKey<
  ComputedRef<MediaPresentations>
> = Symbol('mediaPresentations');

/** A carousel/gallery slide — either an image or a video item. */
export type MediaItem = GalleryItem | VideoGalleryItem;
