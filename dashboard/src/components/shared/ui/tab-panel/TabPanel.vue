<script setup lang="ts">
import { Copy } from '@lucide/vue';

import IconButton from '../icon-button/IconButton.vue';
import type { TabPanelProps } from './TabPanel.types';

const props = defineProps<TabPanelProps>();

const emit = defineEmits<{
  (e: 'select', tabId: string): void;
  (e: 'copy'): void;
}>();

function handleSelect(tabId: string) {
  if (props.activeTab === tabId) {
    // Clicking the active tab closes it so both consumers can show a
    // "no selection" state if desired.
    return;
  }
  emit('select', tabId);
}
</script>

<template>
  <div class="tab-panel">
    <div class="tab-panel__tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-panel__tab"
        :class="{ 'tab-panel__tab--active': activeTab === tab.id }"
        @click="handleSelect(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab" class="tab-panel__panel">
      <IconButton
        v-if="copyable"
        :active="copied"
        :title="copied ? $t('common.copiedShort') : $t('common.copy')"
        @click="emit('copy')"
      >
        <Copy />
      </IconButton>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.tab-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid var(--color-divider);
  padding-top: var(--spacing-3);
}

.tab-panel__tab-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-0-5);
  margin-bottom: -1px;
  position: relative;
  z-index: 10;
}

.tab-panel__tab {
  flex: 1;
  padding: var(--spacing-1-5) var(--spacing-3);
  border: none;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.tab-panel__tab:hover {
  color: var(--color-fg-secondary);
}

.tab-panel__tab--active {
  border: 1px solid var(--color-divider);
  border-bottom: 0;
  background-color: var(--color-bg-secondary);
  color: var(--color-accent-primary);
}

.tab-panel__panel {
  position: relative;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* The canonical IconButton is positioned into the panel corner. Its Tooltip
   wrapper is `display: contents`, so the button itself is the direct
   participant in the panel's layout and can be absolutely positioned. */
.tab-panel__panel :deep(.icon-button) {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  z-index: 10;
}
</style>
