import { composeSnippetKeys } from './helpers/compose-snippet-keys.helper.js';
import { composeSnippetSchema } from './helpers/compose-snippet-schema.helper.js';
import { articlePreset } from './article.preset.js';
import { evaluationPreset } from './evaluation.preset.js';
import { mergePreset } from './merge.preset.js';
import { newsPreset } from './news.preset.js';
import type { SnippetTemplatePreset } from './snippet.types.js';

/**
 * The snippet-composed templates: news, article, evaluation, merge. Every
 * other template keeps its rigid instructions/schema.
 */
export const SNIPPET_TEMPLATE_PRESETS: Record<string, SnippetTemplatePreset> = {
  news: newsPreset,
  article: articlePreset,
  evaluation: evaluationPreset,
  merge: mergePreset,
};

export function isSnippetTemplate(template: string): boolean {
  return template in SNIPPET_TEMPLATE_PRESETS;
}

/** Schemas are static per preset — compose once at module load. */
const SNIPPET_TEMPLATE_SCHEMAS: Record<
  string,
  ReturnType<typeof composeSnippetSchema>
> = Object.fromEntries(
  Object.entries(SNIPPET_TEMPLATE_PRESETS).map(([template, preset]) => [
    template,
    composeSnippetSchema(preset),
  ]),
);

export function getSnippetTemplateSchema(template: string) {
  return SNIPPET_TEMPLATE_SCHEMAS[template];
}

const SNIPPET_TEMPLATE_KEYS = Object.fromEntries(
  Object.entries(SNIPPET_TEMPLATE_PRESETS).map(([template, preset]) => [
    template,
    composeSnippetKeys(preset),
  ]),
);

export function getSnippetTemplateKeys(template: string) {
  return SNIPPET_TEMPLATE_KEYS[template];
}
