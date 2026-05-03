import {
  templateOptionalKeys,
  templatePlaceholders,
  templateRequiredKeys,
} from './template.helper.js';

describe('templatePlaceholders', () => {
  it('returns article placeholders', () => {
    expect(templatePlaceholders('article')).toContain('title');
    expect(templatePlaceholders('article')).toContain('galleryItems');
    expect(templatePlaceholders('article')).toContain('keyFindings');
    expect(templatePlaceholders('article')).not.toContain('toolResults');
  });

  it('returns describe placeholders', () => {
    expect(templatePlaceholders('describe')).toContain('title');
    expect(templatePlaceholders('describe')).not.toContain('galleryItems');
    expect(templatePlaceholders('describe')).toContain('sectionContent');
    expect(templatePlaceholders('describe')).not.toContain('toolResults');
  });

  it('returns compare placeholders', () => {
    expect(templatePlaceholders('compare')).toContain('title');
    expect(templatePlaceholders('compare')).not.toContain('galleryItems');
    expect(templatePlaceholders('compare')).toContain('sectionContent');
    expect(templatePlaceholders('compare')).not.toContain('toolResults');
  });

  it('returns ocr placeholders', () => {
    expect(templatePlaceholders('ocr')).toContain('title');
    expect(templatePlaceholders('ocr')).not.toContain('galleryItems');
    expect(templatePlaceholders('ocr')).toContain('sectionContent');
    expect(templatePlaceholders('ocr')).not.toContain('toolResults');
  });

  it('returns text placeholders', () => {
    expect(templatePlaceholders('text')).toContain('text');
    expect(templatePlaceholders('text')).not.toContain('toolResults');
  });

  it('returns an empty array for unknown templates', () => {
    expect(templatePlaceholders('unknown')).toEqual([]);
  });
});

describe('templateRequiredKeys / templateOptionalKeys', () => {
  it('returns the required and optional keys for news', () => {
    const required = templateRequiredKeys('news');
    const optional = templateOptionalKeys('news');

    expect(required).toEqual([
      'category',
      'headline',
      'deck',
      'lead',
      'sectionTitle',
      'sectionContent',
    ]);
    expect(optional).toContain('heroImageUrl');
    expect(optional).toContain('heroVideoUrl');
    expect(optional).toContain('videoGalleryItems');
    expect(optional).toContain('relatedStories');
  });

  it('returns empty arrays for unknown templates', () => {
    expect(templateRequiredKeys('unknown')).toEqual([]);
    expect(templateOptionalKeys('unknown')).toEqual([]);
  });
});
