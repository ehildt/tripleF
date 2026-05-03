<script setup lang="ts">
import { Brain } from '@lucide/vue';

import type { OllamaModel } from '../../../../stores/models';
import IconButton from '../shared/ui/icon-button/IconButton.vue';
import ToolbarLabel from '../shared/ui/toolbar-label/ToolbarLabel.vue';
import ModelList from './model-list/ModelList.vue';

defineProps<{
  isOpen: boolean;
  selectedModelName: string;
  isModelMissing: boolean;
  models: readonly OllamaModel[];
  isLoading: boolean;
}>();

defineEmits<{
  toggleMenu: [];
  selectModel: [modelName: string];
}>();
</script>

<template>
  <div>
    <div class="model-selector">
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
      <div v-if="isOpen" class="model-selector__dropdown" @click.stop>
        <ModelList
          :models="models"
          :selected-model="selectedModelName"
          :loading="isLoading"
          @select="$emit('selectModel', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  width: 100%;
  justify-content: flex-end;
  flex-shrink: 0;
}

.model-selector__dropdown {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: var(--spacing-1);
  z-index: 100;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
