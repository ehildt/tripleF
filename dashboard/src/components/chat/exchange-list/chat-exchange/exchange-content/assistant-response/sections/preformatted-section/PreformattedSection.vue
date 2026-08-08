<script setup lang="ts">
import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';

defineProps<{
  title?: string;
  content?: string;
}>();
</script>

<template>
  <section v-if="content" class="content">
    <SectionTitle v-if="title" :title="title" />
    <pre><code>{{ content }}</code></pre>
  </section>
</template>

<style scoped>
.content pre {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
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
