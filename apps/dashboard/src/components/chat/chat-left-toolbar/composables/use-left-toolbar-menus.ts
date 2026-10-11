import { computed, ref } from 'vue';

import { useModelsStore } from '@/stores/models';

import type { LeftToolbarMenuKey } from './use-left-toolbar-menus.types';
import { useSelectedModel } from './use-selected-model';

/**
 * Exclusive open state for the chat view's left-toolbar menus (model,
 * conversation, stream). Opening one closes any other.
 *
 * A deliberate singleton: the prompt-menu in the chat prompt action bar
 * drives the same menus the left toolbar's triggers do, so both component
 * trees share one open-state ref (like `useLeftToolbarView`).
 */
const openMenuKey = ref<LeftToolbarMenuKey | null>(null);

function isMenuOpen(key: LeftToolbarMenuKey): boolean {
  return openMenuKey.value === key;
}

function openMenu(key: LeftToolbarMenuKey) {
  openMenuKey.value = key;
}

function closeAllMenus() {
  openMenuKey.value = null;
}

const isModelMenuOpen = computed(() => isMenuOpen('model'));
const isConversationMenuOpen = computed(() => isMenuOpen('conversation'));
const isStreamMenuOpen = computed(() => isMenuOpen('stream'));

export function useLeftToolbarMenus() {
  const modelsStore = useModelsStore();
  const { hasNoModelSelected } = useSelectedModel();

  function toggleModelMenu() {
    const wasOpen = isMenuOpen('model');
    closeAllMenus();
    if (!wasOpen) {
      openMenu('model');
      void modelsStore.fetchModels({ refresh: true });
    }
  }

  function toggleConversationMenu() {
    if (hasNoModelSelected.value) return;
    const wasOpen = isMenuOpen('conversation');
    closeAllMenus();
    if (wasOpen) return;
    openMenu('conversation');
    if (!modelsStore.models.length)
      void modelsStore.fetchModels({ refresh: true });
  }

  function toggleStreamMenu() {
    if (hasNoModelSelected.value) return;
    const wasOpen = isMenuOpen('stream');
    closeAllMenus();
    if (!wasOpen) openMenu('stream');
  }

  return {
    isModelMenuOpen,
    isConversationMenuOpen,
    isStreamMenuOpen,
    closeAllMenus,
    toggleModelMenu,
    toggleConversationMenu,
    toggleStreamMenu,
  };
}
