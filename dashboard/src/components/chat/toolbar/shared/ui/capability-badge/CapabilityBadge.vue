<script setup lang="ts">
defineProps<{
  capability: string;
}>();
</script>

<template>
  <span class="capability-badge">
    {{ capability }}
  </span>
</template>

<style scoped>
.capability-badge {
  font-size: 0.625rem;
  padding: var(--spacing-0-5) var(--spacing-1);
  border-radius: 0.25rem;
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
  color: var(--color-accent-primary);
  font-family: var(--font-mono);
  line-height: 1.25;
}
</style>
