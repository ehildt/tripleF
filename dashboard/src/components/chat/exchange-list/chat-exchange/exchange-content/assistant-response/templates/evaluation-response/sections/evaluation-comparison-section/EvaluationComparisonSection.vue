<script setup lang="ts">
import SectionTitle from '../../../../shared/ui/section-title/SectionTitle.vue';
import type { EvaluationComparisonSectionProps } from './EvaluationComparisonSection.types';

defineProps<EvaluationComparisonSectionProps>();
</script>

<template>
  <section class="evaluation-comparison">
    <SectionTitle :title="title" />
    <p v-if="summary" class="evaluation-comparison__summary">{{ summary }}</p>

    <div v-if="rows.length" class="evaluation-comparison__table-wrap">
      <table class="evaluation-comparison__matrix">
        <thead>
          <tr>
            <th scope="col" />
            <th
              v-for="column in columns"
              :key="column.name"
              scope="col"
              class="evaluation-comparison__subject"
              :class="{
                'evaluation-comparison__subject--winner': column.winner,
              }"
            >
              {{ column.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.name">
            <th scope="row" class="evaluation-comparison__criterion">
              {{ row.name }}
            </th>
            <td
              v-for="cell in row.cells"
              :key="cell.column"
              class="evaluation-comparison__cell"
              :class="{ 'evaluation-comparison__cell--winner': cell.winner }"
            >
              {{ cell.text }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="winner" class="evaluation-comparison__winner">
      <strong>{{ $t('common.winner') }}:</strong> {{ winner }}
    </p>
    <p v-if="verdict" class="evaluation-comparison__verdict">{{ verdict }}</p>
  </section>
</template>

<style scoped>
.evaluation-comparison {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  padding: var(--spacing-3);
  background-color: var(--color-bg-tertiary);
}

.evaluation-comparison__summary {
  margin: 0;
  color: var(--color-fg-secondary);
  line-height: 1.6;
  white-space: pre-line;
}

/* Horizontal scroll keeps wide subject matrices readable on narrow chats. */
.evaluation-comparison__table-wrap {
  overflow-x: auto;
  background-color: var(--color-bg-secondary);
  margin-block: var(--spacing-3);
}

.evaluation-comparison__matrix {
  width: 100%;
  border-collapse: collapse;
}

.evaluation-comparison__matrix th,
.evaluation-comparison__matrix td {
  padding: 0.5em 0.75em;
  border-bottom: 1px solid var(--color-divider);
  text-align: left;
}

.evaluation-comparison__subject {
  color: var(--color-fg-primary);
}

.evaluation-comparison__subject--winner {
  color: var(--color-accent-primary);
}

.evaluation-comparison__criterion {
  color: var(--color-fg-secondary);
  font-weight: 500;
}

.evaluation-comparison__cell {
  color: var(--color-fg-secondary);
  font-variant-numeric: tabular-nums;
}

.evaluation-comparison__cell--winner {
  color: var(--color-fg-primary);
  font-weight: 600;
}

.evaluation-comparison__winner {
  margin: 0;
  color: var(--color-fg-primary);
}

.evaluation-comparison__winner strong {
  color: var(--color-accent-primary);
}

.evaluation-comparison__verdict {
  margin: 0;
  color: var(--color-fg-primary);
  line-height: 1.5;
}
</style>
