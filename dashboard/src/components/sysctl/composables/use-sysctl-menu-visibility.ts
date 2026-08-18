import { computed } from 'vue';

import { useAppStore } from '../../../stores/app';

/**
 * SysCtl "Interface" switches for the prompt bar's floating icon menus:
 * whether each menu is pinned open (always shows its icons, no collapse
 * arrow) or collapsible behind the expand arrow.
 */
export function useSysctlMenuVisibility() {
  const appStore = useAppStore();

  function toggleSourceMenuAlwaysShow() {
    appStore.setSourceTagsMenuAlwaysShow(
      'sources',
      !appStore.sourceTagsMenuAlwaysShow.sources,
    );
  }

  function toggleViewMenuAlwaysShow() {
    appStore.setSourceTagsMenuAlwaysShow(
      'view',
      !appStore.sourceTagsMenuAlwaysShow.view,
    );
  }

  return {
    sourceMenuAlwaysShow: computed(
      () => appStore.sourceTagsMenuAlwaysShow.sources,
    ),
    viewMenuAlwaysShow: computed(() => appStore.sourceTagsMenuAlwaysShow.view),
    toggleSourceMenuAlwaysShow,
    toggleViewMenuAlwaysShow,
  };
}
