import {
  computed,
  type ComputedRef,
  type MaybeRefOrGetter,
  toValue,
} from 'vue';

import { useTemplatePartsSettingsStore } from '@/stores/template-parts-settings/template-parts-settings.store';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { filterDisabledTemplateParts } from '../helpers/filter-disabled-template-parts.helper';

/** Derive the renderable response data from the current template-part preferences. */
export function useVisibleTemplateData(
  template: MaybeRefOrGetter<string>,
  data: MaybeRefOrGetter<AssistantResponseData | undefined>,
): ComputedRef<AssistantResponseData> {
  const store = useTemplatePartsSettingsStore();
  return computed(() =>
    filterDisabledTemplateParts(
      toValue(template),
      toValue(data),
      store.templatePartsVisibility,
    ),
  );
}
