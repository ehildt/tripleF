import { TEMPLATE_VARIANTS } from '../variant-instructions.registry.js';

/**
 * Formats the list of valid template variants for inclusion in the intent
 * selection prompt.
 */
export function formatVariantCatalog(): string[] {
  return Object.entries(TEMPLATE_VARIANTS).flatMap(([template, variants]) => [`  ${template}: ${variants.join(', ')}`]);
}
