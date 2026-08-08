import {
  getSnippetTemplateKeys,
  isSnippetTemplate,
} from '../snippets/snippet-presets.constant.js';

/**
 * Placeholder lists per template: which JSON keys the client renders.
 *
 * news/article/evaluation are snippet-composed — their key lists derive from
 * their snippet presets (single source of truth) and are not in this table.
 */
const TEMPLATE_PLACEHOLDERS: Record<
  string,
  { required: string[]; optional: string[] }
> = {
  describe: {
    required: ['category', 'title', 'subtitle', 'sectionContent'],
    optional: [
      'keyFindings',
      'sources',
      'galleryTitle',
      'galleryItems',
      'note',
      'internationalCoverage',
    ],
  },
  compare: {
    required: ['category', 'title', 'subtitle', 'sectionContent'],
    optional: [
      'keyFindings',
      'sources',
      'galleryTitle',
      'galleryItems',
      'note',
      'internationalCoverage',
    ],
  },
  ocr: {
    required: ['category', 'title', 'subtitle', 'sectionContent'],
    optional: [
      'keyFindings',
      'sources',
      'galleryTitle',
      'galleryItems',
      'internationalCoverage',
    ],
  },
  summary: {
    required: ['category', 'title', 'subtitle', 'summary'],
    optional: [
      'keyFindings',
      'sources',
      'heroImageUrl',
      'heroImageAlt',
      'heroCaption',
      'heroVideoUrl',
      'heroVideoCaption',
      'heroVideoTitle',
      'galleryTitle',
      'galleryItems',
      'videoGalleryTitle',
      'videoGalleryItems',
      'internationalCoverage',
    ],
  },
  product: {
    required: ['category', 'title', 'subtitle', 'shortDescription'],
    optional: [
      'aggregateRating',
      'aggregateRatingCount',
      'aggregateRatingLabel',
      'statHighlights',
      'keyPoints',
      'pros',
      'cons',
      'shopOffers',
      'heroImageUrl',
      'heroImageAlt',
      'heroCaption',
      'galleryTitle',
      'galleryItems',
      'videoGalleryTitle',
      'videoGalleryItems',
      'sources',
      'internationalCoverage',
    ],
  },
  shoplist: {
    required: ['category', 'title', 'subtitle'],
    optional: [
      'shortDescription',
      'shopOffers',
      'sources',
      'internationalCoverage',
    ],
  },
  imagelist: {
    required: ['category', 'title', 'subtitle', 'galleryItems'],
    optional: ['sources', 'internationalCoverage'],
  },
  videolist: {
    required: ['category', 'title', 'subtitle', 'videoGalleryItems'],
    optional: ['internationalCoverage'],
  },
  stockmarketitem: {
    required: ['category', 'title', 'subtitle', 'shortDescription'],
    optional: [
      'currentPrice',
      'change',
      'changeP',
      'recommendation',
      'recommendationReasoning',
      'keyPoints',
      'fundamentals',
      'news',
      'sources',
      'internationalCoverage',
      'referenceLines',
      'markers',
    ],
  },
  stockmarketlist: {
    required: ['category', 'title', 'subtitle'],
    optional: [
      'summary',
      'items',
      'sources',
      'internationalCoverage',
      'referenceLines',
      'markers',
    ],
  },
  text: {
    required: [],
    optional: [],
  },
};

/** Returns the keys that are actually required for the given template. */
export function getRequiredKeys(template: string): string[] {
  if (isSnippetTemplate(template)) {
    return getSnippetTemplateKeys(template).requiredKeys;
  }
  return TEMPLATE_PLACEHOLDERS[template]?.required ?? [];
}

/** Returns keys that are optional for the given template. */
export function getOptionalKeys(template: string): string[] {
  if (isSnippetTemplate(template)) {
    return getSnippetTemplateKeys(template).optionalKeys;
  }
  return TEMPLATE_PLACEHOLDERS[template]?.optional ?? [];
}
