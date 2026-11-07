<script setup lang="ts">
import { ref, toRef } from 'vue';

import { useMenuPosition } from '@/composables/use-menu-position/use-menu-position';

import MotionIcon from '../motion-icon/MotionIcon.vue';
import Tooltip from '../tooltip/Tooltip.vue';
import type {
  FilterMenuTriggerEmits,
  FilterMenuTriggerProps,
} from './FilterMenuTrigger.types';

const props = defineProps<FilterMenuTriggerProps>();
const emit = defineEmits<FilterMenuTriggerEmits>();

const triggerRef = ref<HTMLButtonElement | null>(null);
const isOpen = toRef(props, 'isOpen');
const { positionStyle } = useMenuPosition(triggerRef, isOpen, {
  side: 'bottom',
});
</script>

<template>
  <Tooltip :text="title">
    <button
      ref="triggerRef"
      type="button"
      class="filter-menu-trigger"
      :class="{
        'filter-menu-trigger--active': isOpen || isActive,
      }"
      :aria-label="title"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click.stop="emit('toggle')"
    >
      <MotionIcon>
        <component :is="icon" class="filter-menu-trigger__icon" />
      </MotionIcon>
    </button>
  </Tooltip>

  <Teleport to="body">
    <div
      v-if="isOpen"
      class="filter-menu-trigger__backdrop"
      @click="emit('close')"
    />
    <div
      v-if="isOpen"
      class="filter-menu-trigger__dropdown"
      :style="{ ...positionStyle, width }"
      @click.stop
    >
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
.filter-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.filter-menu-trigger:hover {
  color: var(--color-accent-primary);
}

.filter-menu-trigger--active {
  color: var(--color-accent-primary);
}

.filter-menu-trigger__icon {
  display: inline-flex;
  width: 1rem;
  height: 1rem;
}

.filter-menu-trigger__backdrop {
  position: fixed;
  inset: 0;
  z-index: 49;
  background: transparent;
}

.filter-menu-trigger__dropdown {
  position: fixed;
  z-index: 50;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
