<script setup lang="ts">
import { ChevronLeft, ChevronRight, X } from '@lucide/vue';

defineProps<{
  images: readonly string[];
  index: number;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  prev: [];
  next: [];
  selectIndex: [index: number];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="exchange-lightbox" @click.self="emit('close')">
      <button class="exchange-lightbox__close" @click="emit('close')">
        <X class="exchange-lightbox__close-icon" />
      </button>

      <div class="exchange-lightbox__stage">
        <button
          v-if="index > 0"
          class="exchange-lightbox__nav exchange-lightbox__nav--prev"
          @click.stop="emit('prev')"
        >
          <ChevronLeft class="exchange-lightbox__nav-icon" />
        </button>

        <img
          :src="images[index]"
          class="exchange-lightbox__image"
          @click.stop
        />

        <button
          v-if="index < images.length - 1"
          class="exchange-lightbox__nav exchange-lightbox__nav--next"
          @click.stop="emit('next')"
        >
          <ChevronRight class="exchange-lightbox__nav-icon" />
        </button>

        <div class="exchange-lightbox__dots">
          <button
            v-for="(_, i) in images"
            :key="i"
            class="exchange-lightbox__dot"
            :class="i === index ? 'exchange-lightbox__dot--active' : ''"
            @click.stop="emit('selectIndex', i)"
          />
        </div>
      </div>

      <div class="exchange-lightbox__counter">
        {{ index + 1 }} / {{ images.length }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.exchange-lightbox {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: color-mix(
    in srgb,
    var(--color-bg-primary) 80%,
    transparent
  );
  user-select: none;
}

.exchange-lightbox__close {
  position: absolute;
  top: var(--spacing-4);
  right: var(--spacing-4);
  padding: var(--spacing-2);
  color: color-mix(in srgb, var(--color-fg-inverse) 80%, transparent);
  background: none;
  border: none;
  cursor: pointer;
  z-index: 10;
  transition: color 0.2s ease;
}

.exchange-lightbox__close:hover {
  color: var(--color-fg-inverse);
}

.exchange-lightbox__close-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.exchange-lightbox__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
}

.exchange-lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  padding: var(--spacing-6);
  color: color-mix(in srgb, var(--color-fg-inverse) 60%, transparent);
  background: none;
  border: none;
  cursor: pointer;
  z-index: 10;
  transition: color 0.2s ease;
}

.exchange-lightbox__nav:hover {
  color: var(--color-fg-inverse);
}

.exchange-lightbox__nav--prev {
  left: 0;
}

.exchange-lightbox__nav--next {
  right: 0;
}

.exchange-lightbox__nav-icon {
  width: 2.5rem;
  height: 2.5rem;
}

.exchange-lightbox__image {
  width: 48rem;
  height: 48rem;
  object-fit: contain;
  user-select: none;
}

.exchange-lightbox__dots {
  position: absolute;
  bottom: var(--spacing-3);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  z-index: 10;
}

.exchange-lightbox__dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background-color: color-mix(
    in srgb,
    var(--color-fg-inverse) 30%,
    transparent
  );
  border: none;
  cursor: pointer;
  padding: 0;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.exchange-lightbox__dot:hover {
  background-color: color-mix(
    in srgb,
    var(--color-fg-inverse) 50%,
    transparent
  );
}

.exchange-lightbox__dot--active {
  background-color: var(--color-fg-inverse);
  transform: scale(1.25);
}

.exchange-lightbox__counter {
  position: absolute;
  bottom: var(--spacing-6);
  left: 50%;
  transform: translateX(-50%);
  color: color-mix(in srgb, var(--color-fg-inverse) 70%, transparent);
  font-size: 0.875rem;
  font-family: var(--font-mono);
  z-index: 10;
}
</style>
