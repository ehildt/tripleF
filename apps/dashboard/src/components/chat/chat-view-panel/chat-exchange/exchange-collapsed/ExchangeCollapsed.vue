<script setup lang="ts">
import { computed } from 'vue';

import type { Exchange } from '@/stores/conversation';
import { stripHtml } from '@/utils/strip-html.helper';

import { truncateText } from '../helpers/truncate-text.helper';

const props = defineProps<{
  exchange: Exchange;
  isUser: boolean;
  maxLength?: number;
}>();

const preview = computed(() =>
  truncateText(stripHtml(props.exchange.content), props.maxLength ?? 50),
);
</script>

<template>
  <span
    class="exchange-collapsed"
    :class="isUser ? 'exchange-collapsed--user' : ''"
  >
    {{ preview }}
  </span>
</template>

<style scoped>
.exchange-collapsed {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-fg-muted) 60%, transparent);
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 50ch;
}

.exchange-collapsed--user {
  margin-left: auto;
  text-align: right;
}
</style>
