<script setup lang="ts">
import { Archive, Database, RefreshCcw, Trash2 } from 'lucide-vue-next';
import { computed } from 'vue';

import type { VisionDlq } from '../../types/vision-dlq.model';
import { formatDate } from '../../utils/formatting.helper';

const props = defineProps<{
  entry: VisionDlq;
  isSelected?: boolean;
}>();

defineEmits<{
  (e: 'toggleSelection', requestId: string): void;
  (e: 'retry', requestId: string): void;
  (e: 'archive', requestId: string): void;
  (e: 'delete', requestId: string): void;
}>();

const statusColor = computed(() => {
  switch (props.entry.status) {
    case 'PENDING_RETRY':
      return 'text-[var(--color-tab-debug)] border-[var(--color-tab-debug)]/40';
    case 'REINSERTED':
      return 'text-status-success border-status-success/40';
    case 'ARCHIVED':
      return 'text-[var(--color-tab-debug)]/60 border-[var(--color-tab-debug)]/20';
    case 'PENDING_DELETION':
      return 'text-status-error/60 border-status-error/30';
    default:
      return 'text-fg-muted border-divider';
  }
});

const isRetryable = computed(() => props.entry.status === 'PENDING_RETRY');
const isArchivable = computed(
  () =>
    props.entry.status !== 'ARCHIVED' &&
    props.entry.status !== 'PENDING_DELETION',
);
const isDeletable = computed(() => props.entry.status !== 'PENDING_DELETION');
const isSelectable = computed(() => props.entry.status !== 'PENDING_DELETION');
</script>

<template>
  <div
    class="flex items-center justify-between px-4 py-3 border-b border-divider transition-colors hover:bg-tertiary/30 cursor-pointer group"
  >
    <div class="flex items-center gap-3 min-w-0">
      <input
        type="checkbox"
        :checked="isSelected"
        :disabled="!isSelectable"
        class="dlq-checkbox"
        :class="{ 'opacity-40 cursor-not-allowed': !isSelectable }"
        @click.stop="isSelectable && $emit('toggleSelection', entry.requestId)"
      />

      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-mono font-bold px-2 py-0.5 truncate"
            :style="{
              background:
                'linear-gradient(to right, var(--color-tab-debug)40, transparent)',
            }"
          >
            {{ entry.requestId }}
          </span>
          <span
            class="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 border"
            :class="statusColor"
          >
            {{ entry.status }}
          </span>
        </div>
        <div class="flex items-center gap-2 mt-0.5">
          <span class="text-[10px] font-mono text-fg-muted">
            <Database class="w-3 h-3 inline mr-1" />{{ entry.queueName }}
          </span>
          <span class="text-[10px] font-mono text-fg-muted">
            {{ entry.attemptsMade }}/{{ entry.totalAttempts }} attempts
          </span>
          <span class="text-[10px] font-mono text-fg-muted">
            {{ formatDate(entry.failedAt) }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-1 shrink-0">
      <button
        v-if="isRetryable"
        class="p-1.5 text-status-success hover:bg-status-success/10 transition-colors"
        @click.stop="$emit('retry', entry.requestId)"
      >
        <RefreshCcw class="w-3.5 h-3.5" />
      </button>
      <button
        v-if="isArchivable"
        class="p-1.5 text-status-warning hover:bg-status-warning/10 transition-colors"
        @click.stop="$emit('archive', entry.requestId)"
      >
        <Archive class="w-3.5 h-3.5" />
      </button>
      <button
        v-if="isDeletable"
        class="p-1.5 text-status-error hover:bg-status-error/10 transition-colors"
        @click.stop="$emit('delete', entry.requestId)"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
