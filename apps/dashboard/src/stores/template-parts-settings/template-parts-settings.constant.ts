/**
 * The client-side catalog of toggleable response parts per template. This is
 * a pure display preference: the model still produces every section, the
 * dashboard only renders the parts the user left enabled. Each part owns the
 * data keys that drive its section, so disabling a part just drops those
 * keys before the template component renders (every section self-hides when
 * its data is absent).
 */

export interface TemplatePartDefinition {
  /** Stable part id (also used for the i18n label key suffix). */
  id: string;
  /** The response data keys this part owns; stripped when disabled. */
  keys: string[];
}

export type TemplateName =
  | 'article'
  | 'news'
  | 'describe'
  | 'compare'
  | 'ocr'
  | 'summary'
  | 'evaluation'
  | 'product'
  | 'shoplist'
  | 'imagelist'
  | 'videolist'
  | 'stockmarketitem'
  | 'stockmarketlist'
  | 'text';

/** The harness template catalog order (kept in sync with the server). */
export const TEMPLATE_NAMES: readonly TemplateName[] = [
  'article',
  'news',
  'describe',
  'compare',
  'ocr',
  'summary',
  'evaluation',
  'product',
  'shoplist',
  'imagelist',
  'videolist',
  'stockmarketitem',
  'stockmarketlist',
  'text',
];

const HERO_KEYS = [
  'heroImageUrl',
  'heroImageAlt',
  'heroCaption',
  'heroVideoUrl',
  'heroVideoTitle',
  'heroVideoCaption',
];

const GALLERY_KEYS = ['galleryTitle', 'galleryItems'];
const VIDEO_GALLERY_KEYS = ['videoGalleryTitle', 'videoGalleryItems'];

export const TEMPLATE_PARTS: Record<TemplateName, TemplatePartDefinition[]> = {
  article: [
    { id: 'hero', keys: HERO_KEYS },
    { id: 'gallery', keys: GALLERY_KEYS },
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'quote', keys: ['quote'] },
    { id: 'cards', keys: ['cardsTitle', 'cards'] },
    { id: 'keyFindings', keys: ['keyFindings'] },
    { id: 'conclusion', keys: ['conclusion'] },
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  news: [
    { id: 'hero', keys: HERO_KEYS },
    { id: 'gallery', keys: GALLERY_KEYS },
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'keyFindings', keys: ['keyFindings'] },
    { id: 'relatedStories', keys: ['relatedStories'] },
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  describe: [
    { id: 'gallery', keys: GALLERY_KEYS },
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'keyFindings', keys: ['keyFindings'] },
    { id: 'note', keys: ['note'] },
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  compare: [
    { id: 'gallery', keys: GALLERY_KEYS },
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'keyFindings', keys: ['keyFindings'] },
    { id: 'note', keys: ['note'] },
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  ocr: [
    { id: 'gallery', keys: GALLERY_KEYS },
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'keyFindings', keys: ['keyFindings'] },
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  summary: [
    { id: 'hero', keys: HERO_KEYS },
    { id: 'gallery', keys: GALLERY_KEYS },
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'keyFindings', keys: ['keyFindings'] },
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  evaluation: [
    { id: 'hero', keys: HERO_KEYS },
    { id: 'gallery', keys: GALLERY_KEYS },
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'subjects', keys: ['subjects'] },
    { id: 'comparison', keys: ['comparison'] },
    { id: 'recommendations', keys: ['recommendations'] },
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  product: [
    { id: 'statHighlights', keys: ['statHighlights', 'keyPoints'] },
    { id: 'prosCons', keys: ['pros', 'cons'] },
    { id: 'shopOffers', keys: ['shopOffers'] },
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'sources', keys: ['sources'] },
  ],
  shoplist: [
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  imagelist: [
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  videolist: [
    { id: 'internationalCoverage', keys: ['internationalCoverage'] },
    { id: 'sources', keys: ['sources'] },
  ],
  stockmarketitem: [
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'sources', keys: ['sources'] },
  ],
  stockmarketlist: [
    { id: 'videoGallery', keys: VIDEO_GALLERY_KEYS },
    { id: 'sources', keys: ['sources'] },
  ],
  text: [],
};
