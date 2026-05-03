<script setup lang="ts">
/**
 * Storybook-only layout that mirrors how `AppMainContent.vue` places
 * the `Pproc` panel inside its 12-column grid. Without this wrapper,
 * the `lg:col-span-6` classes on `<Pproc>` have nothing to position
 * against.
 */
</script>

<template>
  <main class="max-w-[86.5rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
    <div class="pproc-app-grid grid grid-cols-1 lg:grid-cols-12 gap-4">
      <slot />
    </div>
  </main>
</template>

<style scoped>
.pproc-app-grid {
  min-height: 50vh;
}
</style>
