import { bodyBriefSnippet } from './body-brief.snippet.js';
import { bylineDatelineSnippet } from './byline-dateline.snippet.js';
import { gallerySnippet } from './gallery.snippet.js';
import { headerNewsSnippet } from './header-news.snippet.js';
import { heroMediaSnippet } from './hero-media.snippet.js';
import { internationalCoverageSnippet } from './international-coverage.snippet.js';
import { newsKeyFindingsSnippet } from './key-findings-news.snippet.js';
import { leadSnippet } from './lead.snippet.js';
import { relatedStoriesSnippet } from './related-stories.snippet.js';
import type { SnippetTemplatePreset } from './snippet.types.js';
import { sourcesSnippet } from './sources.snippet.js';
import { videoGallerySnippet } from './video-gallery.snippet.js';

/**
 * NEWS preset: a compact current-events brief — headline, lead, key
 * findings, a short context body at most, sources, and related stories.
 * The body snippet is the brief flavor; editorial layout is unsupported
 * (no quote).
 */
export const newsPreset: SnippetTemplatePreset = {
  template: 'news',
  spineKeys: ['headline', 'lead'],
  supportedLayouts: ['classic', 'split', 'mosaic'],
  readTimeKeys: ['headline', 'deck', 'lead', 'sectionContent'],
  snippets: [
    headerNewsSnippet,
    leadSnippet,
    newsKeyFindingsSnippet,
    bodyBriefSnippet,
    bylineDatelineSnippet,
    sourcesSnippet,
    relatedStoriesSnippet,
    heroMediaSnippet,
    gallerySnippet,
    videoGallerySnippet,
    internationalCoverageSnippet,
  ],
};
