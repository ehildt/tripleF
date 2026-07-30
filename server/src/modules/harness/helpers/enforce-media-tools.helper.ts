import { categorizeTools } from '../helpers/categorize-tools.helper.js';
import type { IntentResult } from '../templates/intent.schema.js';

type ToolArray = IntentResult['tools'];

const mediaTemplates = new Set(['article', 'news', 'product']);

/**
 * Summary and evaluation are NOT in the forced-media set: the intent
 * classifier already adds media/search tools for them when the user asks
 * for external facts, and their instructions only use media "when online
 * research returns". Forcing searches for a plain recap or a judgment
 * about the conversation would waste tool calls and inject unsolicited
 * galleries.
 */

/**
 * Shoplist is a compact purchase list: it needs product images and shopping
 * results, but never videos.
 */
const shoplistTemplates = new Set(['shoplist']);

const imageOnlyMediaTemplates = new Set(['compare', 'describe']);

/**
 * Media templates (article/news/product) always need image
 * and video search so they can illustrate their answer.
 */
function ensureMediaSearchTools(
  intent: IntentResult,
  enabledToolNames: string[],
): ToolArray {
  if (!mediaTemplates.has(intent.template)) return intent.tools;

  const categories = categorizeTools(enabledToolNames);
  const requiredTools = new Set<string>(intent.tools);

  for (const tool of categories.imageSearch) {
    requiredTools.add(tool as ToolArray[number]);
  }

  for (const tool of categories.videoSearch) {
    requiredTools.add(tool as ToolArray[number]);
  }

  // Product template also needs shopping + reviews tools when available.
  if (intent.template === 'product') {
    return ensureShoppingTools([...requiredTools], enabledToolNames, {
      includeReviews: true,
    }) as unknown as ToolArray;
  }

  return [...requiredTools] as unknown as ToolArray;
}

/**
 * Shoplist needs image search (product images for the compact list) plus
 * shopping search (prices and sellers). Reviews search is intentionally not
 * forced — the offers carry per-offer ratings, and the compact list does not
 * render seller reviews.
 */
function ensureShoplistTools(
  intent: IntentResult,
  enabledToolNames: string[],
): ToolArray {
  if (!shoplistTemplates.has(intent.template)) return intent.tools;

  const categories = categorizeTools(enabledToolNames);
  const withImages = new Set<string>(intent.tools);
  for (const tool of categories.imageSearch) {
    withImages.add(tool as ToolArray[number]);
  }

  return ensureShoppingTools(
    [...withImages],
    enabledToolNames,
  ) as unknown as ToolArray;
}

/**
 * For image-self-analysis templates (compare/describe/ocr) we no longer force
 * image search. We only preserve the classifier's chosen tools, with the
 * understanding that the model should decide whether visible clues (watermarks,
 * URLs, brand names, text, recognizable subjects) justify using webSearch or
 * webFetch. webSearch + webFetch remain available if the classifier explicitly
 * included them.
 */
function preserveOptionalResearchTools(intent: IntentResult): ToolArray {
  if (!imageOnlyMediaTemplates.has(intent.template)) return intent.tools;

  // Do not add any tools here. The classifier may have added webSearch/webFetch
  // because the user asked a research-style question; otherwise the model will
  // rely on visual analysis.
  return intent.tools;
}

/**
 * Media-only list templates need their dedicated search tools: imagelist
 * always searches images, videolist always searches videos. The classifier
 * may add webSearch for context, but the media tools are mandatory.
 */
function ensureMediaListTools(
  intent: IntentResult,
  enabledToolNames: string[],
): ToolArray {
  const categories = categorizeTools(enabledToolNames);
  const requiredTools = new Set<string>(intent.tools);

  const mediaTools =
    intent.template === 'imagelist'
      ? categories.imageSearch
      : intent.template === 'videolist'
        ? categories.videoSearch
        : [];

  for (const tool of mediaTools) {
    requiredTools.add(tool as ToolArray[number]);
  }

  return [...requiredTools] as unknown as ToolArray;
}

/**
 * Add shopping-related search tools for purchase templates when available.
 * Reviews search (seller reputation) is only forced for the full product
 * overview — the compact shoplist does not render seller reviews.
 */
function ensureShoppingTools(
  tools: string[],
  enabledToolNames: string[],
  { includeReviews = false }: { includeReviews?: boolean } = {},
): string[] {
  const expanded = new Set<string>(tools);
  for (const name of enabledToolNames) {
    if (name.includes('ShoppingSearch')) expanded.add(name);
    if (includeReviews && name.includes('ReviewsSearch')) expanded.add(name);
  }
  return [...expanded];
}

/**
 * Ensure the required search tools are present based on intent template and category.
 */
export function enforceRequiredTools(
  intent: IntentResult,
  enabledToolNames: string[],
): ToolArray {
  const tools = preserveOptionalResearchTools(intent);
  const withMediaListTools = ensureMediaListTools(
    { ...intent, tools },
    enabledToolNames,
  );
  const withShoplistTools = ensureShoplistTools(
    { ...intent, tools: withMediaListTools },
    enabledToolNames,
  );
  return ensureMediaSearchTools(
    { ...intent, tools: withShoplistTools },
    enabledToolNames,
  );
}
