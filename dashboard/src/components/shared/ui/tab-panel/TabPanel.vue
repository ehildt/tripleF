<script setup lang="ts">
import { Copy } from '@lucide/vue';

import Tooltip from '../tooltip/Tooltip.vue';

export interface TabPanelTab {
  id: string;
  label: string;
}

interface Props {
  tabs: TabPanelTab[];
  activeTab: string | null;
  copyable?: boolean;
  copied?: boolean;
}

const props = defineProps<Props>();

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
      <Tooltip :text="copied ? $t('common.copiedShort') : $t('common.copy')">
        <button
          v-if="copyable"
          class="tab-panel__copy"
          :class="{ 'tab-panel__copy--copied': copied }"
          :aria-label="copied ? $t('common.copiedShort') : $t('common.copy')"
          @click="emit('copy')"
        >
          <Copy class="tab-panel__copy-icon" />
        </button>
      </Tooltip>
      <slot />
    </div>
    <div v-else class="tab-panel__no-tab">
      <span>{{ $t('common.selectTab') }}</span>
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

.tab-panel__copy {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  z-index: 10;
  padding: var(--spacing-1);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.tab-panel__copy:hover {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.tab-panel__copy--copied {
  color: var(--color-accent-primary);
}

.tab-panel__copy-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.tab-panel__no-tab {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}
</style>
