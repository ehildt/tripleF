import { computed } from 'vue';

import type { ResponseLayout } from '@/types/harness-response-data.model';

import { useSysctlConfig } from '../../composables/use-sysctl-config';

/**
 * The layouts tab's state: reads the layouts config section and toggles one
 * layout at a time. At least one layout stays enabled — the response model
 * would have nothing to compose with otherwise.
 */
export function useLayoutsSection() {
  const { config, patchConfig } = useSysctlConfig();

  const enabledCount = computed(() =>
    config.value
      ? Object.values(config.value.layouts).filter(Boolean).length
      : 0,
  );

  function isLayoutEnabled(layout: ResponseLayout): boolean {
    return config.value?.layouts[layout] ?? true;
  }

  function toggleLayout(layout: ResponseLayout) {
    if (!config.value) return;
    const next = !config.value.layouts[layout];
    if (!next && enabledCount.value === 1) return;
    config.value.layouts[layout] = next;
    patchConfig('layouts', layout, next);
  }

  return { isLayoutEnabled, toggleLayout };
}
