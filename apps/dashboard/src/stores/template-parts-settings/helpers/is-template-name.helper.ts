import { TEMPLATE_NAMES } from '../template-parts-settings.constant';
import type { TemplateName } from '../template-parts-settings.model';

/** Narrow an arbitrary template id to the catalog without an unsafe assertion. */
export function isTemplateName(value: string): value is TemplateName {
  return TEMPLATE_NAMES.some((template) => template === value);
}
