<script setup lang="ts">
import SectionTitle from '../../section-title/SectionTitle.vue';
import type { CarouselHeaderProps } from './CarouselHeader.types';

defineProps<CarouselHeaderProps>();
const emit = defineEmits<{ select: [index: number] }>();
</script>

<template>
  <div
    class="carousel-header"
    :class="{ 'carousel-header--single': count <= 1 }"
  >
    <SectionTitle v-if="title" :id="titleId" :title="title" />
    <div
      class="carousel-header__dots"
      role="tablist"
      :aria-label="$t('common.imageNavigation')"
    >
      <button
        v-for="(_, index) in count"
        :key="index"
        type="button"
        class="carousel-header__dot"
        :class="{ 'carousel-header__dot--playing': index === playingIndex }"
        :data-index="index"
        :aria-label="$t('common.imageN', { index: index + 1 })"
        role="tab"
        :aria-selected="index === activeIndex"
        :tabindex="index === activeIndex ? 0 : -1"
        @click="emit('select', index)"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-2);
  padding: 0 var(--spacing-2);
}

/* The title must not carry its block margin inside the flex row — the gap
   to the track is owned by .carousel-content, and a bottom margin would
   offset the dots off the title's center line. */
.carousel-header :deep(.section-title) {
  margin: 0;
}

.carousel-header--single .carousel-header__dots {
  display: none;
}

.carousel-header__dots {
  display: flex;
  gap: var(--spacing-1);
  margin-left: auto;
}

.carousel-header__dot {
  width: 0.5rem;
  height: 0.5rem;
  border: 0;
  background: var(--color-fg-muted);
  opacity: 0.4;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.carousel-header__dot[aria-selected='true'] {
  opacity: 1;
  transform: scale(1.25);
  background: var(--color-accent-primary);
}

/* The dot of the currently playing video — violet. The higher-specificity
   selector keeps it violet even when the playing slide is also the
   centered (active) one. */
.carousel-header__dot--playing,
.carousel-header__dot[aria-selected='true'].carousel-header__dot--playing {
  background: var(--color-status-violet);
  opacity: 1;
}
</style>
