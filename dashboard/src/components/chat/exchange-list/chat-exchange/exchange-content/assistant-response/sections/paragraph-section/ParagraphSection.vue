<script setup lang="ts">
defineProps<{
  title?: string;
  content?: string;
}>();
</script>

<template>
  <section v-if="content" class="content">
    <h3 v-if="title">{{ title }}</h3>
    <p>{{ content }}</p>
  </section>
</template>

<style scoped>
.content h3 {
  font-size: 1.1em;
  color: var(--color-fg-primary);
  margin: 0 0 0.35em;
  padding-bottom: 0.25em;
  border-bottom: 1px solid var(--color-divider);
}

.content p {
  line-height: 1.65;
  white-space: pre-line;
}
</style>
