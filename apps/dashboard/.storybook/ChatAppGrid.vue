<script setup lang="ts">
/**
 * Storybook-only layout that mirrors the chat's real placement inside
 * `App.vue`'s `.app-main-content__grid` (12-column grid, 1rem gap at the
 * `lg` breakpoint). Without this wrapper, the `Chat` component's
 * `chat__left-toolbar` / `chat__main` / `chat__right-toolbar` grid-column
 * rules have nothing to position against and the toolbar floats to the
 * wrong side.
 */
</script>

<template>
  <main class="chat-app-grid">
    <div class="chat-app-grid__grid">
      <slot />
    </div>
  </main>
</template>

<style scoped>
.chat-app-grid {
  max-width: 86.5rem;
  margin-left: auto;
  margin-right: auto;
  padding: 6rem var(--spacing-4) 2.5rem;
}

@media (min-width: 640px) {
  .chat-app-grid {
    padding-left: var(--spacing-6);
    padding-right: var(--spacing-6);
  }
}

@media (min-width: 1024px) {
  .chat-app-grid {
    padding-left: var(--spacing-8);
    padding-right: var(--spacing-8);
  }
}

.chat-app-grid__grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--spacing-4);
  min-height: 50vh;
}

@media (min-width: 1024px) {
  .chat-app-grid__grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
}
</style>
