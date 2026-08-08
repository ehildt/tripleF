<script setup lang="ts">
/**
 * Quote header of a single-instrument stock card: the instrument title
 * with its optional subtitle. Presentational.
 */
defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

<template>
  <header class="stockmarket-item-header">
    <div>
      <h2 class="stockmarket-item-header__title">{{ title }}</h2>
      <p v-if="subtitle" class="stockmarket-item-header__subtitle">
        {{ subtitle }}
      </p>
    </div>
  </header>
</template>

<style scoped>
.stockmarket-item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-3);
}

.stockmarket-item-header__title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-fg-primary);
}

.stockmarket-item-header__subtitle {
  margin: 0;
  color: var(--color-fg-muted);
}
</style>
