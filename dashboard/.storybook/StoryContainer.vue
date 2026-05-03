<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean;
    centered?: boolean;
    width?: string;
  }>(),
  {
    padded: true,
    centered: true,
    width: '100%',
  },
);
</script>

<template>
  <div
    class="story-container"
    :class="{
      'story-container--padded': padded,
      'story-container--centered': centered,
    }"
    :style="{ maxWidth: width }"
  >
    <slot />
  </div>
</template>

<style scoped>
.story-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 50vh;
  width: calc(100% - 20rem);
  background-color: var(--color-bg-primary);
  color: var(--color-fg-primary);
  font-family: var(--font-sans);
  margin: 0 auto;
}

/* Children must not exceed the container width — otherwise wide content
   (e.g. a `<pre>` block in a PromptList story) would push the layout
   out of the iframe and break horizontal alignment. */
.story-container > :deep(*) {
  max-width: 100%;
  min-width: 0;
}

.story-container--padded {
  padding: 1.5rem;
}

.story-container--centered {
  align-items: center;
  justify-content: center;
}
</style>
