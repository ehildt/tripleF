<script setup lang="ts">
import { computed } from 'vue';

import type { ActiveTab } from '../../../stores/app';
import { calcTabColor } from '../shared/helpers/calc-tab-color.helper';

const props = defineProps<{
  label: string;
  tab: ActiveTab;
  activeTab: ActiveTab;
  count?: number;
  showStar?: boolean;
  tint: number;
}>();

const emit = defineEmits<{
  click: [];
}>();

const isActive = computed(() => props.tab === props.activeTab);
const showCount = computed(() => (props.count ?? 0) > 0 && !isActive.value);

const tabColor = computed(() => calcTabColor(props.tint));

const activeStyle = computed(() =>
  isActive.value
    ? { backgroundColor: tabColor.value, color: 'var(--color-fg-inverse)' }
    : { color: tabColor.value },
);
</script>

<template>
  <button
    class="tab-button"
    :class="{ 'tab-button--active': isActive }"
    :style="activeStyle"
    @click="emit('click')"
  >
    {{ label }}
    <span
      v-if="showStar && !isActive"
      class="tab-button__indicator tab-button__indicator--star"
    >
      ✦
    </span>
    <span
      v-if="showCount"
      class="tab-button__indicator tab-button__indicator--count"
    >
      {{ count! > 99 ? '99+' : count }}
    </span>
  </button>
</template>

<style scoped>
.tab-button {
  position: relative;
  overflow: visible;
  padding: 0.5rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1rem;
  transition:
    color 0.3s ease,
    background-color 0.3s ease;
  cursor: pointer;
}

.tab-button:not(.tab-button--active) {
  color: var(--color-fg-secondary);
}

.tab-button:not(.tab-button--active):hover {
  background-color: var(--color-bg-secondary);
}

.tab-button--active {
  font-weight: 700;
}

.tab-button__indicator {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  z-index: 50;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.tab-button__indicator--star {
  color: var(--color-fg-primary);
}

.tab-button__indicator--count {
  color: var(--color-fg-primary);
  background-color: var(--color-accent-active);
  border: 1px solid color-mix(in srgb, var(--color-fg-primary) 20%, transparent);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 20%, transparent);
}
</style>
