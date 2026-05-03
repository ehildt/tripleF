/**
 * Placeholder names the dashboard templates expect.
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
      'videoGalleryItems',
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
    optional: ['keyFindings', 'sources'],
  },
  compare: {
    required: ['category', 'title', 'subtitle', 'sectionContent'],
    optional: ['keyFindings', 'sources'],
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
      'galleryTitle',
      'galleryItems',
      'videoGalleryTitle',
      'videoGalleryItems',
    ],
  },
  text: {
    required: ['text'],
    optional: [],
  },
};

/**
 * Returns the data keys the dashboard template expects for a given template.
 *
 * @deprecated Prefer `templateRequiredKeys` / `templateOptionalKeys` to avoid
 * treating optional fields as required during validation.
 */
export function templatePlaceholders(template: string): string[] {
  const entry = TEMPLATE_PLACEHOLDERS[template];
  if (!entry) return [];
  return [...entry.required, ...entry.optional];
}

/** Returns the keys that are actually required for the given template. */
export function templateRequiredKeys(template: string): string[] {
  return TEMPLATE_PLACEHOLDERS[template]?.required ?? [];
}

/** Returns the keys that are optional for the given template. */
export function templateOptionalKeys(template: string): string[] {
  return TEMPLATE_PLACEHOLDERS[template]?.optional ?? [];
}
