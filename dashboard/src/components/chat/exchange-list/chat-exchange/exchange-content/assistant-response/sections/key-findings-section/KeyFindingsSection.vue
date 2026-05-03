<script setup lang="ts">
import { computed } from 'vue';

import type { KeyFinding } from '@/types/harness-response-data.model';

const props = defineProps<{
  title: string;
  items?: KeyFinding[];
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
</script>

<template>
  <section v-if="validItems.length" class="findings">
    <h3>{{ title }}</h3>
    <ul>
      <li v-for="(finding, index) in validItems" :key="index">
        {{ finding.text }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.findings ul {
  list-style: none;
  padding: 0;
  margin: 0.5em 0 0;
}

.findings ul li {
  position: relative;
  padding-left: 1.25em;
  margin-bottom: 0.35em;
  color: var(--color-fg-secondary);
}

.findings ul li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  background: var(--color-accent-primary);
}

.findings ul li:nth-child(2)::before {
  background: var(--color-harmony-1);
}

.findings ul li:nth-child(3)::before {
  background: var(--color-harmony-2);
}

.findings ul li:nth-child(4)::before {
  background: var(--color-harmony-3);
}

.findings ul li:nth-child(5)::before {
  background: var(--color-harmony-4);
}
</style>
