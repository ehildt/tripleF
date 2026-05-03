import {
  DEFAULT_VARIANT_ID,
  TemplateName,
} from '../templates/intent.schema.js';

import { ARTICLE_INSTRUCTIONS } from './instructions/article.instruction.js';
import { EVALUATION_INSTRUCTIONS } from './instructions/evaluation.instruction.js';
import { NEWS_INSTRUCTIONS } from './instructions/news.instruction.js';
import { SUMMARY_INSTRUCTIONS } from './instructions/summary.instruction.js';

export { DEFAULT_VARIANT_ID };

/**
 * Canonical list of valid template variants. The intent classifier uses this
 * to know which variants exist, and the resolver below maps each pair to the
 * short style instructions injected into the content system prompt.
 */
export const TEMPLATE_VARIANTS: Record<TemplateName, string[]> = {
  article: ['default'],
  news: ['default'],
  describe: ['default', 'detailed', 'concise'],
  compare: ['default', 'visual'],
  ocr: ['default', 'verbatim'],
  summary: ['default'],
  evaluation: ['default'],
  text: ['default', 'coding'],
};

const VARIANT_INSTRUCTIONS: Record<string, string> = {
  // describe
  'describe:default':
    'Describe the visible content clearly and accurately. Focus on what is directly observable.\n\nFINAL REMINDER:\n- Base everything strictly on what is visible in the provided image(s).',
  'describe:detailed':
    'Describe the image in exhaustive visual detail: objects, materials, lighting, composition, colors, textures, spatial relationships, and any visible text or symbols.\n\nFINAL REMINDER:\n- Base everything strictly on what is visible in the provided image(s).',
  'describe:concise':
    'Give a brief, one-paragraph description of the image covering only the most important visible elements.\n\nFINAL REMINDER:\n- Base everything strictly on what is visible in the provided image(s).',

  // compare
  'compare:default':
    'Compare the images by visible attributes: composition, objects, materials, lighting, colors, and spatial layout.\n\nFINAL REMINDER:\n- Base everything strictly on what is visible in the provided image(s).',
  'compare:visual':
    'Focus the comparison on visual and aesthetic differences between the images.\n\nFINAL REMINDER:\n- Base everything strictly on what is visible in the provided image(s).',

  // ocr
  'ocr:default':
    'Extract the visible text and preserve its structure as faithfully as possible.\n\nFINAL REMINDER:\n- Transcribe only the text visible in the image.',
  'ocr:verbatim':
    'Transcribe the visible text exactly as it appears, without reformatting, summarizing, or correcting errors.\n\nFINAL REMINDER:\n- Transcribe only the text visible in the image.',

  // article
  'article:default': ARTICLE_INSTRUCTIONS,

  // news
  'news:default': NEWS_INSTRUCTIONS,

  // summary
  'summary:default': SUMMARY_INSTRUCTIONS,

  // evaluation
  'evaluation:default': EVALUATION_INSTRUCTIONS,

  // text
  'text:default':
    'Answer the user directly and helpfully. Use plain text with line breaks for structure.\n\nFINAL REMINDER:\n- Return only the required plain-text answer; no markdown, HTML, code fences, or extra keys.',
  'text:coding':
    'Answer as a coding assistant: include code examples, explain trade-offs, and keep explanations precise.\n\nFINAL REMINDER:\n- Return only the required plain-text answer; no markdown, HTML, code fences, or extra keys.',
};

/**
 * Resolves the short style instructions for a selected template variant.
 * Falls back to the template's default variant, then to an empty string.
 */
export function resolveVariantInstructions(
  template: string,
  variantId: string = DEFAULT_VARIANT_ID,
): string {
  return (
    VARIANT_INSTRUCTIONS[`${template}:${variantId}`] ??
    VARIANT_INSTRUCTIONS[`${template}:${DEFAULT_VARIANT_ID}`] ??
    ''
  );
}
