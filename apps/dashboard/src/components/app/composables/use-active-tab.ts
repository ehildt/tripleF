import { computed } from 'vue';
import { useRoute } from 'vue-router';

import type { ActiveTab } from '@/stores/app/navigation/navigation.model';

/** Derive the active application tab from the router without mirroring it. */
export function useActiveTab() {
  const route = useRoute();

  const activeTab = computed<ActiveTab>(() => {
    switch (route.name) {
      case 'chat':
        return 'chat';
      case 'memory':
        return 'memory';
      case 'dlq':
        return 'dlq';
      case 'debug':
        return 'debug';
      case 'settings':
        return 'settings';
      default:
        return 'chat';
    }
  });

  return { activeTab };
}
