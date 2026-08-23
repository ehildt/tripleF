<script setup lang="ts">
defineProps<{
  summary?: string;
}>();
</script>

<template>
  <section v-if="summary" class="lead">
    <p>{{ summary }}</p>
  </section>
</template>

<style scoped>
.lead {
  font-size: 1.05em;
  color: var(--color-fg-secondary);
  padding-left: 0.75em;
  border-left: 3px solid var(--color-accent-primary);
}

.lead p {
  margin: 0;
  white-space: pre-line;
}
</style>
