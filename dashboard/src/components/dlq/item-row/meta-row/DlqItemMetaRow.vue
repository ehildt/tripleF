<script setup lang="ts">
import { Database, TriangleAlert } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { formatDate } from '@/utils/format-date.helper';

import Tooltip from '../../../shared/ui/tooltip/Tooltip.vue';

const props = defineProps<{
  queueName: string;
  attemptsMade: number;
  totalAttempts: number;
  failedAt: string | null;
}>();

const { locale, t } = useI18n();

/** Poison-pill signal: the job exhausted every attempt it was given. */
const isExhausted = computed(() => props.attemptsMade >= props.totalAttempts);

const attemptsLabel = computed(() =>
  t('common.attemptsCount', { count: props.attemptsMade }),
);
</script>

<template>
  <div class="dlq-item-meta-row">
    <span class="dlq-item-meta-row__field">
      <Database class="dlq-item-meta-row__icon" />{{ queueName }}
    </span>
    <Tooltip
      :text="isExhausted ? t('common.poisonPill') : ''"
      :disabled="!isExhausted"
    >
      <span
        class="dlq-item-meta-row__field"
        :class="{ 'dlq-item-meta-row__field--exhausted': isExhausted }"
      >
        <TriangleAlert
          v-if="isExhausted"
          class="dlq-item-meta-row__icon dlq-item-meta-row__icon--warning"
        />
        {{ attemptsMade }}/{{ totalAttempts }}
        {{ attemptsLabel }}
      </span>
    </Tooltip>
    <span class="dlq-item-meta-row__field">
      {{ formatDate(failedAt, locale) }}
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

.dlq-item-meta-row__field--exhausted {
  color: var(--color-status-warning);
  font-weight: 700;
}

.dlq-item-meta-row__icon--warning {
  color: var(--color-status-warning);
}
</style>
