import { authorMetaSnippet } from './author-meta.snippet.js';
import { bodyExtensiveSnippet } from './body-extensive.snippet.js';
import { cardsSnippet } from './cards.snippet.js';
import { conclusionSnippet } from './conclusion.snippet.js';
import { gallerySnippet } from './gallery.snippet.js';
import { headerArticleSnippet } from './header-article.snippet.js';
import { heroMediaSnippet } from './hero-media.snippet.js';
import { internationalCoverageSnippet } from './international-coverage.snippet.js';
import { keyFindingsSnippet } from './key-findings.snippet.js';
import { quoteSnippet } from './quote.snippet.js';
import type { SnippetTemplatePreset } from './snippet.types.js';
import { sourcesSnippet } from './sources.snippet.js';
import { summarySnippet } from './summary.snippet.js';
import { videoGallerySnippet } from './video-gallery.snippet.js';

/**
 * ARTICLE preset: an extensive research/report piece — summary, full body,
 * key findings, pull quote, cards, conclusion, author meta. The only preset
 * with a quote, so it alone supports the editorial layout.
 */
export const articlePreset: SnippetTemplatePreset = {
  template: 'article',
  spineKeys: ['title', 'summary'],
  supportedLayouts: ['classic', 'editorial', 'split', 'mosaic'],
  readTimeKeys: ['title', 'summary', 'sectionContent', 'conclusion'],
  snippets: [
    headerArticleSnippet,
    summarySnippet,
    bodyExtensiveSnippet,
    quoteSnippet,
    keyFindingsSnippet,
    cardsSnippet,
    conclusionSnippet,
    authorMetaSnippet,
    sourcesSnippet,
    heroMediaSnippet,
    gallerySnippet,
    videoGallerySnippet,
    internationalCoverageSnippet,
  ],
};
