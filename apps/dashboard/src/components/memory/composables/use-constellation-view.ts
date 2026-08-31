import { computed, type Ref } from 'vue';

import type {
  ConstellationFriction,
  ConstellationLink,
  ConstellationNode,
} from '../memory-constellation/MemoryConstellation.types';
import type { ConstellationLane } from './helpers/apply-constellation-view.helper';
import { applyConstellationView } from './helpers/apply-constellation-view.helper';

/**
 * Derive the visible nodes + links + frictions of one memory space from its
 * raw data and the shared strict/recommended view mode. The filter is a pure
 * helper; this composable only binds it reactively so the constellation
 * re-renders when the mode flips.
 */
export function useConstellationView(
  nodes: Ref<ConstellationNode[]>,
  links: Ref<ConstellationLink[]>,
  strictMode: Ref<boolean>,
  lane: ConstellationLane,
  frictions: Ref<ConstellationFriction[]>,
) {
  const view = computed(() =>
    applyConstellationView(
      nodes.value,
      links.value,
      strictMode.value,
      lane,
      frictions.value,
    ),
  );
  return {
    visibleNodes: computed(() => view.value.nodes),
    visibleLinks: computed(() => view.value.links),
    visibleFrictions: computed(() => view.value.frictions),
  };
}
