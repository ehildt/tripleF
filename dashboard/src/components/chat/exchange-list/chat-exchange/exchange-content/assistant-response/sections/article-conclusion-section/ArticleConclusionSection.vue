<script setup lang="ts">
defineProps<{
  conclusion?: string;
}>();
</script>

<template>
  <footer v-if="conclusion" class="conclusion">
    <p>{{ conclusion }}</p>
  </footer>
</template>

<style scoped>
.conclusion {
  padding-top: 0.75em;
  border-top: 1px solid var(--color-divider);
  font-size: 0.95em;
  color: var(--color-fg-muted);
  font-style: italic;
}

.conclusion p {
  margin: 0;
  white-space: pre-line;
}
</style>
