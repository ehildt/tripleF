<script setup lang="ts">
import { useHealthTile } from './composables/use-health-tile.composable';
import type { HealthTileProps } from './HealthTile.types';

const props = defineProps<HealthTileProps>();

const { Icon, borderStyle, statusColorStyle, tileBackStyle, displayStatus } =
  useHealthTile(props);
</script>

<template>
  <div class="health-tile" :style="{ ...tileBackStyle, ...borderStyle }">
    <div class="health-tile__main">
      <Icon class="health-tile__icon" :style="statusColorStyle" />
      <span class="health-tile__name">
        {{ name }}
      </span>
    </div>
    <span class="health-tile__status" :style="statusColorStyle">
      {{ displayStatus }}
    </span>
  </div>
</template>

<style scoped>
.health-tile {
  height: 2.5rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-1) 0.625rem;
  gap: var(--spacing-2);
  border-width: 1px;
  border-style: solid;
}

.health-tile__main {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.health-tile__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.health-tile__name {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: text;
}

.health-tile__status {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  flex-shrink: 0;
  user-select: text;
}
</style>
