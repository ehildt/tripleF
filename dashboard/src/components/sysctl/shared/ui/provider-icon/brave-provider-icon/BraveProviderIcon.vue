<script setup lang="ts">
defineProps<{
  active?: boolean;
}>();
</script>

<template>
  <svg
    class="brave-provider-icon"
    :class="{ 'brave-provider-icon--active': active }"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Brave"
  >
    <path
      class="brave-provider-icon__path"
      d="M12 2 8.5 4h7L12 2zm7.5 3-1.5 4 2 6-2.5 5H16l-4 3-4-3H6.5l-2.5-5 2-6L4.5 5h15zm-9 4.5 1.5 4h-3l1.5-4z"
    />
  </svg>
</template>

<style scoped>
.brave-provider-icon {
  width: 1rem;
  height: 1rem;
}

.brave-provider-icon__path {
  fill: currentColor;
}
</style>
