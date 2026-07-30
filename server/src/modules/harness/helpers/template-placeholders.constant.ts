/**
 * Placeholder names the dashboard Eta templates expect.
 *
 * The server no longer owns the HTML templates; it only tells the model which
 * JSON keys the client's Eta templates need. Keeping the lists here avoids
 * sharing template strings between server and dashboard.
 */
const TEMPLATE_PLACEHOLDERS: Record<
  string,
  { required: string[]; optional: string[] }
> = {
  article: {
    required: [
      'category',
      'title',
      'subtitle',
      'summary',
      'sectionTitle',
      'sectionContent',
    ],
    optional: [
      'heroImageUrl',
      'heroImageAlt',
      'heroCaption',
      'galleryTitle',
      'galleryItems',
      'keyFindings',
      'sources',
      'conclusion',
      'author',
      'publishDate',
      'readTime',
      'heroVideoUrl',
      'heroVideoCaption',
      'heroVideoTitle',
      'videoGalleryTitle',
      'videoGalleryItems',
      'quote',
      'cardsTitle',
      'cards',
    ],
  },
  news: {
    required: [
      'category',
      'headline',
      'deck',
      'lead',
      'sectionTitle',
      'sectionContent',
    ],
    optional: [
      'heroImageUrl',
      'heroImageAlt',
      'heroCaption',
      'heroVideoUrl',
      'heroVideoCaption',
      'heroVideoTitle',
      'videoGalleryItems',
      'galleryTitle',
      'galleryItems',
      'keyPoints',
      'sources',
      'relatedStories',
      'dateline',
      'byline',
      'publishDate',
      'readTime',
    ],
  },
  describe: {
    required: ['category', 'title', 'subtitle', 'sectionContent'],
    optional: [
      'keyFindings',
      'sources',
      'galleryTitle',
      'galleryItems',
      'note',
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
    ],
  },
  ocr: {
    required: ['category', 'title', 'subtitle', 'sectionContent'],
    optional: ['keyFindings'],
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
    ],
  },
  evaluation: {
    required: [
      'category',
      'title',
      'subtitle',
      'subject',
      'verdict',
      'score',
      'scoreLabel',
    ],
    optional: [
      'reasoning',
      'strengths',
      'weaknesses',
      'recommendations',
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
    ],
  },
  product: {
    required: ['category', 'title', 'subtitle', 'shortDescription'],
    optional: [
      'priceRange',
      'aggregateRating',
      'aggregateRatingCount',
      'aggregateRatingLabel',
      'buyAdvice',
      'statHighlights',
      'keyPoints',
      'pros',
      'cons',
      'shopOffers',
      'reviewSummary',
      'sectionTitle',
      'sectionContent',
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
      'sources',
    ],
  },
  shoplist: {
    required: ['category', 'title', 'subtitle'],
    optional: ['shortDescription', 'shopOffers', 'sources'],
  },
  imagelist: {
    required: ['category', 'title', 'subtitle', 'galleryItems'],
    optional: ['sources'],
  },
  videolist: {
    required: ['category', 'title', 'subtitle', 'videoGalleryItems'],
    optional: [],
  },
  text: {
    required: [],
    optional: [],
  },
  compact: {
    required: [],
    optional: [],
  },
};

/** Returns the keys that are actually required for the given template. */
export function getRequiredKeys(template: string): string[] {
  return TEMPLATE_PLACEHOLDERS[template]?.required ?? [];
}

/** Returns keys that are optional for the given template. */
export function getOptionalKeys(template: string): string[] {
  return TEMPLATE_PLACEHOLDERS[template]?.optional ?? [];
}
