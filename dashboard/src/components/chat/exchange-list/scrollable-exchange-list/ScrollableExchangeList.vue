<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { computed, onUnmounted } from 'vue';

import type { Exchange } from '@/stores/conversation';

import ExchangeEmptyState from '../exchange-empty-state/ExchangeEmptyState.vue';
import ExchangeRow from '../exchange-row/ExchangeRow.vue';

const props = defineProps<{
  exchanges: readonly Exchange[];
  highlightedIds: Set<string>;
  collapsedIds: Set<string>;
}>();

const emit = defineEmits<{
  scroll: [];
  delete: [exchangeId: string];
  retry: [exchangeId: string];
  branch: [exchangeId: string];
  hoverDeleteStart: [exchangeId: string];
  hoverDeleteEnd: [];
  setScrollContainer: [container: HTMLElement | null];
}>();

function setContainer(el: Element | ComponentPublicInstance | null): void {
  const htmlEl = el instanceof HTMLElement || el === null ? el : null;
  emit('setScrollContainer', htmlEl);
}

onUnmounted(() => {
  emit('setScrollContainer', null);
});

const hasExchanges = computed(() => props.exchanges.length > 0);

function onScroll() {
  emit('scroll');
}
</script>

<template>
  <div :ref="setContainer" class="scrollable-exchange-list" @scroll="onScroll">
    <ExchangeEmptyState v-if="!hasExchanges" />
    <template v-else>
      <ExchangeRow
        v-for="(exchange, index) in exchanges"
        :key="exchange.id"
        :exchange="exchange"
        :index="index"
        :highlighted="highlightedIds.has(exchange.id)"
        :collapsed="collapsedIds.has(exchange.id)"
        @delete="emit('delete', $event)"
        @retry="emit('retry', $event)"
        @branch="emit('branch', $event)"
        @hover-delete-start="emit('hoverDeleteStart', $event)"
        @hover-delete-end="emit('hoverDeleteEnd')"
      />
    </template>
  </div>
</template>

<style scoped>
.scrollable-exchange-list {
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  overflow-y: auto;
  overscroll-behavior: contain;
  height: calc(100vh - 18.5rem);
}
</style>
