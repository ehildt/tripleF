<script setup lang="ts">
defineProps<{
  active?: boolean;
}>();
</script>

<template>
  <svg
    class="browserbase-provider-icon"
    :class="{ 'browserbase-provider-icon--active': active }"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Browserbase"
  >
    <path
      class="browserbase-provider-icon__path"
      d="M4 6h16v2H4zm0 5h10v2H4zm0 5h14v2H4z"
    />
  </svg>
</template>

<style scoped>
.browserbase-provider-icon {
  width: 1rem;
  height: 1rem;
}

.browserbase-provider-icon__path {
  fill: currentColor;
}
</style>
