import { isTemplateName } from '@/stores/template-parts-settings/helpers/is-template-name.helper';
import { TEMPLATE_PARTS } from '@/stores/template-parts-settings/template-parts-settings.constant';
import type { TemplatePartsVisibility } from '@/stores/template-parts-settings/template-parts-settings.types';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

/** Return response data without the keys owned by disabled catalog parts. */
export function filterDisabledTemplateParts(
  template: string,
  data: AssistantResponseData | undefined,
  visibility: TemplatePartsVisibility,
): AssistantResponseData {
  const source = data ?? {};
  if (!isTemplateName(template)) return source;
  const parts = TEMPLATE_PARTS[template];
  const hiddenKeys = new Set<keyof AssistantResponseData>();
  for (const part of parts) {
    if (visibility[template][part.id] === false) {
      for (const key of part.keys) hiddenKeys.add(key);
    }
  }
  if (hiddenKeys.size === 0) return source;

  const result = { ...source };
  for (const key of hiddenKeys) delete result[key];
  return result;
}
