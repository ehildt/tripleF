import { categorizeTools } from '../helpers/categorize-tools.helper.js';
import type { IntentResult } from '../templates/intent.schema.js';

type ToolArray = IntentResult['tools'];

const mediaTemplates = new Set([
  'article',
  'news',
  'summary',
  'evaluation',
  'product',
]);

const imageOnlyMediaTemplates = new Set(['compare', 'describe']);

/**
 * Media templates (article/news/summary/evaluation/product) always need image
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
    return ensureProductTools(
      [...requiredTools],
      enabledToolNames,
    ) as unknown as ToolArray;
  }

  return [...requiredTools] as unknown as ToolArray;
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
 * Add shopping and reviews search tools for product intent when available.
 */
function ensureProductTools(
  tools: string[],
  enabledToolNames: string[],
): string[] {
  const expanded = new Set<string>(tools);
  for (const name of enabledToolNames) {
    if (name.includes('ShoppingSearch') || name.includes('ReviewsSearch')) {
      expanded.add(name);
    }
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
  return ensureMediaSearchTools(
    { ...intent, tools: withMediaListTools },
    enabledToolNames,
  );
}
