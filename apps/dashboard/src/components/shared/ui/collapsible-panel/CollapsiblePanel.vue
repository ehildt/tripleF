<script setup lang="ts">
import { ChevronRight } from '@lucide/vue';
import { ref, watch } from 'vue';

import MotionIcon from '../motion-icon/MotionIcon.vue';
import Tooltip from '../tooltip/Tooltip.vue';

const props = withDefaults(
  defineProps<{
    title: string;
    count?: number;
    defaultExpanded?: boolean;
    /** Unique id used to persist the expanded/collapsed state (localStorage). */
    id?: string;
  }>(),
  { count: undefined, defaultExpanded: true, id: undefined },
);

const STORAGE_PREFIX = 'settings.collapsible';

/**
 * Read the persisted expanded state for a panel id, falling back to the
 * default when nothing is stored (or storage is unavailable, e.g. SSR).
 */
function loadExpanded(id: string | undefined, fallback: boolean): boolean {
  if (!id) return fallback;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}.${id}`);
    return raw === null ? fallback : raw === '1';
  } catch {
    return fallback;
  }
}

const expanded = ref(loadExpanded(props.id, props.defaultExpanded ?? true));

function toggle() {
  expanded.value = !expanded.value;
}

// Remember the collapse choice so it survives reloads and tab switches.
watch(expanded, (value) => {
  if (!props.id) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}.${props.id}`, value ? '1' : '0');
  } catch {
    /* storage unavailable — just don't persist */
  }
});
</script>

<template>
  <div class="collapsible-panel">
    <div class="collapsible-panel__header">
      <Tooltip
        :text="
          expanded ? $t('common.collapseSection') : $t('common.expandSection')
        "
      >
        <button
          type="button"
          class="collapsible-panel__toggle"
          :aria-expanded="expanded"
          :aria-label="
            expanded ? $t('common.collapseSection') : $t('common.expandSection')
          "
          @click="toggle"
        >
          <MotionIcon>
            <ChevronRight
              class="collapsible-panel__chevron"
              :class="{ 'collapsible-panel__chevron--expanded': expanded }"
            />
          </MotionIcon>
          <span class="collapsible-panel__title">{{ title }}</span>
          <span
            v-if="count !== undefined && count > 0"
            class="collapsible-panel__count"
          >
            [{{ count }}]
          </span>
        </button>
      </Tooltip>

      <div class="collapsible-panel__spacer" />
      <slot name="actions" />
    </div>

    <Transition name="expand">
      <div v-if="expanded" class="collapsible-panel__body">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapsible-panel__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
  font-family: var(--font-mono);
}

.collapsible-panel__toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}

.collapsible-panel__chevron {
  display: block;
  width: 1rem;
  height: 1rem;
  color: var(--color-tab-rest);
  flex-shrink: 0;
  transition: transform 200ms ease;
}

.collapsible-panel__chevron--expanded {
  transform: rotate(90deg);
}

.collapsible-panel__title {
  font-size: 0.875rem;
  color: var(--color-tab-rest);
}

.collapsible-panel__count {
  font-size: 0.75rem;
  color: var(--color-tab-rest);
}

.collapsible-panel__spacer {
  flex: 1;
}

.collapsible-panel__body {
  display: grid;
  grid-template-rows: 1fr;
}

/* Smooth collapse/expand via grid-template-rows (height animates cleanly). */
.expand-enter-active,
.expand-leave-active {
  transition:
    grid-template-rows 200ms ease,
    opacity 200ms ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
}
</style>
