<script setup lang="ts">
import { computed, ref } from 'vue';

import { useMenuPosition } from '../model-selector/composables/use-menu-position';
import ExpandableDivider from './ui/expandable-divider/ExpandableDivider.vue';

const props = defineProps<{
  isExpanded: boolean;
  hasItems: boolean;
}>();

defineEmits<{
  toggleExpanded: [];
}>();

// Like the model-select menu: the content teleports to <body> with a fixed
// position, because the sticky toolbar (z-50) is a stacking context and an
// inline expansion would slide under the lifted chat column (z-60) and the
// floating video popouts (z-1000).
const listRef = ref<HTMLElement | null>(null);
const isExpandedRef = computed(() => props.isExpanded);
const { positionStyle } = useMenuPosition(listRef, isExpandedRef, 'below');
</script>

<template>
  <div v-if="hasItems" class="expandable-list">
    <div ref="listRef" class="expandable-list__divider-row">
      <ExpandableDivider
        :is-expanded="isExpanded"
        @toggle="$emit('toggleExpanded')"
      />
    </div>

    <Teleport to="body">
      <div
        v-if="isExpanded"
        class="expandable-list__content expandable-list__content--floating"
        :style="positionStyle ?? undefined"
      >
        <slot />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.expandable-list {
  width: 100%;
}

.expandable-list__divider-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  justify-content: flex-end;
}

.expandable-list__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  flex: 1;
  width: 100%;
  min-width: 0;
  overflow-y: auto;
}

/* Teleported to <body>: above the floating video popouts (z-index 1000)
   and the lifted chat column (z-index 60), below the lightbox (1100) —
   same layer as the model-select menu. */
.expandable-list__content--floating {
  position: fixed;
  z-index: 1050;
  max-height: 60vh;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
