<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

<template>
  <div v-if="title || subtitle" class="hero-section">
    <h2 v-if="title" class="hero-section__title">{{ title }}</h2>
    <p v-if="subtitle" class="hero-section__subtitle">{{ subtitle }}</p>
  </div>
</template>

<style scoped>
.hero-section {
  display: flex;
  flex-direction: column;
  gap: 0.35em;
  padding: 1rem 0.5rem;
  background-color: var(--color-bg-tertiary);
}

.hero-section__title {
  font-size: 1.25em;
  line-height: 1.25;
  margin: 0;
  color: var(--color-fg-primary);
}

.hero-section__subtitle {
  font-size: 1em;
  font-weight: 500;
  color: var(--color-fg-muted);
  margin: 0;
  line-height: 1.4;
}
</style>
