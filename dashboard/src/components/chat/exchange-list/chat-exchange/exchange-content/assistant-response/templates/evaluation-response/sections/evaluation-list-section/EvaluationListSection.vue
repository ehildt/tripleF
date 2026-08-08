<script setup lang="ts">
import { computed } from 'vue';

import type { KeyFinding } from '@/types/harness-response-data.model';

import { pickCycleColor } from '../../../../shared/helpers/pick-cycle-color.helper';
import SectionTitle from '../../../../shared/ui/section-title/SectionTitle.vue';

const props = defineProps<{
  title: string;
  items?: KeyFinding[];
  variant?: 'strength' | 'weakness' | 'recommendation';
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

const icon = computed(() => {
  switch (props.variant) {
    case 'strength':
      return '+';
    case 'weakness':
      return '−';
    case 'recommendation':
      return '→';
    default:
      return '•';
  }
});
</script>

<template>
  <section v-if="validItems.length" class="evaluation-list" :class="variant">
    <SectionTitle :title="title" />
    <ul>
      <li
        v-for="(item, index) in validItems"
        :key="index"
        :style="{ '--item-color': pickCycleColor(index) }"
      >
        <span class="icon" aria-hidden="true">{{ icon }}</span>
        <span class="text">{{ item.text }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.evaluation-list ul {
  list-style: none;
  padding: var(--spacing-3);
  margin: 0.5em 0 0;
  background-color: var(--color-bg-secondary);
}

.evaluation-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
  margin-bottom: 0.35em;
  color: var(--color-fg-secondary);
}

.icon {
  flex-shrink: 0;
  font-weight: 700;
  width: 1.25em;
  text-align: center;
}

.text {
  line-height: 1.5;
}

.strength .icon {
  color: var(--color-status-success);
}

.weakness .icon {
  color: var(--color-status-error);
}

.recommendation .icon {
  /* Recommendations are neutral arrows — the colour cycles so the list
     reads as a row of distinct cards, like sources/key findings. */
  color: var(--item-color, var(--color-accent-primary));
}
</style>
