import {
  DEFAULT_VARIANT_ID,
  TemplateName,
} from '../templates/intent.schema.js';

import {
  COMPARE_INSTRUCTIONS,
  COMPARE_VISUAL_INSTRUCTIONS,
} from './instructions/compare.instruction.js';
import {
  DESCRIBE_CONCISE_INSTRUCTIONS,
  DESCRIBE_DETAILED_INSTRUCTIONS,
  DESCRIBE_INSTRUCTIONS,
} from './instructions/describe.instruction.js';
import { IMAGELIST_INSTRUCTIONS } from './instructions/imagelist.instruction.js';
import { INTERNATIONAL_COVERAGE_INSTRUCTIONS } from './instructions/international-coverage.instruction.js';
import {
  OCR_INSTRUCTIONS,
  OCR_VERBATIM_INSTRUCTIONS,
} from './instructions/ocr.instruction.js';
import { PRODUCT_INSTRUCTIONS } from './instructions/product.instruction.js';
import { SHOPLIST_INSTRUCTIONS } from './instructions/shoplist.instruction.js';
import { STOCKMARKET_ITEM_INSTRUCTIONS } from './instructions/stockmarketitem.instruction.js';
import { STOCKMARKET_LIST_INSTRUCTIONS } from './instructions/stockmarketlist.instruction.js';
import { SUMMARY_INSTRUCTIONS } from './instructions/summary.instruction.js';
import {
  TEXT_CODING_INSTRUCTIONS,
  TEXT_FAMILIARITY_INSTRUCTIONS,
  TEXT_INSTRUCTIONS,
} from './instructions/text.instruction.js';
import { VIDEOLIST_INSTRUCTIONS } from './instructions/videolist.instruction.js';

export { DEFAULT_VARIANT_ID };

/**
 * Canonical list of valid template variants. The intent classifier uses this
 * to know which variants exist, and the resolver below maps each pair to the
 * style instructions injected into the content system prompt.
 */
export const TEMPLATE_VARIANTS: Record<TemplateName, string[]> = {
  article: ['default'],
  news: ['default'],
  describe: ['default', 'detailed', 'concise'],
  compare: ['default', 'visual'],
  ocr: ['default', 'verbatim'],
  summary: ['default'],
  evaluation: ['default'],
  merge: ['default'],
  product: ['default'],
  shoplist: ['default'],
  imagelist: ['default'],
  videolist: ['default'],
  stockmarketitem: ['default'],
  stockmarketlist: ['default'],
  text: ['default', 'coding', 'familiarity'],
};

const VARIANT_INSTRUCTIONS: Record<string, string> = {
  // describe
  'describe:default': DESCRIBE_INSTRUCTIONS,
  'describe:detailed': DESCRIBE_DETAILED_INSTRUCTIONS,
  'describe:concise': DESCRIBE_CONCISE_INSTRUCTIONS,

  // compare
  'compare:default': COMPARE_INSTRUCTIONS,
  'compare:visual': COMPARE_VISUAL_INSTRUCTIONS,

  // ocr
  'ocr:default': OCR_INSTRUCTIONS,
  'ocr:verbatim': OCR_VERBATIM_INSTRUCTIONS,

  // summary
  'summary:default': SUMMARY_INSTRUCTIONS,

  // product
  'product:default': PRODUCT_INSTRUCTIONS,

  // shoplist
  'shoplist:default': SHOPLIST_INSTRUCTIONS,

  // stockmarketitem
  'stockmarketitem:default': STOCKMARKET_ITEM_INSTRUCTIONS,

  // stockmarketlist
  'stockmarketlist:default': STOCKMARKET_LIST_INSTRUCTIONS,

  // imagelist
  'imagelist:default': IMAGELIST_INSTRUCTIONS,

  // videolist
  'videolist:default': VIDEOLIST_INSTRUCTIONS,

  // text
  'text:default': TEXT_INSTRUCTIONS,
  'text:coding': TEXT_CODING_INSTRUCTIONS,
  'text:familiarity': TEXT_FAMILIARITY_INSTRUCTIONS,
};

/**
 * Resolves the style instructions for a selected template variant.
 * Falls back to the template's default variant, then to an empty string.
 * Every content template gets the internationalCoverage aside appended.
 */
export function resolveVariantInstructions(
  template: string,
  variantId: string = DEFAULT_VARIANT_ID,
): string {
  const instructions =
    VARIANT_INSTRUCTIONS[`${template}:${variantId}`] ??
    VARIANT_INSTRUCTIONS[`${template}:${DEFAULT_VARIANT_ID}`] ??
    '';
  if (!instructions) return instructions;
  // The text template is free-form: the JSON-only internationalCoverage
  // aside would contradict its output contract.
  if (template === 'text') return instructions;
  return `${instructions}\n\n${INTERNATIONAL_COVERAGE_INSTRUCTIONS}`;
}
