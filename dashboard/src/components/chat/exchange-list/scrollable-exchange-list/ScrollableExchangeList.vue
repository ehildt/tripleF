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
  toggleIncluded: [exchangeId: string];
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
    <Transition name="exchange-list-state" mode="out-in">
      <ExchangeEmptyState v-if="!hasExchanges" key="empty" />
      <div v-else key="exchanges" class="scrollable-exchange-list__exchanges">
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
          @toggle-included="emit('toggleIncluded', $event)"
          @hover-delete-start="emit('hoverDeleteStart', $event)"
          @hover-delete-end="emit('hoverDeleteEnd')"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scrollable-exchange-list {
  position: relative;
  padding: var(--spacing-2);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  overflow-y: auto;
  overscroll-behavior: contain;
  height: calc(100vh - 15rem);
}

.scrollable-exchange-list__exchanges {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.exchange-list-state-enter-active,
.exchange-list-state-leave-active {
  transition:
    opacity 350ms ease,
    transform 350ms ease;
}

.exchange-list-state-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}

.exchange-list-state-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

.exchange-list-state-leave-active {
  position: absolute;
  width: 100%;
}
</style>
