<script setup lang="ts">
/**
 * Storybook-only layout that mirrors the chat's real placement inside
 * `AppMainContent.vue` (12-column grid, gap-4). Without this wrapper,
 * the `Chat` component's `lg:col-span-*` / `lg:col-start-*` classes have
 * nothing to position against and the toolbar floats to the wrong side.
 */
</script>

<template>
  <main class="max-w-[86.5rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
    <div class="chat-app-grid grid grid-cols-1 lg:grid-cols-12 gap-4">
      <slot />
    </div>
  </main>
</template>

<style scoped>
.chat-app-grid {
  min-height: 50vh;
}
</style>
