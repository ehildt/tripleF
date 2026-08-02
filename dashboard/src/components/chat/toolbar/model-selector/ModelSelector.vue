<script setup lang="ts">
import { Brain } from '@lucide/vue';
import { ref, toRef } from 'vue';

import type { OllamaModel } from '../../../../stores/models';
import IconButton from '../shared/ui/icon-button/IconButton.vue';
import ToolbarLabel from '../shared/ui/toolbar-label/ToolbarLabel.vue';
import { useMenuPosition } from './composables/use-menu-position';
import ModelList from './model-list/ModelList.vue';

const props = defineProps<{
  isOpen: boolean;
  selectedModelName: string;
  isModelMissing: boolean;
  localModels: readonly OllamaModel[];
  cloudModels: readonly OllamaModel[];
  isLoading: boolean;
}>();

defineEmits<{
  toggleMenu: [];
  selectModel: [modelName: string];
}>();

const triggerRef = ref<HTMLElement | null>(null);

const { positionStyle } = useMenuPosition(triggerRef, toRef(props, 'isOpen'));
</script>

<template>
  <div class="model-menu">
    <div ref="triggerRef" class="model-selector">
      <ToolbarLabel
        :value="selectedModelName || '—'"
        :active="isModelMissing"
      />
      <IconButton
        :active="isOpen"
        title="Select model"
        @click.stop="$emit('toggleMenu')"
      >
        <Brain class="w-4 h-4" />
      </IconButton>
    </div>
  </div>

  <!-- Teleported to escape the sticky toolbar's stacking context (z-50):
       a nested z-index can never beat the floating video popouts. -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="model-selector__dropdown"
      data-toolbar-menu-dropdown
      :style="positionStyle ?? undefined"
      @click.stop
    >
      <ModelList
        :local-models="localModels"
        :cloud-models="cloudModels"
        :selected-model="selectedModelName"
        :loading="isLoading"
        @select="$emit('selectModel', $event)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.model-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  width: 100%;
  justify-content: flex-end;
  flex-shrink: 0;
}

.model-selector__dropdown {
  position: fixed;
  margin-left: var(--spacing-1);
  /* Teleported to <body>: above the floating video popouts (z-index 1000)
     and the lifted chat column (z-index 60), below the lightbox (1100). */
  z-index: 1050;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
