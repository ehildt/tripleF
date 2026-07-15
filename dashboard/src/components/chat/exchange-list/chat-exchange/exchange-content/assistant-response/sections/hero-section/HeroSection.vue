<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

<template>
  <div v-if="title || subtitle" class="hero-section">
    <h1 v-if="title">{{ title }}</h1>
    <h2 v-if="subtitle">{{ subtitle }}</h2>
  </div>
</template>

<style scoped>
.hero-section {
  display: flex;
  flex-direction: column;
  gap: 0.35em;
}

h1 {
  font-size: 1.5em;
  line-height: 1.25;
  margin: 0;
  color: var(--color-fg-primary);
}

h2 {
  font-size: 1em;
  font-weight: 500;
  color: var(--color-fg-muted);
  margin: 0;
  line-height: 1.4;
}
</style>
