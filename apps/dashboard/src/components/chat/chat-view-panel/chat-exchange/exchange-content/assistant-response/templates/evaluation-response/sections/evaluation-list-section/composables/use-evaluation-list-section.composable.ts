import { computed } from 'vue';

import type { EvaluationListSectionProps } from '../EvaluationListSection.types';
import { filterValidKeyFindings } from '../helpers/filter-valid-key-findings.helper';
import { pickVariantIcon } from '../helpers/pick-variant-icon.helper';

/** Derives the evaluation list's display values from its props. */
export function useEvaluationListSection(props: EvaluationListSectionProps) {
  const validItems = computed(() => filterValidKeyFindings(props.items));
  const icon = computed(() => pickVariantIcon(props.variant));

  return { validItems, icon };
}
