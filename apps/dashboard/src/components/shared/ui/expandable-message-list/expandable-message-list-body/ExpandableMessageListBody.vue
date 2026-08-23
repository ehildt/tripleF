<script setup lang="ts">
defineProps<{
  html: string;
}>();
</script>

<template>
  <div class="expandable-message-list__body">
    <!-- eslint-disable-next-line vue/no-v-html -- HTML is pre-sanitized by the consumer via renderHtml -->
    <div v-html="html" />
  </div>
</template>

<style scoped>
.expandable-message-list__body {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  max-height: 200px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.expandable-message-list__body :deep(pre) {
  border-left: 3px solid
    color-mix(in srgb, var(--color-tab-debug) 40%, transparent);
}

.expandable-message-list__body :deep(code) {
  font-size: 0.8em;
}

.expandable-message-list__body :deep(a) {
  transition: color 0.2s ease;
}
</style>
