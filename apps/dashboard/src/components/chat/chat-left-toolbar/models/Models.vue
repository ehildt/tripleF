<script setup lang="ts">
import { computed } from 'vue';

import { useLeftToolbarStore } from '@/stores/left-toolbar';
import { useModelsStore } from '@/stores/models';

import CapabilitiesRow from './capabilities-row/CapabilitiesRow.vue';
import LeftToolbarGroup from './left-toolbar-group/LeftToolbarGroup.vue';
import ModelSelector from './model-selector/ModelSelector.vue';

const toolbarStore = useLeftToolbarStore();
const modelsStore = useModelsStore();

const isModelMenuOpen = computed(() => toolbarStore.isMenuOpen('model'));

function toggleModelMenu() {
  const wasOpen = isModelMenuOpen.value;
  toolbarStore.closeAllMenus();
  if (!wasOpen) {
    toolbarStore.openMenu('model');
    modelsStore.fetchModels({ refresh: true });
  }
}

function onSelectModel(modelName: string) {
  toolbarStore.changeModel(modelName);
  toolbarStore.closeAllMenus();
}
</script>

<template>
  <LeftToolbarGroup>
    <!-- Model / Brain -->
    <ModelSelector
      :is-open="isModelMenuOpen"
      :selected-model-name="toolbarStore.selectedModelName || '—'"
      :is-model-missing="toolbarStore.isModelAvailable === false"
      :local-models="modelsStore.localModels"
      :cloud-models="modelsStore.cloudModels"
      :is-loading="modelsStore.modelsLoading"
      @toggle-menu="toggleModelMenu"
      @select-model="onSelectModel"
      @close="toolbarStore.closeAllMenus"
    />

    <!-- Capabilities -->
    <CapabilitiesRow
      v-if="toolbarStore.selectedModelDetails?.capabilities?.length"
      :capabilities="toolbarStore.selectedModelDetails.capabilities"
    />
  </LeftToolbarGroup>
</template>
