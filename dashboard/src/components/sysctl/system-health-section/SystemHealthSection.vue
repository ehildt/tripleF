<script setup lang="ts">
import type { HealthTileViewModel } from '../types/health-tile-view-model.type';
import HealthTile from './health-tile/HealthTile.vue';

defineProps<{
  tiles: HealthTileViewModel[];
}>();
</script>

<template>
  <div class="system-health-section__grid">
    <HealthTile
      v-for="tile in tiles"
      :key="tile.key"
      :name="tile.key"
      :status="tile.status"
      :loading="tile.loading"
      :error="tile.error"
    />
  </div>
</template>

<style scoped>
.system-health-section__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>
