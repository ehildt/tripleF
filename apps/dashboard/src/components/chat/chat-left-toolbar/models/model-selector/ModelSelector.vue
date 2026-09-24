<script setup lang="ts">
import { Brain } from '@lucide/vue';
import { ref, toRef } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import ModelList from '@/components/shared/ui/model-list/ModelList.vue';
import { useMenuPosition } from '@/composables/use-menu-position';

import LeftToolbarLabel from '../left-toolbar-label/LeftToolbarLabel.vue';
import type { ModelSelectorProps } from './ModelSelector.types';

const props = defineProps<ModelSelectorProps>();

const emit = defineEmits<{
  toggleMenu: [];
  selectModel: [modelName: string];
  close: [];
}>();

const triggerRef = ref<HTMLElement | null>(null);

const { positionStyle } = useMenuPosition(triggerRef, toRef(props, 'isOpen'));
</script>

<template>
  <div class="model-menu">
    <div ref="triggerRef" class="model-selector">
      <LeftToolbarLabel
        :value="selectedModelName || '—'"
        :active="isModelMissing"
      />
      <IconButton
        :active="isOpen"
        :title="$t('common.selectModel')"
        @click.stop="emit('toggleMenu')"
      >
        <Brain />
      </IconButton>
    </div>
  </div>

  <!-- Teleported to escape the sticky toolbar's stacking context (z-50):
       a nested z-index can never beat the floating video popouts. -->
  <Teleport to="body">
    <!-- The transparent backdrop carries the close intent: the first outside
         click dismisses the menu (same pattern as the slide-over/lightbox). -->
    <div
      v-if="isOpen"
      class="model-selector__backdrop"
      @click="emit('close')"
    />
    <div
      v-if="isOpen"
      class="model-selector__dropdown"
      :style="positionStyle ?? undefined"
      @click.stop
    >
      <ModelList
        :local-models="localModels"
        :cloud-models="cloudModels"
        :selected-model="selectedModelName"
        :loading="isLoading"
        @select="emit('selectModel', $event)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.model-menu {
  padding: var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  background-color: var(--color-bg-secondary);
  width: 100%;
}

.model-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  width: 100%;
  justify-content: flex-end;
  flex-shrink: 0;
}

.model-selector__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1040;
  background: transparent;
}

.model-selector__dropdown {
  position: fixed;
  margin-left: var(--spacing-1);
  /* Teleported to <body>: above the floating video popouts (z-index 1000)
     and the backdrop (1040), below the lightbox (1100). */
  z-index: 1050;
  width: 14rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
