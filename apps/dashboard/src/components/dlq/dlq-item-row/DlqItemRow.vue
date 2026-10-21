<script setup lang="ts">
import { computed } from 'vue';

import { resolveFailureText } from '../helpers/resolve-failure-text.helper';
import DlqItemActions from './dlq-item-actions/DlqItemActions.vue';
import DlqItemMetaRow from './dlq-item-meta-row/DlqItemMetaRow.vue';
import DlqRequestIdBadge from './dlq-request-id-badge/DlqRequestIdBadge.vue';
import DlqStatusBadge from './dlq-status-badge/DlqStatusBadge.vue';
import type { DlqItemRowEmits, DlqItemRowProps } from './DlqItemRow.types';

/**
 * One DLQ list entry: identity badges and metadata on the left (with the
 * failure text — the first thing operators scan for), the action column
 * (`DlqItemActions`) on the right.
 */
const props = defineProps<DlqItemRowProps>();

const emit = defineEmits<DlqItemRowEmits>();

/** Why the job failed — the first thing operators scan for in a DLQ list. */
const failureText = computed(() => resolveFailureText(props.entry));
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
        <DlqRequestIdBadge :job-name="entry.jobName" />
        <DlqStatusBadge :status="entry.status" />
      </div>
      <DlqItemMetaRow
        :queue-name="entry.queueName"
        :attempts-made="entry.attemptsMade"
        :total-attempts="entry.totalAttempts"
        :failed-at="entry.failedAt"
      />
      <p v-if="failureText" class="dlq-item-row__failure">{{ failureText }}</p>
    </div>
    <DlqItemActions
      :entry="entry"
      @retry="emit('retry', $event)"
      @archive="emit('archive', $event)"
      @delete="emit('delete', $event)"
    />
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
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
}

.dlq-item-row__failure {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-status-error);
  overflow-wrap: anywhere;
}

.dlq-item-row__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
</style>
