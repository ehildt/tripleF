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
  <footer class="exchange-lightbox__footer">
    <div class="exchange-lightbox__dots">
      <button
        v-for="(_, i) in count"
        :key="i"
        type="button"
        class="exchange-lightbox__dot"
        :class="{ 'exchange-lightbox__dot--active': i === activeIndex }"
        @click.stop="emit('selectIndex', i)"
      />
    </div>
    <span class="exchange-lightbox__counter">
      {{ activeIndex + 1 }} / {{ count }}
    </span>
  </footer>
</template>

<style scoped>
.exchange-lightbox__footer {
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
  .exchange-lightbox__dot {
    width: 0.5rem;
    height: 0.5rem;
  }
}

.exchange-lightbox__dots {
  display: flex;
  justify-content: center;
  gap: var(--spacing-1-5);
  flex-wrap: wrap;
}

.exchange-lightbox__dot {
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

.exchange-lightbox__dot:hover {
  background-color: color-mix(in srgb, var(--color-fg-muted) 50%, transparent);
}

.exchange-lightbox__dot--active {
  background-color: var(--color-accent-primary);
  transform: scale(1.25);
}

/* Mobile: smaller counter font size */
@media (max-width: 639px) {
  .exchange-lightbox__counter {
    font-size: 0.75rem;
  }
}

.exchange-lightbox__counter {
  font-size: 0.875rem;
  color: var(--color-fg-secondary);
  font-family: var(--font-mono);
  padding-bottom: 1rem;
}
</style>
