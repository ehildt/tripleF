<script setup lang="ts">
defineProps<{
  active?: boolean;
}>();
</script>

<template>
  <svg
    class="serper-provider-icon"
    :class="{ 'serper-provider-icon--active': active }"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Serper"
  >
    <path
      class="serper-provider-icon__path"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"
    />
  </svg>
</template>

<style scoped>
.serper-provider-icon {
  width: 1rem;
  height: 1rem;
}

.serper-provider-icon__path {
  fill: currentColor;
}
</style>
