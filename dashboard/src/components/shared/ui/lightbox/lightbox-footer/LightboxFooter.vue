<script setup lang="ts">
defineProps<{
  count: number;
  activeIndex: number;
}>();

const emit = defineEmits<{
  (e: 'selectIndex', index: number): void;
}>();
</script>

<template>
  <footer class="lightbox__footer">
    <div class="lightbox__dots">
      <button
        v-for="(_, i) in count"
        :key="i"
        type="button"
        class="lightbox__dot"
        :class="{ 'lightbox__dot--active': i === activeIndex }"
        @click.stop="emit('selectIndex', i)"
      />
    </div>
    <span class="lightbox__counter"> {{ activeIndex + 1 }} / {{ count }} </span>
  </footer>
</template>

<style scoped>
.lightbox__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1-5);
  width: 100%;
  padding-top: var(--spacing-2);
  border-top: 1px solid
    color-mix(in srgb, var(--color-divider) 70%, transparent);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
}

/* Mobile: smaller dots for tight screens */
@media (max-width: 639px) {
  .lightbox__dot {
    width: 0.5rem;
    height: 0.5rem;
  }
}

.lightbox__dots {
  display: flex;
  justify-content: center;
  gap: var(--spacing-1-5);
  flex-wrap: wrap;
}

.lightbox__dot {
  width: 0.625rem;
  height: 0.625rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 30%, transparent);
  border: none;
  cursor: pointer;
  padding: 0;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.lightbox__dot:hover {
  background-color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
}

.lightbox__dot--active {
  background-color: var(--color-accent-primary);
  transform: scale(1.25);
}

/* Mobile: smaller counter font size */
@media (max-width: 639px) {
  .lightbox__counter {
    font-size: 0.75rem;
  }
}

.lightbox__counter {
  font-size: 0.875rem;
  color: var(--color-fg-secondary);
  font-family: var(--font-mono);
  padding-bottom: 1rem;
}
</style>
