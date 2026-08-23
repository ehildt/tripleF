<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  rating: number;
  count?: number;
}>();

const maxRatingScale = 5;

const filledCount = computed(() => Math.round(props.rating));

const starItems = computed(() =>
  Array.from({ length: maxRatingScale }, (_, i) => ({
    index: i,
    isFilled: i < filledCount.value,
  })),
);

const ariaLabel = computed(() => {
  const displayRating = Math.min(props.rating, maxRatingScale).toFixed(1);
  if (props.count)
    return `Rating ${displayRating} out of ${maxRatingScale}, based on ${props.count} reviews`;
  return `Rating ${displayRating} out of ${maxRatingScale}`;
});
</script>

<template>
  <span class="star-rating" :aria-label="ariaLabel">
    <span
      v-for="item in starItems"
      :key="item.index"
      class="star-rating__star"
      :class="{ 'star-rating__star--filled': item.isFilled }"
    >
      ★
    </span>
  </span>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: var(--spacing-0-5);
  align-items: center;
  font-size: 0.8em;
}

.star-rating__star {
  color: var(--color-fg-muted);
}

.star-rating__star--filled {
  color: var(--color-status-success);
}
</style>
