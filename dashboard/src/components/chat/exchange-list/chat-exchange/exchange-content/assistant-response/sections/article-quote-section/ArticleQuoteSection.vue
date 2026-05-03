<script setup lang="ts">
defineProps<{
  quote?: string;
}>();
</script>

<template>
  <section v-if="quote" class="quote">
    <blockquote>
      <p>{{ quote }}</p>
    </blockquote>
  </section>
</template>

<style scoped>
.quote blockquote {
  margin: 0;
  padding: 0.75em 1em;
  border-left: 4px solid var(--color-accent-primary);
  background: color-mix(in srgb, var(--color-accent-primary) 5%, transparent);
  border-radius: 0 6px 6px 0;
  font-style: italic;
  font-size: 1em;
  color: var(--color-fg-primary);
}

.quote blockquote p {
  margin: 0;
  white-space: pre-line;
}
</style>
