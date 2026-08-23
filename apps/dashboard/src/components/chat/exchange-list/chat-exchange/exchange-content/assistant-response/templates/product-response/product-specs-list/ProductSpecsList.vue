<script setup lang="ts">
/**
 * Full spec table: eyebrow heading plus label/value rows separated by
 * hairlines — editorial style, no box, no zebra, no truncation.
 */
import { computed } from 'vue';

import type { KeyFinding } from '@/types/harness-response-data.model';

import { splitSpecLabel } from '../../../shared/helpers/split-spec-label.helper';
import EyebrowTitle from '../../../shared/ui/eyebrow-title/EyebrowTitle.vue';

const props = defineProps<{ items: readonly KeyFinding[] }>();

const rows = computed(() =>
  (props.items ?? []).map((item) => splitSpecLabel(item.text)),
);
</script>

<template>
  <section class="spec-list">
    <EyebrowTitle :title="$t('common.keySpecs')" />
    <ul class="spec-list__table">
      <li v-for="(row, idx) in rows" :key="idx" class="spec-list__row">
        <template v-if="row.label">
          <span class="spec-list__label">{{ row.label }}</span>
          <span class="spec-list__value">{{ row.value }}</span>
        </template>
        <span v-else class="spec-list__value spec-list__value--full">
          {{ row.value }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.spec-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
}

.spec-list__table {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.spec-list__row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
  padding: var(--spacing-1-5) 0;
  border-bottom: 1px solid var(--color-divider);
}

.spec-list__row:first-child {
  border-top: 1px solid var(--color-divider);
}

.spec-list__label {
  flex-shrink: 0;
  width: 9rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.spec-list__value {
  min-width: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
}

.spec-list__value--full {
  color: var(--color-fg-secondary);
}

@media (max-width: 40rem) {
  .spec-list__label {
    width: 6.5rem;
  }
}
</style>
