<script setup lang="ts">
defineProps<{
  requestId: string;
}>();
</script>

<template>
  <span
    class="dlq-request-id-badge"
    :style="{
      background:
        'linear-gradient(to right, var(--color-tab-debug) 25%, transparent)',
    }"
  >
    {{ requestId }}
  </span>
</template>

<style scoped>
.dlq-request-id-badge {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  padding: var(--spacing-0-5) var(--spacing-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
