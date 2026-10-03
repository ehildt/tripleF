<script setup lang="ts">
import { Brain } from '@lucide/vue';
import { ref, toRef } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import ModelList from '@/components/shared/ui/model-list/ModelList.vue';
import { useMenuPosition } from '@/composables/use-menu-position';

import type { ModelSelectorProps } from './ModelSelector.types';

const props = defineProps<ModelSelectorProps>();

const emit = defineEmits<{
  toggleMenu: [];
  selectModel: [modelName: string];
  close: [];
}>();

const triggerRef = ref<HTMLElement | null>(null);

// Prompt-bar trigger sits at the bottom of the viewport: open the list
// upward, left edges aligned — same anchoring as the menu triggers beside it.
const { positionStyle } = useMenuPosition(triggerRef, toRef(props, 'isOpen'), {
  side: 'above',
});
</script>

<template>
  <div ref="triggerRef" class="model-selector">
    <IconButton
      size="sm"
      :active="isOpen"
      :title="$t('common.selectModel')"
      @click.stop="emit('toggleMenu')"
    >
      <Brain />
    </IconButton>
  </div>

  <!-- Teleported to <body>: the fixed coordinates from useMenuPosition plus
       the high z-index keep the list above the floating video popouts —
       the same layer the prompt-menu dropdowns use. -->
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
.model-selector {
  position: relative;
  flex-shrink: 0;
}

.model-selector__backdrop {
  position: fixed;
  inset: 0;
  /* Below the sticky toolbars (z-50) so chrome stays clickable while the
     menu is open; still above the main content to catch outside clicks. */
  z-index: 40;
  background: transparent;
}

.model-selector__dropdown {
  position: fixed;
  /* Teleported to <body>: above the floating video popouts (z-index 1000)
     and the backdrop (1040), below the lightbox (1100). Position comes from
     the trigger anchor inline style (anchored above the trigger). */
  z-index: 1050;
  width: 14rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
