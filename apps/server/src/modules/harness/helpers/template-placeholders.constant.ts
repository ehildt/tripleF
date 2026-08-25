import {
  getSnippetTemplateKeys,
  isSnippetTemplate,
} from '@triplef/agent/prompts';
import { compareSchema } from '@triplef/agent/schemas';
import { describeSchema } from '@triplef/agent/schemas';
import { imagelistSchema } from '@triplef/agent/schemas';
import { ocrSchema } from '@triplef/agent/schemas';
import { productSchema } from '@triplef/agent/schemas';
import { shoplistSchema } from '@triplef/agent/schemas';
import { stockmarketItemSchema } from '@triplef/agent/schemas';
import { stockmarketListSchema } from '@triplef/agent/schemas';
import { summarySchema } from '@triplef/agent/schemas';
import { videolistSchema } from '@triplef/agent/schemas';
import { deriveSchemaKeys } from '@triplef/agent/schemas';

/**
 * Placeholder lists per template: which JSON keys the client renders.
 *
 * news/article/evaluation/merge are snippet-composed — their key lists derive
 * from their snippet presets (single source of truth) and are not in this
 * table. Every other template derives its keys from its zod schema, so the
 * validator's whitelist and the schema cannot drift.
 */
const TEMPLATE_PLACEHOLDERS: Record<
  string,
  { required: string[]; optional: string[] }
> = {
  describe: deriveSchemaKeys(describeSchema),
  compare: deriveSchemaKeys(compareSchema),
  ocr: deriveSchemaKeys(ocrSchema),
  summary: deriveSchemaKeys(summarySchema),
  product: deriveSchemaKeys(productSchema),
  shoplist: deriveSchemaKeys(shoplistSchema),
  imagelist: deriveSchemaKeys(imagelistSchema),
  videolist: deriveSchemaKeys(videolistSchema),
  stockmarketitem: deriveSchemaKeys(stockmarketItemSchema),
  stockmarketlist: deriveSchemaKeys(stockmarketListSchema),
  text: { required: [], optional: [] },
};

/** Returns the keys that are actually required for the given template. */
export function getRequiredKeys(template: string): string[] {
  if (isSnippetTemplate(template)) {
    return getSnippetTemplateKeys(template).requiredKeys;
  }
  return TEMPLATE_PLACEHOLDERS[template]?.required ?? [];
}

/** Returns keys that are optional for the given template. */
export function getOptionalKeys(template: string): string[] {
  if (isSnippetTemplate(template)) {
    return getSnippetTemplateKeys(template).optionalKeys;
  }
  return TEMPLATE_PLACEHOLDERS[template]?.optional ?? [];
}
