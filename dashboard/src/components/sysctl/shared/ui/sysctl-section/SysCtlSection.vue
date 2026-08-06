<script setup lang="ts">
/**
 * SysCtl tab section shell: the flex-column container every config tab uses,
 * plus the shared loading / error state. Panels inside it use PanelLayout so
 * the "glassy elevated panel" wrapper is defined once instead of being
 * re-implemented by each section.
 */
withDefaults(
  defineProps<{
    loading?: boolean;
    error?: boolean;
    /** Shown (instead of the section content) while `loading` is true. */
    loadingMessage?: string;
    /** Shown (instead of the section content) when `error` is true. */
    errorMessage?: string;
  }>(),
  {
    loadingMessage: 'Loading…',
    errorMessage: 'Failed to load config.',
  },
);
</script>

<template>
  <div class="sysctl-section">
    <p v-if="loading" class="sysctl-section__state">
      {{ loadingMessage }}
    </p>
    <p
      v-else-if="error"
      class="sysctl-section__state sysctl-section__state--error"
    >
      {{ errorMessage }}
    </p>
    <slot v-else />
  </div>
</template>

<style scoped>
.sysctl-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1);
}

.sysctl-section__state {
  margin: 0;
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.sysctl-section__state--error {
  color: var(--color-status-error);
}
</style>
