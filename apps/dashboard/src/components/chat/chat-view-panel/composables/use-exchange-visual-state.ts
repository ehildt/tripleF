import { computed, type Ref, ref } from 'vue';

import type { Exchange } from '@/stores/conversation';

import { computeCollapsedExchangeIds } from '../helpers/compute-collapsed-exchange-ids.helper';
import { computeHighlightedExchangeIds } from '../helpers/compute-highlighted-exchange-ids.helper';
import type { ExchangeVisualState } from './use-exchange-visual-state.types';

/**
 * Track the hovered-delete state and expose the derived highlight and
 * collapse id sets for the current exchange list.
 */
export function useExchangeVisualState(
  exchanges: Ref<readonly Exchange[]>,
): ExchangeVisualState {
  const hoveredDeleteId = ref<string | null>(null);

  const highlightedIds = computed(() =>
    computeHighlightedExchangeIds(exchanges.value, hoveredDeleteId.value),
  );

  const collapsedIds = computed(() =>
    computeCollapsedExchangeIds(exchanges.value),
  );

  function onHoverDeleteStart(exchangeId: string) {
    hoveredDeleteId.value = exchangeId;
  }

  function onHoverDeleteEnd() {
    hoveredDeleteId.value = null;
  }

  return {
    hoveredDeleteId,
    highlightedIds,
    collapsedIds,
    onHoverDeleteStart,
    onHoverDeleteEnd,
  };
}
