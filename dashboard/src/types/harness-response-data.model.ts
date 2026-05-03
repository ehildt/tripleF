import type { InjectionKey } from 'vue';

export interface VideoGalleryItem {
  videoUrl: string;
  title?: string;
  caption?: string;
}

export interface GalleryItem {
  imageUrl: string;
  imageAlt?: string;
  title?: string;
  caption?: string;
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

export interface ArticleCard {
  title?: string;
  description?: string;
  url?: string;
  linkLabel?: string;
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

  /* Article-only */
  author?: string;
  publishDate?: string;
  readTime?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroCaption?: string;
  heroVideoUrl?: string;
  heroVideoCaption?: string;
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
