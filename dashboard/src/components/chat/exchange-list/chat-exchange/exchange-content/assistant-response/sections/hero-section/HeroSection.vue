<script setup lang="ts">
defineProps<{
  category?: string;
  title?: string;
  subtitle?: string;
}>();
</script>

<template>
  <div v-if="category || title || subtitle" class="hero-section">
    <p v-if="category" class="category">{{ category }}</p>
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

.category {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-primary);
  border: 1px solid var(--color-accent-primary);
  border-radius: 999px;
  padding: 0.2em 0.75em;
  margin-bottom: 0.4em;
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
