<script setup lang="ts">
/**
 * Shown while a pending exchange compacts the conversation history: a
 * battery-fill animation next to a pulsing status line.
 */
</script>

<template>
  <span class="compacting-indicator">
    <span class="compacting-indicator__battery">
      <span class="compacting-indicator__battery-fill" />
    </span>
    <span class="compacting-indicator__text">Compacting conversation…</span>
  </span>
</template>

<style scoped>
.compacting-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-fg-muted);
}

.compacting-indicator__battery {
  width: 4rem;
  height: 0.375rem;
  position: relative;
  overflow: hidden;
  background-color: var(--color-bg-tertiary);
  display: inline-block;
}

.compacting-indicator__battery-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 50%;
  background-color: var(--color-loading);
  /* keyframes battery-slide: global, from style.css */
  animation: battery-slide 1.5s ease-in-out infinite;
}

.compacting-indicator__text {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  /* keyframes pulse: global, from the Tailwind theme */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
