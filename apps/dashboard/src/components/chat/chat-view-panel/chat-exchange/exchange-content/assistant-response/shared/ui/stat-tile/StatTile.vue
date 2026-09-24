<script setup lang="ts">
/**
 * Mono label/value stat card: muted uppercase label over a prominent value,
 * centered on a tertiary box with a hairline border. Polymorphic root — `li`
 * for key-findings tags (inside a ul), or `div` with dt/dd children for
 * stockmarket fundamentals (inside a dl), so the definition-list semantics
 * survive. The accent color rides `--stat-tile-color`, set by the caller
 * (e.g. `pickCycleColor(index)`).
 */
import { computed } from 'vue';

import type { StatTileProps } from './StatTile.types';

const props = withDefaults(defineProps<StatTileProps>(), {
  as: 'li',
});

const labelTag = computed(() => (props.as === 'div' ? 'dt' : 'span'));
const valueTag = computed(() => (props.as === 'div' ? 'dd' : 'span'));
</script>

<template>
  <component
    :is="as"
    class="stat-tile"
    :style="tint ? { '--stat-tile-color': tint } : undefined"
  >
    <component :is="labelTag" v-if="label" class="stat-tile__label">{{
      label
    }}</component>
    <component :is="valueTag" class="stat-tile__value">{{ value }}</component>
  </component>
</template>

<style scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  padding: var(--spacing-2) var(--spacing-3);
  font-family: var(--font-mono);
  text-align: center;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
}

.stat-tile__label {
  display: block;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.stat-tile__value {
  display: block;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--stat-tile-color, var(--color-accent-primary));
  overflow-wrap: anywhere;
}
</style>
