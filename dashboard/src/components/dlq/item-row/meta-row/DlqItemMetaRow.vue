<script setup lang="ts">
import { Database } from '@lucide/vue';

import { formatDate } from '@/utils/format-date.helper';

defineProps<{
  queueName: string;
  attemptsMade: number;
  totalAttempts: number;
  failedAt: string | null;
}>();
</script>

<template>
  <div class="dlq-item-meta-row">
    <span class="dlq-item-meta-row__field">
      <Database class="dlq-item-meta-row__icon" />{{ queueName }}
    </span>
    <span class="dlq-item-meta-row__field">
      {{ attemptsMade }} {{ attemptsMade === 1 ? 'attempt' : 'attempts' }}
    </span>
    <span class="dlq-item-meta-row__field">
      {{ formatDate(failedAt) }}
    </span>
  </div>
</template>

<style scoped>
.dlq-item-meta-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-0-5);
}

.dlq-item-meta-row__field {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}

.dlq-item-meta-row__icon {
  width: 0.75rem;
  height: 0.75rem;
  display: inline;
  margin-right: var(--spacing-1);
}
</style>
