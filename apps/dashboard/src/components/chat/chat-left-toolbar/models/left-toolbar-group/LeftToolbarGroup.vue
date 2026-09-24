<template>
  <div class="left-toolbar-group">
    <slot />
  </div>
</template>

<style scoped>
.left-toolbar-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
}
</style>
