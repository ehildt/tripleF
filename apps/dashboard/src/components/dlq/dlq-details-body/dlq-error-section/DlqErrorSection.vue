<script setup lang="ts">
import type { DlqErrorSectionProps } from './DlqErrorSection.types';

defineProps<DlqErrorSectionProps>();
</script>

<template>
  <div class="dlq-error-section">
    <h4 class="dlq-error-section__title">
      {{ $t('common.failedReason') }}
    </h4>
    <div class="dlq-error-section__body">
      {{ failureText }}
    </div>
    <pre v-if="failureRaw" class="dlq-error-section__raw">{{ failureRaw }}</pre>
  </div>
</template>

<style scoped>
.dlq-error-section {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.dlq-error-section__title {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-status-error);
}

.dlq-error-section__body {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-status-error);
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 5%,
    transparent
  );
  padding: var(--spacing-2);
  border: 1px solid
    color-mix(in srgb, var(--color-status-error) 20%, transparent);
  overflow-wrap: anywhere;
}

/* Complex failure objects (Zod / AI-SDK validation) in full, formatted. */
.dlq-error-section__raw {
  margin: 0;
  padding: var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.5;
  color: var(--color-fg-secondary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  overflow-x: auto;
}
</style>
