import { computed, ref, watch } from 'vue';

import { useAppStore } from '@/stores/app';

import type { LeftToolbarView } from '../../left-toolbar-view.type';

/**
 * The chat left toolbar's active section (conversations or sockets).
 *
 * The view ref is module-scope on purpose: the prompt-menu in the chat
 * prompt action bar selects a section the moment it opens that section's
 * menu, while the left toolbar renders the matching list — both component
 * trees must read and write the same state, so this is a deliberate
 * singleton composable (like the prompt draft), not fresh state per call.
 */
const leftToolbarView = ref<LeftToolbarView>('conversations');

let viewWatcherStarted = false;

export function useLeftToolbarView() {
  const appStore = useAppStore();

  const areSocketsVisible = computed(() => appStore.isTabVisible('sockets'));

  // If the sockets section is turned off (Settings) while selected, fall back
  // to the conversations section so the view never points at a hidden tab.
  // Registered once per app lifetime — the view ref is a singleton, so a per-
  // call watcher would just re-fire the same fallback for every consumer.
  if (!viewWatcherStarted) {
    viewWatcherStarted = true;
    watch(areSocketsVisible, (visible) => {
      if (!visible && leftToolbarView.value === 'sockets') {
        leftToolbarView.value = 'conversations';
      }
    });
  }

  function selectLeftToolbarView(view: LeftToolbarView) {
    leftToolbarView.value = view;
  }

  return {
    leftToolbarView,
    selectLeftToolbarView,
    areSocketsVisible,
  };
}
