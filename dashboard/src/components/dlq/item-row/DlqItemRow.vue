<script setup lang="ts">
import { Archive, RotateCcw, Trash2 } from '@lucide/vue';
import { computed } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqActionIconButton from './action-button/DlqActionIconButton.vue';
import { useDlqActionAvailability } from './composables/use-dlq-action-availability';
import DlqItemMetaRow from './meta-row/DlqItemMetaRow.vue';
import DlqRequestIdBadge from './request-id-badge/DlqRequestIdBadge.vue';
import DlqStatusBadge from './status-badge/DlqStatusBadge.vue';

const props = defineProps<{
  entry: DlqEntry;
  isRead?: boolean;
  isActive?: boolean;
}>();

const emit = defineEmits<{
  (e: 'retry', requestId: string): void;
  (e: 'archive', requestId: string): void;
  (e: 'delete', requestId: string): void;
}>();

const entryStatus = computed(() => props.entry.status);
const { isRetryable, isArchivable, isDeletable } =
  useDlqActionAvailability(entryStatus);
</script>

<template>
  <div
    class="dlq-item-row"
    :class="{
      'dlq-item-row--read': isRead && !props.isActive,
      'dlq-item-row--active': props.isActive,
    }"
  >
    <div class="dlq-item-row__lead">
      <div class="dlq-item-row__header">
        <DlqRequestIdBadge :request-id="entry.requestId" />
        <DlqStatusBadge :status="entry.status" />
      </div>
      <DlqItemMetaRow
        :queue-name="entry.queueName"
        :attempts-made="entry.attemptsMade"
        :total-attempts="entry.totalAttempts"
        :failed-at="entry.failedAt"
      />
    </div>
    <div class="dlq-item-row__actions">
      <DlqActionIconButton
        v-if="isRetryable"
        :icon="RotateCcw"
        :tint="0"
        :visible="true"
        @click="emit('retry', entry.requestId)"
      />
      <DlqActionIconButton
        :icon="Archive"
        :tint="0.65"
        :visible="isArchivable"
        @click="emit('archive', entry.requestId)"
      />
      <DlqActionIconButton
        :icon="Trash2"
        :tint="1"
        :visible="isDeletable"
        @click="emit('delete', entry.requestId)"
      />
    </div>
  </div>
</template>

<style scoped>
.dlq-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-divider);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dlq-item-row:hover {
  background-color: color-mix(
    in srgb,
    var(--color-bg-tertiary) 30%,
    transparent
  );
}

.dlq-item-row--read {
  opacity: 0.3;
}

.dlq-item-row--active {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 15%,
    transparent
  );
}

.dlq-item-row__lead {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
}

.dlq-item-row__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.dlq-item-row__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}
</style>
