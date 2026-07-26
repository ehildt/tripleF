<script setup lang="ts">
import { computed } from 'vue';

import type { Exchange } from '@/stores/conversation';

import ChatExchange from '../chat-exchange/ChatExchange.vue';

const props = defineProps<{
  exchange: Exchange;
  index: number;
  highlighted: boolean;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  delete: [exchangeId: string];
  retry: [exchangeId: string];
  branch: [exchangeId: string];
  toggleIncluded: [exchangeId: string];
  hoverDeleteStart: [exchangeId: string];
  hoverDeleteEnd: [];
}>();

const shouldAddTopMargin = computed(
  () => props.exchange.role === 'user' && props.index > 0,
);
</script>

<template>
  <div
    :data-exchange-id="exchange.id"
    class="exchange-row"
    :class="{
      'exchange-row--spaced': shouldAddTopMargin,
    }"
  >
    <ChatExchange
      :exchange="exchange"
      :highlighted="highlighted"
      :collapsed="collapsed"
      @delete="emit('delete', $event)"
      @retry="emit('retry', $event)"
      @branch="emit('branch', $event)"
      @toggle-included="emit('toggleIncluded', $event)"
      @hover-delete-start="emit('hoverDeleteStart', $event)"
      @hover-delete-end="emit('hoverDeleteEnd')"
    />
  </div>
</template>

<style scoped>
.exchange-row {
  /* Avoid content-visibility because it reports an estimated scrollHeight while
   * rows are off-screen, then re-layouts when they enter the viewport. That
   * makes the chat history scroll position jump unpredictably.
   * No `contain` at all: EVERY containment type that optimizes rows (layout
   * and paint) establishes a fixed-position containing block, which would
   * re-anchor the floating video popup to this row instead of the viewport. */
}

.exchange-row--spaced {
  margin-top: 1.5rem;
}
</style>
