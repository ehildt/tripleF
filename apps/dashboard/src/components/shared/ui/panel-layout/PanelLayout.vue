<template>
  <div class="panel-layout panel-glow">
    <slot />
  </div>
</template>

<style scoped>
.panel-layout {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}
</style>
