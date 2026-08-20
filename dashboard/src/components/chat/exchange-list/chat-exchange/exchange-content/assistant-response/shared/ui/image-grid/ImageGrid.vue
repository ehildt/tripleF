<script setup lang="ts">
/**
 * The shared image tile grid: a responsive grid of ImageListItem tiles.
 * Rendered by the image gallery's list presentation and by the imagelist
 * template, so both grids stay visually and behaviorally identical.
 */
import ImageListItem from '../image-list-item/ImageListItem.vue';
import type { ImageGridProps } from './ImageGrid.types';

defineProps<ImageGridProps>();
</script>

<template>
  <ul class="image-grid">
    <ImageListItem
      v-for="(item, index) in items"
      :key="`${item.imageUrl}-${index}`"
      :item="item"
    />
  </ul>
</template>

<style scoped>
.image-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-2);
}
</style>
