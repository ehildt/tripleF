<script setup lang="ts">
defineProps<{
  active?: boolean;
}>();
</script>

<template>
  <svg
    class="searxng-provider-icon"
    :class="{ 'searxng-provider-icon--active': active }"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="SearXNG"
  >
    <circle
      class="searxng-provider-icon__circle"
      cx="11"
      cy="11"
      r="7"
      stroke="currentColor"
      stroke-width="2"
    />
    <line
      class="searxng-provider-icon__line"
      x1="16"
      y1="16"
      x2="21"
      y2="21"
      stroke="currentColor"
      stroke-width="2"
    />
  </svg>
</template>

<style scoped>
.searxng-provider-icon {
  width: 1rem;
  height: 1rem;
}
</style>
