import { assessmentListsSnippet } from './assessment-lists.snippet.js';
import { comparisonSnippet } from './comparison.snippet.js';
import { gallerySnippet } from './gallery.snippet.js';
import { headerArticleSnippet } from './header-article.snippet.js';
import { heroMediaSnippet } from './hero-media.snippet.js';
import { internationalCoverageSnippet } from './international-coverage.snippet.js';
import { introductionSnippet } from './introduction.snippet.js';
import { reasoningSnippet } from './reasoning.snippet.js';
import type { SnippetTemplatePreset } from './snippet.types.js';
import { sourcesSnippet } from './sources.snippet.js';
import { subjectsSnippet } from './subjects.snippet.js';
import { verdictSpineSnippet } from './verdict-spine.snippet.js';
import { videoGallerySnippet } from './video-gallery.snippet.js';

/**
 * EVALUATION preset: a structured critique or comparison — a brief
 * introduction, then one profile per evaluated subject, then the closing
 * comparison. Single-subject critiques fill the verdict spine
 * (subject/verdict/score) and the assessment lists instead of subjects +
 * comparison — the client renders both shapes through the same sections.
 * No quote, so editorial is unsupported.
 */
export const evaluationPreset: SnippetTemplatePreset = {
  template: 'evaluation',
  spineKeys: ['title'],
  supportedLayouts: ['classic', 'split', 'mosaic'],
  snippets: [
    headerArticleSnippet,
    introductionSnippet,
    verdictSpineSnippet,
    subjectsSnippet,
    comparisonSnippet,
    reasoningSnippet,
    assessmentListsSnippet,
    sourcesSnippet,
    heroMediaSnippet,
    gallerySnippet,
    videoGallerySnippet,
    internationalCoverageSnippet,
  ],
};
