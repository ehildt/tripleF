import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref } from 'vue';

import { useModelsStore } from '@/stores/models/models.store';

import { useLeftToolbarMenus } from './use-left-toolbar-menus';

const selectedModel = vi.hoisted(() => ({})) as {
  hasNoModelSelected: Ref<boolean>;
};
const modelCatalog = vi.hoisted(() => ({ fetchModels: vi.fn() }));

vi.mock('@/components/app/composables/use-model-catalog', () => ({
  useModelCatalog: () => modelCatalog,
}));

vi.mock('./use-selected-model', async () => {
  const { ref } = await import('vue');
  const hasNoModelSelected = ref(false);
  selectedModel.hasNoModelSelected = hasNoModelSelected;
  return { useSelectedModel: () => ({ hasNoModelSelected }) };
});

describe('useLeftToolbarMenus', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    selectedModel.hasNoModelSelected.value = false;
    modelCatalog.fetchModels.mockResolvedValue(undefined);
    // Reset the module-scope open-menu state between tests.
    const { closeAllMenus } = useLeftToolbarMenus();
    closeAllMenus();
  });

  it('opens the model menu exclusively and refreshes the catalog', () => {
    const fetchModels = modelCatalog.fetchModels;

    const { isModelMenuOpen, isConversationMenuOpen, toggleModelMenu } =
      useLeftToolbarMenus();
    toggleModelMenu();

    expect(isModelMenuOpen.value).toBe(true);
    expect(isConversationMenuOpen.value).toBe(false);
    expect(fetchModels).toHaveBeenCalledWith({ refresh: true });
  });

  it('closes the model menu on a second toggle', () => {
    const { isModelMenuOpen, toggleModelMenu } = useLeftToolbarMenus();
    toggleModelMenu();
    toggleModelMenu();
    expect(isModelMenuOpen.value).toBe(false);
  });

  it('does not open the conversation or stream menus without a model', () => {
    selectedModel.hasNoModelSelected.value = true;

    const {
      isConversationMenuOpen,
      isStreamMenuOpen,
      toggleConversationMenu,
      toggleStreamMenu,
    } = useLeftToolbarMenus();

    toggleConversationMenu();
    toggleStreamMenu();

    expect(isConversationMenuOpen.value).toBe(false);
    expect(isStreamMenuOpen.value).toBe(false);
  });

  it('opens the conversation menu and fetches the catalog when empty', () => {
    const modelsStore = useModelsStore();
    modelsStore.models = [];
    const fetchModels = modelCatalog.fetchModels;

    const { isConversationMenuOpen, toggleConversationMenu } =
      useLeftToolbarMenus();
    toggleConversationMenu();

    expect(isConversationMenuOpen.value).toBe(true);
    expect(fetchModels).toHaveBeenCalledWith({ refresh: true });
  });

  it('opens the stream menu exclusively', () => {
    const { isStreamMenuOpen, isModelMenuOpen, toggleStreamMenu } =
      useLeftToolbarMenus();
    toggleStreamMenu();
    expect(isStreamMenuOpen.value).toBe(true);
    expect(isModelMenuOpen.value).toBe(false);
  });
});
