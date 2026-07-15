<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'accent';
}>();
</script>

<template>
  <span class="pill" :class="{ 'pill--accent': variant === 'accent' }"
    ><slot
  /></span>
</template>

<style scoped>
.pill {
  font-size: 0.675rem;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
  white-space: nowrap;
}

.pill--accent {
  color: var(--color-accent-primary);
}
</style>
