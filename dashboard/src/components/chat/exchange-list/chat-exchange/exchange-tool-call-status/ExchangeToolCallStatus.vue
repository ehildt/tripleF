<script setup lang="ts">
import { Globe, LayoutTemplate, Settings, Sparkles } from '@lucide/vue';
import { computed } from 'vue';

import type { Exchange } from '@/stores/conversation';

import { getToolCallQuery } from '../helpers/get-tool-call-query.helper';

const props = defineProps<{
  exchange: Exchange;
}>();

type StatusKind = 'searching' | 'compacting' | 'preparing' | 'rendering';

interface StatusEntry {
  kind: StatusKind;
  icon: typeof Globe;
  text: string;
  isSpinning: boolean;
}

const statusEntry = computed<StatusEntry | null>(() => {
  const tc = props.exchange.toolCall;
  if (!tc) return null;
  if (tc.name === 'render' && tc.status === 'compacting') {
    return {
      kind: 'rendering',
      icon: LayoutTemplate,
      text: 'Rendering…',
      isSpinning: false,
    };
  }
  switch (tc.status) {
    case 'running':
      return {
        kind: 'searching',
        icon: Globe,
        text: `Searching for "${getToolCallQuery(tc.input)}"`,
        isSpinning: false,
      };
    case 'compacting':
      return {
        kind: 'compacting',
        icon: Settings,
        text: 'Finalizing output…',
        isSpinning: true,
      };
    case 'preparing':
      return {
        kind: 'preparing',
        icon: Sparkles,
        text: 'Almost ready…',
        isSpinning: false,
      };
    default:
      return null;
  }
});
</script>

<template>
  <div v-if="statusEntry" class="tool-call-status">
    <component
      :is="statusEntry.icon"
      :class="[
        'tool-call-status__icon',
        statusEntry.isSpinning ? 'tool-call-status__icon--spinning' : '',
      ]"
    />
    <span class="tool-call-status__text">{{ statusEntry.text }}</span>
  </div>
</template>

<style scoped>
.tool-call-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.tool-call-status__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-accent-primary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.tool-call-status__icon--spinning {
  animation: spin 1s linear infinite;
}

.tool-call-status__text {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-accent-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
