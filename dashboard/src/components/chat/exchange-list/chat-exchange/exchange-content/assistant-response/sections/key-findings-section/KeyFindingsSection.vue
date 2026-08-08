<script setup lang="ts">
import { computed } from 'vue';

import type { KeyFinding } from '@/types/harness-response-data.model';

import { pickCycleColor } from '../../shared/helpers/pick-cycle-color.helper';
import { splitSpecLabel } from '../../shared/helpers/split-spec-label.helper';
import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';

const props = defineProps<{
  items?: KeyFinding[];
  /** Heading above the list; omit for embedded use (e.g. stockmarket grid). */
  title?: string;
}>();

const validItems = computed(() =>
  (props.items ?? []).filter(
    (item): item is KeyFinding =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as KeyFinding).text === 'string' &&
      (item as KeyFinding).text.trim().length > 0,
  ),
);

/** Findings as label/value rows, mirroring the fundamentals cards. */
const rows = computed(() =>
  validItems.value.map((finding) => splitSpecLabel(finding.text)),
);
</script>

<template>
  <section v-if="rows.length" class="key-findings">
    <SectionTitle v-if="title" :title="title" />
    <ul>
      <li
        v-for="(row, index) in rows"
        :key="index"
        class="key-findings__tag"
        :style="{ '--finding-color': pickCycleColor(index) }"
      >
        <template v-if="row.label">
          <span class="key-findings__label">{{ row.label }}</span>
          <span class="key-findings__value">{{ row.value }}</span>
        </template>
        <span v-else class="key-findings__value">{{ row.value }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.key-findings ul {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Same card treatment as the stockmarket fundamentals: muted uppercase
   label over the prominent value, mono, centered, harmony colour rhythm
   on the value. */
.key-findings__tag {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  padding: var(--spacing-2) var(--spacing-3);
  font-family: var(--font-mono);
  text-align: center;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
}

.key-findings__label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.key-findings__value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--finding-color, var(--color-accent-primary));
  overflow-wrap: anywhere;
}
</style>
