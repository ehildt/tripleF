import {
  TEMPLATE_NAMES,
  TEMPLATE_PARTS,
} from '../template-parts-settings.constant';
import type { TemplatePartsVisibility } from '../template-parts-settings.types';

/** Every part of every template enabled (the pristine default). */
export function buildDefaultTemplateParts(): TemplatePartsVisibility {
  return Object.fromEntries(
    TEMPLATE_NAMES.map((template) => [
      template,
      Object.fromEntries(
        TEMPLATE_PARTS[template].map((part) => [part.id, true]),
      ),
    ]),
  ) as TemplatePartsVisibility;
}
