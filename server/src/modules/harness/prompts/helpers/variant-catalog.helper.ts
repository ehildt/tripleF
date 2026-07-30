import { TEMPLATE_VARIANTS } from '../variant-instructions.registry.js';

/**
 * Formats the list of valid template variants for inclusion in the intent
 * selection prompt. The "compact" template is excluded on purpose: it runs
 * on a dedicated job path and is never selected by the classifier.
 */
export function formatVariantCatalog(): string[] {
  return Object.entries(TEMPLATE_VARIANTS)
    .filter(([template]) => template !== 'compact')
    .flatMap(([template, variants]) => [
      `  ${template}: ${variants.join(', ')}`,
    ]);
}

export { TEMPLATE_VARIANTS };
