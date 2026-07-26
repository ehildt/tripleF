<template>
  <div class="panel-header">
    <slot />
  </div>
</template>

<style scoped>
/* Fixed height: every panel header in a row lines up, regardless of
   whether it holds just a title or icon buttons. */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
  height: 3rem;
  flex-shrink: 0;
  padding: 0 var(--spacing-4);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
}
</style>
