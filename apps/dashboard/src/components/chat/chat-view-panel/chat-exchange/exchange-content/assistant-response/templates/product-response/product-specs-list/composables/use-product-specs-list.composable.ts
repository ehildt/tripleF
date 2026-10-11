import { computed } from 'vue';

import { splitSpecLabel } from '../../../../shared/helpers/split-spec-label.helper';
import type { ProductSpecsListProps } from '../ProductSpecsList.types';

/** Derives the label/value rows from the spec items. */
export function useProductSpecsList(props: ProductSpecsListProps) {
  const rows = computed(() =>
    (props.items ?? []).map((item) => splitSpecLabel(item.text)),
  );

  return { rows };
}
