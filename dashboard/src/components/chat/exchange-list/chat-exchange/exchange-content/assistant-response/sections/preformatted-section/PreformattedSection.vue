<script setup lang="ts">
defineProps<{
  title?: string;
  content?: string;
}>();
</script>

<template>
  <section v-if="content" class="content">
    <h3 v-if="title">{{ title }}</h3>
    <pre><code>{{ content }}</code></pre>
  </section>
</template>

<style scoped>
.content pre {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
  border-radius: 6px;
  padding: 1em;
  overflow-x: auto;
  font-size: 0.92em;
  line-height: 1.55;
}

.content code {
  font-family: var(--font-mono, ui-monospace, monospace);
  white-space: pre-wrap;
}
</style>
